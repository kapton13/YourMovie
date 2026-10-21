/**
 * Скільки коду завантажує браузер (після `npm run build`): уся JavaScript-частина сайту й найбільший шматок,
 * у стиснутому вигляді (gzip — так його й передає Vercel). Більше за межу з `bundle-budget.json` — помилка:
 * сайт не має непомітно ставати важчим (повільніше на телефоні). Свідомо збільшили — підняти межу там.
 *
 * Запуск: node scripts/bundle-budget.mjs  (робот check.yml — на кожну зміну)
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIR = ".next/static/chunks";
const budget = JSON.parse(await readFile(new URL("../bundle-budget.json", import.meta.url), "utf8"));

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else if (entry.name.endsWith(".js")) out.push(path);
  }
  return out;
}

const sizes = [];
for (const path of await files(DIR)) sizes.push({ path, gzip: gzipSync(await readFile(path)).length });
sizes.sort((a, b) => b.gzip - a.gzip);
const kb = (n) => Math.round(n / 1024);
const total = sizes.reduce((sum, s) => sum + s.gzip, 0);
const largest = sizes[0]?.gzip ?? 0;

console.log(`JavaScript разом: ${kb(total)} КБ (межа ${budget.totalGzipKB}), найбільший шматок: ${kb(largest)} КБ (межа ${budget.largestGzipKB})`);
for (const s of sizes.slice(0, 5)) console.log(`  ${kb(s.gzip)} КБ  ${s.path}`);

const problems = [];
if (kb(total) > budget.totalGzipKB) problems.push(`увесь JavaScript ${kb(total)} КБ > ${budget.totalGzipKB} КБ`);
if (kb(largest) > budget.largestGzipKB) problems.push(`найбільший шматок ${kb(largest)} КБ > ${budget.largestGzipKB} КБ`);
if (problems.length) {
  console.error(`Сайт став важчим: ${problems.join("; ")}. Якщо так і треба — підняти межу в bundle-budget.json.`);
  process.exit(1);
}
