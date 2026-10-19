import { expect, test } from "@playwright/test";
import { db, login, messagesFor, skipWithoutAccount, snapshot } from "./helpers";

/** Рекомендації: збій AniList — сторінка сама пробує ще раз, далі кнопка «Спробувати ще раз». */

const m = messagesFor("uk");

test("збій рекомендацій → ще одна спроба сама, потім кнопка «Спробувати ще раз»", async ({ page }) => {
  skipWithoutAccount(test.info());
  await login(page);

  let calls = 0;
  let broken = true;
  await page.route("**/api/recommendations", async (route) => {
    calls++;
    if (broken) await route.fulfill({ status: 502, json: { error: "anilist", status: 429 } });
    else await route.continue();
  });

  await page.goto("/uk/recommendations");
  await expect(page.getByText(m.recs.error)).toBeVisible({ timeout: 30_000 });
  // Перша спроба й ще одна сама, через кілька секунд.
  expect(calls).toBe(2);

  broken = false;
  await page.getByRole("button", { name: m.common.retry }).click();
  await expect(page.locator("main a[href*='/uk/anime/']").first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(m.recs.error)).toHaveCount(0);
  expect(calls).toBe(3);
});

test("аніме зі списку не радимо жодною частиною — навіть передісторію, що вийшла пізніше", async ({ page, request }) => {
  skipWithoutAccount(test.info());
  test.setTimeout(120_000);
  // Fate/stay night (2006) і Bakemonogatari (2009): їхні передісторії Fate/Zero і Kizumonogatari вийшли пізніше.
  const listed = [356, 5081];
  const restore = await snapshot(listed);
  const { rest, userId } = await db();
  try {
    await rest(`list_entries?user_id=eq.${userId}&media_id=in.(${listed.join(",")})`, { method: "DELETE", headers: { prefer: "return=minimal" } });
    await rest("list_entries", {
      method: "POST",
      body: JSON.stringify(listed.map((media_id) => ({ user_id: userId, media_id, status: "completed", score: 9 }))),
      headers: { prefer: "return=minimal" },
    });
    // Як на Vercel, коли AniList відмовляє: браузер не дізнався частин — відсіяти мусить сервер.
    await page.route("**/api/franchises*", (route) => route.fulfill({ status: 502, json: { error: "anilist" } }));
    await login(page);
    await page.goto("/uk/recommendations");
    await expect(page.locator("main a[href*='/uk/anime/']").first()).toBeVisible({ timeout: 60_000 });
    const shown = await page.$$eval("main a[href*='/uk/anime/']", (as) => as.map((a) => Number(a.getAttribute("href")!.split("/").pop())));

    const res = await request.get(`/api/franchises?ids=${listed.join(",")}`);
    const franchises = (await res.json()) as Record<number, { main: { id: number }[]; extras: { id: number }[] }>;
    const parts = new Set(listed.flatMap((id) => [id, ...[...franchises[id].main, ...franchises[id].extras].map((p) => p.id)]));
    expect(parts.has(10087), "Fate/Zero — частина Fate/stay night").toBe(true);
    expect(shown.filter((id) => parts.has(id))).toEqual([]);
  } finally {
    await restore();
  }
});
