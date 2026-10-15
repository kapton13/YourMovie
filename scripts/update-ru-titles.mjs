/**
 * Оновлює data/ru-titles.json — російські назви найпопулярніших аніме з Shikimori
 * ({ id AniList: "назва" }). Сайт показує їх у російській версії без запитів до Shikimori щоразу;
 * для решти аніме — англійська назва (а на сторінці аніме — назва й опис із Shikimori напряму).
 *
 * Запуск: npm run update-ru-titles   (≈5 хв; раз на кілька місяців)
 */
import { writeFile } from "node:fs/promises";

const PAGES = 100; // 100 × 50 = 5000 найпопулярніших (більше AniList у такому списку не віддає)
const ANILIST_QUERY = `
  query ($page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) { id idMal }
    }
  }
`;
const SHIKIMORI_QUERY = `query ($ids: String) { animes(ids: $ids, limit: 50) { malId russian } }`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, body, label) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "YourMovie" },
      body: JSON.stringify(body),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = (Number(res.headers.get("retry-after")) || 20) * 1000;
      console.log(`\n  ${label}: ${res.status}, чекаю ${wait / 1000} с…`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`${label} ${res.status}`);
    return res.json();
  }
}

// 1. Найпопулярніші аніме AniList з їхніми id на MyAnimeList (Shikimori використовує ті самі id).
const pairs = [];
for (let page = 1; page <= PAGES; page++) {
  const data = (await post("https://graphql.anilist.co", { query: ANILIST_QUERY, variables: { page } }, "AniList")).data.Page;
  for (const m of data.media) if (m.idMal) pairs.push([m.id, m.idMal]);
  process.stdout.write(`\r  AniList: сторінка ${page}/${PAGES}`);
  if (!data.pageInfo.hasNextPage) break;
  await sleep(800);
}

// 2. Російські назви з Shikimori — по 50 за запит, не частіше ~1 запиту на секунду.
const byMal = new Map();
for (let i = 0; i < pairs.length; i += 50) {
  const chunk = pairs.slice(i, i + 50);
  const json = await post("https://shikimori.io/api/graphql", { query: SHIKIMORI_QUERY, variables: { ids: chunk.map(([, mal]) => mal).join(",") } }, "Shikimori");
  for (const a of json.data?.animes ?? []) if (a.russian?.trim()) byMal.set(Number(a.malId), a.russian.trim());
  process.stdout.write(`\r  Shikimori: ${Math.min(i + 50, pairs.length)}/${pairs.length}      `);
  await sleep(1100);
}

const result = {};
for (const [id, mal] of pairs) if (byMal.has(mal)) result[id] = byMal.get(mal);
await writeFile(new URL("../data/ru-titles.json", import.meta.url), JSON.stringify(result) + "\n");
console.log(`\nГотово: ${Object.keys(result).length} російських назв з ${pairs.length} аніме.`);
