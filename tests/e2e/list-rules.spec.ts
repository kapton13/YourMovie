import { expect, test } from "@playwright/test";
import { expectStatus, findAiring, fmt, login, messagesFor, skipWithoutAccount, snapshot } from "./helpers";

/** Правила статусів у справжньому браузері (CLAUDE.md, етап 2; «Переглянуто» для онгоїнгів — 2026-10-15). */

const m = messagesFor("uk");
const YOUR_NAME = 21519; // фільм, 1 серія
const DEATH_NOTE = 1535; // 37 серій, вийшло повністю

test.beforeEach(({}, testInfo) => skipWithoutAccount(testInfo));

test("оцінка не ставить «Переглянуто» — нове аніме йде в «Дивлюся»", async ({ page }) => {
  const restore = await snapshot([YOUR_NAME]);
  try {
    const { rest, userId } = await (await import("./helpers")).db();
    await rest(`list_entries?user_id=eq.${userId}&media_id=eq.${YOUR_NAME}`, { method: "DELETE", headers: { prefer: "return=minimal" } });
    await login(page);
    await page.goto(`/uk/anime/${YOUR_NAME}`, { waitUntil: "networkidle" });
    await page.getByRole("group", { name: m.list.block.animeScoreAria }).getByRole("button", { name: /9/ }).first().click();
    await expectStatus(YOUR_NAME, "watching");
  } finally {
    await restore();
  }
});

test("«Переглянуто весь сезон» → «Переглянуто»; зняти одну серію → «Дивлюся»", async ({ page }) => {
  const restore = await snapshot([DEATH_NOTE]);
  try {
    await login(page);
    await page.goto(`/uk/anime/${DEATH_NOTE}`, { waitUntil: "networkidle" });
    const unmarkAll = page.getByRole("button", { name: m.list.episodes.unmarkAll });
    if (await unmarkAll.isVisible()) {
      await unmarkAll.click();
      await expect(page.getByRole("button", { name: m.list.episodes.markSeason })).toBeVisible();
    }
    await page.getByRole("button", { name: m.list.episodes.markSeason }).click();
    await expectStatus(DEATH_NOTE, "completed");
    await page.getByRole("button", { name: fmt(m.list.episodes.watchedAria, { n: 5 }) }).click();
    await expectStatus(DEATH_NOTE, "watching");
  } finally {
    await restore();
  }
});

test("аніме ще виходить: відмічено все, що вийшло → «Переглянуто»; бракує серії → «Дивлюся»", async ({ page }) => {
  const { id, aired } = await findAiring();
  const restore = await snapshot([id]);
  try {
    await login(page);
    await page.goto(`/uk/anime/${id}`, { waitUntil: "networkidle" });
    for (let n = 1; n <= aired; n++) await page.getByRole("button", { name: fmt(m.list.episodes.markAria, { n }) }).click();
    await expectStatus(id, "completed");
    await page.getByRole("button", { name: fmt(m.list.episodes.watchedAria, { n: aired }) }).click();
    await expectStatus(id, "watching");
    // Після оновлення сторінки й на «Моїх аніме» статус не «злітає».
    await page.getByRole("button", { name: fmt(m.list.episodes.markAria, { n: aired }) }).click();
    await expectStatus(id, "completed");
    await page.goto("/uk/my", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await expectStatus(id, "completed");
  } finally {
    await restore();
  }
});
