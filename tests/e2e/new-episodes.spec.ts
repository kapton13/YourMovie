import { expect, test, type Page } from "@playwright/test";
import { db, findAiring, fmt, login, messagesFor, skipWithoutAccount, snapshot } from "./helpers";

/** Кружечок «нові серії» біля «Мої аніме»: аніме з невідміченою свіжою серією — +1; відмітили — зникає. */

const m = messagesFor("uk");

async function badge(page: Page): Promise<number> {
  const text = await page.locator("header .nav-badge").first().textContent({ timeout: 4000 }).catch(() => null);
  return text ? Number(text) : 0;
}

/** Порахувати наново (без пам'яті вкладки) і дочекатися кружечка. */
async function freshBadge(page: Page, expected?: number): Promise<number> {
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/uk", { waitUntil: "networkidle" });
  if (expected !== undefined) await expect.poll(() => badge(page), { timeout: 30_000 }).toBe(expected);
  else await page.waitForTimeout(4000);
  return badge(page);
}

test("нова серія → кружечок +1; відмітили серію → кружечок назад", async ({ page }) => {
  skipWithoutAccount(test.info());
  const { id, aired } = await findAiring();
  const restore = await snapshot([id]);
  const { rest, userId } = await db();
  try {
    await rest(`list_entries?user_id=eq.${userId}&media_id=eq.${id}`, { method: "DELETE", headers: { prefer: "return=minimal" } });
    await rest(`episode_marks?user_id=eq.${userId}&media_id=eq.${id}`, { method: "DELETE", headers: { prefer: "return=minimal" } });
    await login(page);
    const baseline = await freshBadge(page);

    await rest("list_entries", { method: "POST", body: JSON.stringify({ user_id: userId, media_id: id, status: "watching" }), headers: { prefer: "return=minimal" } });
    const marks = Array.from({ length: aired - 1 }, (_, i) => ({ user_id: userId, media_id: id, episode: i + 1, watched: true }));
    if (marks.length) await rest("episode_marks", { method: "POST", body: JSON.stringify(marks), headers: { prefer: "return=minimal" } });
    await freshBadge(page, baseline + 1);
    await expect(page.locator("header .nav-my").first()).toHaveAttribute("aria-label", new RegExp(m.common.nav.myAnime));

    // Відмітили останню серію на сторінці аніме — лічильник перераховується сам.
    await page.goto(`/uk/anime/${id}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: fmt(m.list.episodes.markAria, { n: aired }) }).click();
    await expect.poll(() => badge(page), { timeout: 30_000 }).toBe(baseline);
  } finally {
    await restore();
  }
});
