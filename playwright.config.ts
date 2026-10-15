import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Повні перевірки в браузері (`npm run test:e2e`): справжній сайт, справжні AniList і Supabase, тестовий акаунт.
 * Пошта й пароль тестового акаунта — у змінних E2E_EMAIL / E2E_PASSWORD або у файлі `.env.e2e.local`
 * (у git не потрапляє). Ніколи не вказувати тут справжній акаунт: тести змінюють списки (і повертають як було).
 * Сайт має бути зібраний (`npm run build`); якщо вже запущено на :3100 — використовується він.
 */
if (existsSync(".env.e2e.local")) {
  for (const line of readFileSync(".env.e2e.local", "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  // Один тестовий акаунт і ліміт AniList (30 запитів за хвилину) — по черзі.
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  retries: 0,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
