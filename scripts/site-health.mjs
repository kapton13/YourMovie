/**
 * Перевірка живого сайту (робот GitHub щогодини, див. .github/workflows/site-health.yml).
 * Відкриває головні сторінки й перевіряє, що AniList відповідає. Пише звіт у файл (для задачі в GitHub)
 * і завершується з кодом 1, якщо щось не так.
 *
 * Запуск вручну: node scripts/site-health.mjs [звіт.md]
 * Адреса сайту — SITE_URL (типово https://your-movie-five.vercel.app).
 */
import { writeFile } from "node:fs/promises";

const SITE = (process.env.SITE_URL || "https://your-movie-five.vercel.app").replace(/\/$/, "");
const REPORT = process.argv[2];

// Є дані про аніме — є постери з AniList (текст помилки не годиться: словник сторінки містить його завжди).
const hasPosters = (html) => html.includes("s4.anilist.co");

async function timed(url, init) {
  const started = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
    const text = await res.text();
    return { status: res.status, text, ms: Date.now() - started };
  } catch (error) {
    return { status: 0, text: String(error), ms: Date.now() - started };
  }
}

const checks = [];
async function check(name, run) {
  try {
    const problem = await run();
    checks.push({ name, ok: !problem, note: problem ?? "" });
  } catch (error) {
    checks.push({ name, ok: false, note: String(error) });
  }
}

// 1. AniList: працює чи вимкнений для всіх.
let anilistDown = false;
await check("AniList (джерело даних)", async () => {
  const r = await timed("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: "{ Media(id: 1) { id } }" }),
  });
  if (r.status === 200 && r.text.includes('"id":1')) return null;
  anilistDown = true;
  const message = /"message"\s*:\s*"([^"]+)"/.exec(r.text)?.[1];
  return `відповідь ${r.status}${message ? `: ${message}` : ""}`;
});

// 2. Сторінки сайту.
const pages = [
  ["Головна", "/uk", hasPosters],
  ["Каталог", "/uk/catalog?sort=popular", hasPosters],
  ["Сторінка аніме", "/uk/anime/16498", hasPosters],
  ["Вхід", "/uk/login", () => true],
];
for (const [name, path, looksRight] of pages) {
  await check(`${name} (${path})`, async () => {
    const r = await timed(SITE + path);
    if (r.status !== 200) return `відповідь ${r.status}`;
    if (!looksRight(r.text)) return "сторінка відкрилась, але без даних про аніме";
    if (r.ms > 10_000) return `дуже повільно: ${(r.ms / 1000).toFixed(1)} с`;
    return null;
  });
}

// 3. Дані для «Моїх аніме» (через наш сервер до AniList).
await check("Дані «Моїх аніме» (/api/my-media)", async () => {
  const r = await timed(`${SITE}/api/my-media?ids=16498`);
  if (r.status !== 200) return `відповідь ${r.status}: ${r.text.slice(0, 160)}`;
  return r.text.includes('"id":16498') ? null : "немає даних";
});

const broken = checks.filter((c) => !c.ok);
const lines = [
  broken.length === 0 ? "✅ Усе працює." : anilistDown ? "⚠️ AniList не відповідає — сайт без даних про аніме." : "❌ Сайт працює неправильно.",
  "",
  ...checks.map((c) => `- ${c.ok ? "✅" : "❌"} ${c.name}${c.note ? ` — ${c.note}` : ""}`),
  "",
  `Перевірено: ${new Date().toISOString()} · ${SITE}`,
];
console.log(lines.join("\n"));
if (REPORT) await writeFile(REPORT, lines.join("\n") + "\n");
// Для робота: що саме не так (задача в GitHub називається по-різному).
if (process.env.GITHUB_OUTPUT) {
  const state = broken.length === 0 ? "ok" : anilistDown ? "anilist-down" : "site-broken";
  await writeFile(process.env.GITHUB_OUTPUT, `state=${state}\n`, { flag: "a" });
}
process.exit(broken.length === 0 ? 0 : 1);
