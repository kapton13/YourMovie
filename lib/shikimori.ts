import { cacheLife } from "next/cache";

/**
 * Shikimori (`shikimori.io`) — російські назви й описи аніме для російської версії сайту.
 * Зіставлення — через id MyAnimeList: в AniList це `idMal`, у Shikimori той самий id.
 */
export type ShikimoriAnime = { russian: string | null; description: string | null; url: string };

const SHIKIMORI_URL = "https://shikimori.io";
const QUERY = `query ($ids: String) { animes(ids: $ids, limit: 1) { russian description } }`;

export async function getShikimoriAnime(malId: number): Promise<ShikimoriAnime | null> {
  "use cache";
  cacheLife("days");

  const res = await fetch(`${SHIKIMORI_URL}/api/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "YourMovie" },
    body: JSON.stringify({ query: QUERY, variables: { ids: String(malId) } }),
  });
  if (!res.ok) throw new Error(`Shikimori: ${res.status}`);
  const json = (await res.json()) as { data?: { animes?: { russian: string | null; description: string | null }[] } };
  const anime = json.data?.animes?.[0];
  if (!anime) return null;
  return { russian: anime.russian?.trim() || null, description: anime.description, url: `${SHIKIMORI_URL}/animes/${malId}` };
}

/**
 * Опис Shikimori — з розміткою на кшталт [character=123]Фрирен[/character], [i]…[/i], [spoiler]…[/spoiler].
 * Лишаємо простий текст абзацами, без спойлерів.
 */
export function shikimoriParagraphs(description: string | null): string[] {
  if (!description) return [];
  return description
    .replace(/\[spoiler(?:=[^\]]*)?\][\s\S]*?\[\/spoiler\]/gi, "")
    .replace(/\[\/?[a-z_]+(?:=[^\]]*)?\]/gi, "")
    .replace(/\r/g, "")
    .split(/\n\s*\n|\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
