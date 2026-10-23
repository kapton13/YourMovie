import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * Вага сторінки для телефону: гість не вантажить бібліотеку входу Supabase (≈70 КБ), а вся сторінка — у межах.
 * Хто ввійшов — бібліотеку отримує (уже після появи сторінки) і бачить себе в шапці.
 */

const GUEST_JS_LIMIT_KB = 180;

test("гість: без бібліотеки входу, JavaScript сторінки в межах", async ({ page }) => {
  const scripts: { url: string; gzip: number; supabase: boolean }[] = [];
  page.on("response", async (res) => {
    if (res.request().resourceType() !== "script") return;
    const body = await res.body().catch(() => null);
    if (body) scripts.push({ url: res.url(), gzip: gzipSync(body).length, supabase: body.includes("GoTrueClient") });
  });
  for (const path of ["/uk", "/uk/catalog", "/uk/anime/16498"]) {
    scripts.length = 0;
    await page.goto(path, { waitUntil: "networkidle" });
    const total = scripts.reduce((sum, s) => sum + s.gzip, 0) / 1024;
    expect(scripts.filter((s) => s.supabase).map((s) => s.url), `${path}: бібліотека входу`).toEqual([]);
    expect(total, `${path}: ${Math.round(total)} КБ`).toBeLessThan(GUEST_JS_LIMIT_KB);
  }
});

test("увійшов — бібліотека входу є, людина в шапці", async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL, "немає тестового акаунта");
  const avatar = page.locator("header a[href^='/uk/u/'], header a[href='/uk/account']").first();
  await login(page);
  // Одразу після входу (без перезавантаження) шапка вже знає людину.
  await expect(avatar).toBeVisible();
  await page.goto("/uk", { waitUntil: "networkidle" });
  await expect(avatar).toBeVisible();
  await expect(page.locator("header a[href^='/uk/login']")).toHaveCount(0);
});
