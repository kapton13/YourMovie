import { expect, test } from "@playwright/test";
import { collectErrors, db, fmt, login, messagesFor, skipWithoutAccount, snapshot } from "./helpers";

/** «Не цікаво», профіль і мова профілю для тестового акаунта. Усе змінене повертається як було. */

const m = messagesFor("uk");
const AOT = 16498; // «Атака титанів», сезон 1 — ключ аніме
const AOT_S2 = 20958;

test.beforeEach(({}, testInfo) => skipWithoutAccount(testInfo));

async function hiddenRows(key: number) {
  const { rest, userId } = await db();
  return (await rest(`hidden_media?select=media_id&user_id=eq.${userId}&franchise_key=eq.${key}`)) as { media_id: number }[];
}

test("«Не цікаво» на сезоні 2 ховає все аніме скрізь; «Повернути» повертає все", async ({ page }) => {
  const { rest, userId } = await db();
  const before = (await rest(`hidden_media?select=*&user_id=eq.${userId}&franchise_key=in.(${AOT},${AOT_S2})`)) as object[];
  const clear = () => rest(`hidden_media?user_id=eq.${userId}&franchise_key=in.(${AOT},${AOT_S2})`, { method: "DELETE", headers: { prefer: "return=minimal" } });
  await clear();
  try {
    await login(page);
    await page.goto("/uk/catalog?q=attack%20on%20titan", { waitUntil: "networkidle" });
    const season2 = page.locator("main article", { hasText: "Attack on Titan Season 2" }).first();
    await season2.hover();
    await page.getByRole("button", { name: fmt(m.hidden.crossLabel, { title: "Attack on Titan Season 2" }) }).click();
    await expect.poll(async () => (await hiddenRows(AOT)).length, { timeout: 30_000 }).toBeGreaterThanOrEqual(10);

    const mainSeasons = page.locator("main article h3", { hasText: /^Attack on Titan( Season \d| Final Season)?$/ });
    await page.reload({ waitUntil: "networkidle" });
    await expect(mainSeasons).toHaveCount(0);
    await page.goto(`/uk/anime/38524`, { waitUntil: "networkidle" }); // інше аніме — у «Схожих» AoT немає
    await expect(page.locator("main article h3", { hasText: "Attack on Titan" })).toHaveCount(0);

    await page.goto("/uk/my", { waitUntil: "networkidle" });
    await page.locator("main").getByText(m.hidden.tab).first().click();
    const row = page.locator("main li, main article", { hasText: "Attack on Titan" }).first();
    await row.getByRole("button", { name: m.hidden.restore }).click();
    await expect.poll(async () => (await hiddenRows(AOT)).length).toBe(0);
  } finally {
    await clear();
    if (before.length) await rest("hidden_media", { method: "POST", body: JSON.stringify(before), headers: { prefer: "return=minimal" } });
  }
});

test("частково сховане аніме доповнюється саме при відкритті сайту", async ({ page }) => {
  const { rest, userId } = await db();
  const restore = await snapshot([AOT, AOT_S2]);
  const clear = () => rest(`hidden_media?user_id=eq.${userId}&franchise_key=in.(${AOT},${AOT_S2})`, { method: "DELETE", headers: { prefer: "return=minimal" } });
  try {
    await clear();
    await rest("hidden_media", { method: "POST", body: JSON.stringify([{ user_id: userId, media_id: AOT_S2, franchise_key: AOT_S2 }]), headers: { prefer: "return=minimal" } });
    await login(page);
    await expect.poll(async () => (await hiddenRows(AOT)).length, { timeout: 30_000 }).toBeGreaterThanOrEqual(10);
    expect(await hiddenRows(AOT_S2)).toEqual([]);
  } finally {
    await clear();
    await restore();
  }
});

test("свій профіль: статистика; без AniList — частковий профіль з кнопкою повтору", async ({ page }) => {
  const errors = collectErrors(page);
  await login(page);
  const { rest, userId } = await db();
  const [{ nickname }] = (await rest(`profiles?select=nickname&id=eq.${userId}`)) as { nickname: string }[];
  const url = `/uk/u/${encodeURIComponent(nickname)}`;

  await page.goto(url);
  await expect(page.getByText(m.profile.tiles.anime)).toBeVisible();
  await expect(page.getByText(m.profile.mediaFailed)).toHaveCount(0);

  await page.route("**/api/my-media**", (route) => route.fulfill({ status: 502, body: "{}" }));
  await page.reload();
  await expect(page.getByText(m.profile.mediaFailed)).toBeVisible();
  await expect(page.getByText(m.profile.tiles.anime)).toBeVisible();
  await page.unroute("**/api/my-media**");
  await page.getByRole("button", { name: m.profile.error.retry }).click();
  await expect(page.getByText(m.profile.mediaFailed)).toHaveCount(0);
  await expect(page.getByText(m.profile.tiles.anime)).toBeVisible();

  // Обірвався зв'язок із базою — повідомлення з кнопкою, а не вічне завантаження.
  await page.route("**/rest/v1/**", (route) => route.abort());
  await page.reload();
  await expect(page.getByText(m.profile.error.title)).toBeVisible();
  // Помилки від навмисно «вимкнених» AniList (502) і бази (обірване з'єднання) — очікувані.
  const expected = ["Failed to fetch", "my-media", "ERR_FAILED", "status of 502"];
  expect(errors.filter((e) => !expected.some((x) => e.includes(x)))).toEqual([]);
});

test("закритий профіль гість бачить лише нікнейм", async ({ browser }) => {
  const { rest, userId } = await db();
  const [{ nickname, is_public }] = (await rest(`profiles?select=nickname,is_public&id=eq.${userId}`)) as { nickname: string; is_public: boolean }[];
  test.skip(is_public, "тестовий профіль відкритий");
  const page = await browser.newPage();
  await page.goto(`/uk/u/${encodeURIComponent(nickname)}`);
  await expect(page.getByText(fmt(m.profile.closed, { nickname }))).toBeVisible();
  await expect(page.getByText(m.profile.tiles.anime)).toHaveCount(0);
});

test("мова з шапки зберігається в профілі й діє на іншому пристрої", async ({ page, browser }) => {
  const { rest, userId } = await db();
  const [{ language }] = (await rest(`profiles?select=language&id=eq.${userId}`)) as { language: string | null }[];
  try {
    await login(page, "uk");
    await page.locator("header button[aria-haspopup]:visible").first().click();
    await page.getByRole("option", { name: /Deutsch/ }).click();
    await expect(page).toHaveURL(/\/de\/account/);
    await expect.poll(async () => ((await rest(`profiles?select=language&id=eq.${userId}`)) as { language: string }[])[0].language).toBe("de");

    const other = await browser.newPage();
    await login(other, "en").catch(() => {}); // після входу сайт сам перейде на мову профілю
    await other.goto("/en/catalog");
    await expect(other).toHaveURL(/\/de\/catalog/);
    await other.close();
  } finally {
    await rest(`profiles?id=eq.${userId}`, { method: "PATCH", body: JSON.stringify({ language }), headers: { prefer: "return=minimal" } });
  }
});
