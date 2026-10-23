/**
 * Нічний робот (.github/workflows/anime-store.yml): оновлює нашу копію даних AniList у Supabase
 * (таблиця `anime_store`, SQL `010`), з якої сайт бере групування аніме, а під час збою AniList — і решту.
 *
 * Що й у якому порядку (найважливіше спершу; час обмежено — решта наступної ночі):
 *  1. аніме зі списків людей: групування (раз на тиждень), картки для «Моїх аніме» (щодня);
 *  2. сторінки й серії цих аніме (серії тих, що виходять, — щодня; решта — рідше);
 *  3. групування найпопулярніших аніме (раз на місяць кожне).
 * AniList береже `lib/anilistClient.ts` (≤ 30 запитів/хв, паузи); вимкнений AniList — робот зупиняється.
 *
 * Запуск: SUPABASE_SECRET_KEY=… npx tsx scripts/sync-anime-store.mts   (ключ — лише в секретах GitHub)
 */
import { AniListError } from "../lib/anilistClient";
import {
  buildEpisodes,
  buildFranchise,
  fetchMediaDetails,
  getMyMediaChunk,
  type Franchise,
  type MyMedia,
} from "../lib/anilist";
import { SUPABASE_URL } from "../lib/supabase/config";

const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
const MINUTES = Number(process.env.MAX_MINUTES ?? 50);
const POPULAR = Number(process.env.POPULAR_COUNT ?? 1000);
const DAY = 24 * 60 * 60 * 1000;
const deadline = Date.now() + MINUTES * 60_000;
const timeLeft = () => Date.now() < deadline;

if (!SECRET) {
  console.error("Немає SUPABASE_SECRET_KEY — робот не може записувати в базу.");
  process.exit(1);
}

