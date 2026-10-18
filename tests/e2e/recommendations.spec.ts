import { expect, test } from "@playwright/test";
import { login, messagesFor, skipWithoutAccount } from "./helpers";

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
