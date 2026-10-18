import { expect, test } from "@playwright/test";
import { LOCALES, LOCALE_INFO, type Locale } from "@/lib/i18n/config";
import en from "@/messages/en";
import { collectErrors, expectNoOverflow, messagesFor } from "./helpers";

/**
 * Усі мови сайту гостем: сторінки відкриваються без помилок, мова в адресі й у `<html lang>`,
 * немає прокрутки вбік і немає неперекладеного англійського тексту.
 */

const PAGES = ["", "/catalog", "/catalog?q=naruto", "/anime/16498", "/recommendations", "/login", "/signup"];
const LANGUAGE_NAMES = new Set(Object.values(LOCALE_INFO).map((i) => i.name));

/** Англійські рядки, які в цій мові перекладено інакше: якщо такий рядок видно на сторінці — переклад загубився. */
function englishLeftovers(lang: Locale): Set<string> {
  const out = new Set<string>();
  const walk = (base: unknown, other: unknown) => {
    if (typeof base === "string") {
      if (base.length >= 4 && !base.includes("{") && typeof other === "string" && other !== base) out.add(base);
    } else if (base && typeof base === "object" && other && typeof other === "object")
      for (const key of Object.keys(base)) walk((base as never)[key], (other as never)[key]);
  };
  // Теги англійською — як є, їх не порівнюємо.
  walk({ ...en, tags: {} }, { ...messagesFor(lang), tags: {} });
  return out;
}

for (const lang of LOCALES) {
  test(`мова ${lang}: сторінки гостем на комп'ютері й телефоні`, async ({ page }) => {
    const errors = collectErrors(page);
    const leftovers = lang === "en" ? new Set<string>() : englishLeftovers(lang);
    for (const [path, width] of PAGES.map((p, i) => [p, i % 2 ? 390 : 1366] as const)) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}${path}`);
      // Тиша в мережі — але не довше кількох секунд (рекомендації й картинки догружаються довго).
      await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
      expect(new URL(page.url()).pathname.startsWith(`/${lang}`), path).toBe(true);
      expect(await page.locator("html").getAttribute("lang")).toBe(lang);
      await expectNoOverflow(page);
      const lines = await page.evaluate(() => {
        // Без назв і описів аніме з AniList — лише інтерфейс.
        const clone = document.body.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("h3, main h1, [class*=altTitles], [class*=description], [class*=episodeTitle], script, style").forEach((n) => n.remove());
        return clone.innerText.split("\n").map((s) => s.trim()).filter(Boolean);
      });
      const bad = lines.filter((l) => !LANGUAGE_NAMES.has(l) && (leftovers.has(l) || (!["uk", "ru"].includes(lang) && /[А-Яа-яЇїІіЄєҐґЁё]/.test(l))));
      expect(bad, `неперекладене на /${lang}${path}`).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test("стара адреса без мови веде на мову за замовчуванням", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page).toHaveURL(/\/en\/catalog$/);
});

test("сторінка аніме відкривається без перемальовування (помилка #418)", async ({ browser }) => {
  for (let i = 0; i < 6; i++) {
    const page = await browser.newPage();
    const errors = collectErrors(page);
    await page.goto("/uk/anime/16498", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    expect(errors, `спроба ${i + 1}`).toEqual([]);
    await page.close();
  }
});

test("шапка й меню мов на вузькому телефоні (320 px)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const lang of ["de", "fr", "pt", "ja"] as Locale[]) {
    await page.goto(`/${lang}`, { waitUntil: "networkidle" });
    await expectNoOverflow(page);
  }
  await page.locator("header button[aria-haspopup]:visible").first().click();
  const options = page.getByRole("option");
  await expect(options).toHaveCount(LOCALES.length);
  // Усі мови видно без прокрутки меню.
  for (const option of await options.all()) await expect(option).toBeInViewport();
});

test("обрана мова не «злітає»: «Назад» і старі посилання відкриваються обраною мовою", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/uk");
  await page.goto("/uk/catalog?q=frieren");
  const loads: string[] = [];
  // Справжні завантаження сторінки з сервера (не службові оновлення адреси всередині сторінки).
  page.on("request", (r) => r.isNavigationRequest() && r.frame() === page.mainFrame() && loads.push(new URL(r.url()).pathname));
  await page.locator("header button[aria-haspopup]:visible").first().click();
  await page.getByRole("option", { name: /Deutsch/ }).click();
  await expect(page).toHaveURL(/\/de\/catalog\?q=frieren$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.waitForTimeout(1500);
  expect(loads, "вибір мови — одне перезавантаження, без «туди-назад»").toEqual(["/de/catalog"]);

  await page.goBack();
  await expect(page).toHaveURL(/\/de$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.goto("/uk/anime/16498"); // старе посилання іншою мовою
  await expect(page).toHaveURL(/\/de\/anime\/16498$/);
  expect(errors).toEqual([]);
});
