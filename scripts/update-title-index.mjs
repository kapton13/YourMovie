/**
 * Оновлює data/title-index.json — словник назв найпопулярніших аніме для пошуку
 * за недописаним словом («frie» → Frieren). AniList такого пошуку не вміє.
 *
 * Запуск: npm run update-titles   (≈2 хв; робот GitHub запускає щотижня — .github/workflows/update-dictionaries.yml)
 */
import { writeFile } from "node:fs/promises";

const PAGES = 60; // 60 × 50 = 3000 найпопулярніших
const QUERY = `
  query ($page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
        id popularity title { romaji english } synonyms
      }
    }
  }
`;

// Лише латиниця й кирилиця: інші письменності для пошуку з нашого сайту не потрібні.
const USEFUL = /^[\p{Script=Latin}\p{Script=Cyrillic}\p{N}\p{P}\p{S}\s]+$/u;

const ANILIST_PAUSE_MS = 2100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { page } }),
    });
    if (res.status === 429 && attempt < 5) {
      const wait = (Number(res.headers.get("retry-after")) || 30) * 1000;
      console.log(`  ліміт запитів, чекаю ${wait / 1000} с…`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    return (await res.json()).data.Page;
  }
}

const entries = [];
for (let page = 1; page <= PAGES; page++) {
  const data = await fetchPage(page);
  for (const m of data.media) {
    // Спершу основні назви, потім кириличні синоніми (для російської версії сайту), потім решта.
    const synonyms = (m.synonyms ?? []).filter((t) => USEFUL.test(t));
    const cyrillic = synonyms.filter((t) => /\p{Script=Cyrillic}/u.test(t));
    const titles = [m.title.english, m.title.romaji, ...cyrillic, ...synonyms]
      .filter((t) => t && USEFUL.test(t))
      .filter((t, i, all) => all.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
      .slice(0, 8);
    entries.push([m.id, m.popularity, ...titles]);
  }
  process.stdout.write(`\r  сторінка ${page}/${PAGES}`);
  if (!data.pageInfo.hasNextPage) break;
  // ≤ 28 запитів за хвилину: ліміт AniList зараз 30, а сайт теж до нього звертається.
  await sleep(ANILIST_PAUSE_MS);
}

// AniList віддав набагато менше, ніж має бути (збій) — не псуємо робочий словник.
if (entries.length < PAGES * 50 * 0.9) throw new Error(`Замало тайтлів (${entries.length}) — словник не змінено.`);
await writeFile(new URL("../data/title-index.json", import.meta.url), JSON.stringify(entries) + "\n");
console.log(`\nГотово: ${entries.length} тайтлів.`);
