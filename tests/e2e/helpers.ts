import { expect, type Page, type TestInfo } from "@playwright/test";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { fmt } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { messagesFor } from "@/messages";

export const account = { email: process.env.E2E_EMAIL ?? "", password: process.env.E2E_PASSWORD ?? "" };
export const hasAccount = Boolean(account.email && account.password);
export const NO_ACCOUNT = "немає тестового акаунта: E2E_EMAIL / E2E_PASSWORD (див. playwright.config.ts)";

export { fmt, messagesFor };

/** Вхід через форму сайту. */
export async function login(page: Page, lang: Locale = "uk") {
  await page.goto(`/${lang}/login`);
  await page.locator("input[type=email]").fill(account.email);
  await page.locator("input[type=password]").fill(account.password);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL(new RegExp(`/${lang}/account`));
}

/** Помилки сторінки (і помилки в консолі, крім 404 від відсутніх картинок). */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("404")) errors.push(`console: ${m.text().slice(0, 200)}`);
  });
  return errors;
}

/** Сторінка не ширша за екран (немає прокрутки вбік). */
export async function expectNoOverflow(page: Page) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
  expect(scroll, "прокрутка вбік").toBeLessThanOrEqual(width);
}

// ---------------------------------------------------------------------------
// База від імені тестового акаунта (ті самі правила доступу, що й у сайті).

type Rest = (path: string, init?: RequestInit) => Promise<unknown>;

let cached: { rest: Rest; userId: string } | null = null;

export async function db(): Promise<{ rest: Rest; userId: string }> {
  if (cached) return cached;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "content-type": "application/json" },
    body: JSON.stringify(account),
  });
  const token = (await res.json()) as { access_token: string; user: { id: string } };
  if (!token.access_token) throw new Error("тестовий акаунт: не вдалося увійти");
  const rest: Rest = async (path, init = {}) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: `Bearer ${token.access_token}`,
        "content-type": "application/json",
        prefer: "return=representation",
        ...(init.headers ?? {}),
      },
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`${r.status} ${path}: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  };
  cached = { rest, userId: token.user.id };
  return cached;
}

const TABLES = ["list_entries", "episode_marks", "season_scores", "hidden_media"] as const;

/**
 * Запам'ятати записи тестового акаунта для цих аніме й повернути їх після тесту — щоб перевірки
 * нічого не лишали по собі навіть після падіння.
 */
export async function snapshot(mediaIds: number[]) {
  const { rest, userId } = await db();
  const list = mediaIds.join(",");
  const saved: Record<string, Record<string, unknown>[]> = {};
  for (const table of TABLES) saved[table] = (await rest(`${table}?select=*&user_id=eq.${userId}&media_id=in.(${list})`)) as never;
  return async function restore() {
    for (const table of TABLES) {
      await rest(`${table}?user_id=eq.${userId}&media_id=in.(${list})`, { method: "DELETE", headers: { prefer: "return=minimal" } });
      if (saved[table].length)
        await rest(table, { method: "POST", body: JSON.stringify(saved[table]), headers: { prefer: "return=minimal" } });
    }
  };
}

export async function listStatus(mediaId: number): Promise<string | null> {
  const { rest, userId } = await db();
  const rows = (await rest(`list_entries?select=status&user_id=eq.${userId}&media_id=eq.${mediaId}`)) as { status: string }[];
  return rows[0]?.status ?? null;
}

/** Чекати, доки сайт збереже потрібний статус (збереження йде у фоні). */
export async function expectStatus(mediaId: number, status: string | null) {
  await expect.poll(() => listStatus(mediaId), { timeout: 20_000 }).toBe(status);
}

export function skipWithoutAccount(testInfo: TestInfo) {
  testInfo.skip(!hasAccount, NO_ACCOUNT);
}