// Нові ключі Supabase (sb_secret_…) — лише в apikey; старі (JWT, service_role) — ще й як Authorization.
const headers: Record<string, string> = { apikey: SECRET, "Content-Type": "application/json" };
if (SECRET.startsWith("eyJ")) headers.Authorization = `Bearer ${SECRET}`;

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`Supabase ${res.status} ${path.split("?")[0]}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

/** Усі рядки (Supabase віддає до 1000 за раз). */
async function all<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const page = (await (await rest(path, { headers: { Range: `${from}-${from + 999}` } })).json()) as T[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

type Kind = "franchise" | "part" | "media" | "details" | "episodes";
const written: Record<Kind, number> = { franchise: 0, part: 0, media: 0, details: 0, episodes: 0 };

async function write(rows: { kind: Kind; id: number; data: unknown }[]) {
  const now = new Date().toISOString();
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50).map((r) => ({ ...r, updated_at: now }));
    await rest("anime_store?on_conflict=kind,id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(chunk),
    });
    for (const r of chunk) written[r.kind]++;
  }
}

/** Запит до AniList з однією повторною спробою після хвилини чекання; AniList вимкнений — зупиняємо робота. */
class Stop extends Error {}
async function ask<T>(load: () => Promise<T>): Promise<T | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await load();
    } catch (error) {
      if (error instanceof AniListError && error.status === 403) throw new Stop(String(error));
      if (error instanceof AniListError && error.status === 404) return null;
      console.warn(`  ${String(error).slice(0, 160)}${attempt === 1 ? " — чекаю хвилину" : " — пропускаю"}`);
      if (attempt === 1) await new Promise((r) => setTimeout(r, 60_000));
    }
  }
  return null;
}

// ---- Що вже є в копії ----
const index = new Map<string, number>(); // "kind:id" → коли оновлено
for (const row of await all<{ kind: Kind; id: number; updated_at: string }>("anime_store?select=kind,id,updated_at"))
  index.set(`${row.kind}:${row.id}`, Date.parse(row.updated_at));
const age = (kind: Kind, id: number) => Date.now() - (index.get(`${kind}:${id}`) ?? 0);

const partsOf = (f: Franchise) => [...f.main, ...f.extras].map((p) => p.id);
async function saveFranchise(f: Franchise) {
  await write([
    { kind: "franchise", id: f.key, data: f },
    ...partsOf(f).map((id) => ({ kind: "part" as const, id, data: { key: f.key } })),
  ]);
  for (const id of partsOf(f)) index.set(`part:${id}`, Date.now());
  index.set(`franchise:${f.key}`, Date.now());
}

let stopped = "";
try {
  // ---- 1. Аніме зі списків: групування ----
  const listed = [...new Set((await all<{ media_id: number }>("list_entries?select=media_id")).map((r) => r.media_id))];
  console.log(`Аніме в списках: ${listed.length}`);
  const listedParts = new Set<number>();
  const keep = new Map<number, Franchise>();
  // Свіжі групування — з копії (щоб знати всі частини), решту — з AniList.
  for (let i = 0; i < listed.length; i += 150) {
    const chunk = listed.slice(i, i + 150);
    const parts = await all<{ id: number; data: { key: number } }>(`anime_store?select=id,data&kind=eq.part&id=in.(${chunk.join(",")})`);
    const keys = [...new Set(parts.map((p) => p.data.key))];
    if (keys.length)
      for (const row of await all<{ id: number; data: Franchise }>(`anime_store?select=id,data&kind=eq.franchise&id=in.(${keys.join(",")})`))
        keep.set(row.id, row.data);
    for (const p of parts) if (keep.has(p.data.key) && age("franchise", p.data.key) < 7 * DAY) keep.set(p.id, keep.get(p.data.key)!);
  }
  for (const id of listed) {
    if (!timeLeft()) break;
    let franchise = age("part", id) < 7 * DAY ? keep.get(id) : undefined;
    if (!franchise) {
      franchise = (await ask(() => buildFranchise(id))) ?? undefined;
      if (franchise) await saveFranchise(franchise);
    }
    for (const part of franchise ? partsOf(franchise) : [id]) listedParts.add(part);
  }
  console.log(`Частин аніме зі списків: ${listedParts.size}`);

  // ---- 1б. Картки для «Моїх аніме» — щодня ----
  const parts = [...listedParts].sort((a, b) => a - b);
  const status = new Map<number, string | null>();
  for (let i = 0; i < parts.length && timeLeft(); i += 50) {
    const media = await ask<MyMedia[]>(() => getMyMediaChunk(parts.slice(i, i + 50)));
    if (!media) continue;
    await write(media.map((m) => ({ kind: "media" as const, id: m.id, data: m })));
    for (const m of media) status.set(m.id, m.status);
  }

  // ---- 2. Сторінки (раз на тиждень) і серії (що виходить — щодня, решта — раз на місяць) ----
  for (const id of parts) {
    if (!timeLeft()) break;
    if (age("details", id) > 7 * DAY) {
      const details = await ask(() => fetchMediaDetails(id));
      if (details) await write([{ kind: "details", id, data: details }]);
    }
    const airing = status.get(id) === "RELEASING" || status.get(id) === "NOT_YET_RELEASED";
    if (age("episodes", id) > (airing ? 20 * 60 * 60 * 1000 : 30 * DAY)) {
      const episodes = await ask(() => buildEpisodes(id));
      if (episodes) await write([{ kind: "episodes", id, data: episodes }]);
    }
  }

  // ---- 3. Групування найпопулярніших (раз на місяць кожне) ----
  const { anilist } = await import("../lib/anilistClient");
  for (let page = 1; page <= Math.ceil(POPULAR / 50) && timeLeft(); page++) {
    const data = await ask(() =>
      anilist<{ Page: { media: { id: number }[] } }>(
        `query Popular($page: Int) { Page(page: $page, perPage: 50) { media(type: ANIME, sort: POPULARITY_DESC) { id } } }`,
        { page },
      ),
    );
    for (const { id } of data?.Page.media ?? []) {
      if (!timeLeft()) break;
      if (age("part", id) < 30 * DAY) continue;
      const franchise = await ask(() => buildFranchise(id));
      if (franchise) await saveFranchise(franchise);
    }
  }
} catch (error) {
  if (!(error instanceof Stop)) throw error;
  stopped = `AniList вимкнений — зупинився (${error.message.slice(0, 120)})`;
}

const summary = [
  stopped || (timeLeft() ? "Усе оновлено." : `Час вийшов (${MINUTES} хв) — решта наступної ночі.`),
  `Записано: групувань ${written.franchise}, частин ${written.part}, карток ${written.media}, сторінок ${written.details}, серій ${written.episodes}.`,
].join("\n");
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary.replace(/\n/g, "\n\n") + "\n");
}
