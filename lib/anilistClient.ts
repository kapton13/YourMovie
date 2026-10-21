import { attachRussianTitles } from "./russianTitles";
import { shared } from "./shared";

/**
 * Усі запити до AniList з сервера — лише тут. AniList безкоштовний і просить берегти його: ліміт
 * (зараз 30 запитів за хвилину на сервер), а коли йому погано — він вимикає API для всіх (403).
 * Тому:
 * — не більше MAX_CONCURRENT запитів одночасно (решта чекає в черзі — без сплесків);
 * — однакові запити, що йдуть одночасно, ідуть до AniList один раз;
 * — AniList вимкнений (403) чи збоїть кілька разів поспіль — якийсь час не звертаємося зовсім, сторінки
 *   одразу показують «не вдалося завантажити» з кешу/пам'яті, а не добивають його повторами;
 * — ліміт вичерпано (429) — чекаємо, скільки він каже, а не повторюємо одразу.
 */

const ANILIST_URL = "https://graphql.anilist.co";
const MAX_CONCURRENT = 3;
const TIMEOUT_MS = 15_000;
/** AniList вимкнув API (403): перевіряємо знову не раніше ніж за 5 хв. */
const DISABLED_PAUSE_MS = 5 * 60_000;
/** Кілька збоїв поспіль (5xx, обрив) — пауза. */
const FAILURES_BEFORE_PAUSE = 3;
const FAILURE_PAUSE_MS = 60_000;
/** Ліміт вичерпано, а AniList не сказав, на скільки, — чекаємо хвилину. */
const RATE_LIMIT_PAUSE_MS = 60_000;
/** Коротку паузу ліміту (≤ стількох мс) чекаємо самі; довшу — відмовляємо одразу. */
const MAX_WAIT_MS = 10_000;

export class AniListError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(`AniList: ${status} ${message}`);
  }
}

const state = shared("anilistClient", () => ({
  active: 0,
  queue: [] as (() => void)[],
  inFlight: new Map<string, Promise<unknown>>(),
  /** До цього часу запитів не шлемо: AniList вимкнений або збоїть. */
  unavailableUntil: 0,
  /** До цього часу чекаємо: ліміт запитів вичерпано. */
  pausedUntil: 0,
  failuresInRow: 0,
}));

async function takeSlot() {
  if (state.active < MAX_CONCURRENT) {
    state.active++;
    return;
  }
  // Місце передає той, хто звільняє (`active` не змінюється).
  await new Promise<void>((resolve) => state.queue.push(resolve));
}

function releaseSlot() {
  const next = state.queue.shift();
  if (next) next();
  else state.active--;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function failure(pauseMs: number) {
  state.failuresInRow++;
  if (state.failuresInRow >= FAILURES_BEFORE_PAUSE) state.unavailableUntil = Math.max(state.unavailableUntil, Date.now() + pauseMs);
}

/** Запит до AniList (GraphQL). Помилка — `AniListError`. */
export function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const key = query + JSON.stringify(variables);
  const pending = state.inFlight.get(key);
  if (pending) return pending as Promise<T>;
  const request = send<T>(query, variables).finally(() => state.inFlight.delete(key));
  state.inFlight.set(key, request);
  return request;
}

async function send<T>(query: string, variables: Record<string, unknown>, attempt = 1): Promise<T> {
  if (Date.now() < state.unavailableUntil) throw new AniListError(503, "unavailable, not asking for a while");
  const wait = state.pausedUntil - Date.now();
  if (wait > MAX_WAIT_MS) throw new AniListError(429, "rate limited, not asking for a while");
  if (wait > 0) await sleep(wait);

  if (process.env.ANILIST_DEBUG) console.log("[anilist]", /\w+\s+(\w+)/.exec(query)?.[1], JSON.stringify(variables).slice(0, 120));
  let res: Response;
  await takeSlot();
  try {
    res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Обрив чи AniList не відповів вчасно.
    failure(FAILURE_PAUSE_MS);
    if (attempt === 1) {
      await sleep(1000);
      return send<T>(query, variables, 2);
    }
    throw new AniListError(503, error instanceof Error ? error.message : String(error));
  } finally {
    releaseSlot();
  }

  // Лишився останній запит у хвилині — наступні почекають поновлення.
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (remaining !== null && Number(remaining) <= 1) {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000; // секунди Unix → мс
    state.pausedUntil = Math.max(state.pausedUntil, reset > Date.now() ? reset : Date.now() + 5_000);
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) * 1000;
    const pause = retryAfter > 0 ? retryAfter : RATE_LIMIT_PAUSE_MS;
    state.pausedUntil = Math.max(state.pausedUntil, Date.now() + pause);
    // Коротка пауза — почекаємо й спробуємо ще раз; довга — відмовляємо, не займаючи сервер.
    if (attempt === 1 && pause <= MAX_WAIT_MS) return send<T>(query, variables, 2);
    throw new AniListError(429, "rate limited");
  }
  if (res.status >= 500) {
    failure(FAILURE_PAUSE_MS);
    if (attempt === 1) {
      await sleep(1000);
      return send<T>(query, variables, 2);
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.errors) {
    const error = json?.errors?.[0];
    const status = error?.status ?? res.status;
    // 403 — AniList вимкнув API для всіх (або заблокував нас): не стукаємо кілька хвилин.
    if (status === 403) state.unavailableUntil = Math.max(state.unavailableUntil, Date.now() + DISABLED_PAUSE_MS);
    throw new AniListError(status, error?.message ?? res.statusText);
  }
  state.failuresInRow = 0;
  attachRussianTitles(json.data);
  return json.data as T;
}

/** Лише для перевірок: почати з чистого стану. */
export function resetAniListClient() {
  state.active = 0;
  state.queue.length = 0;
  state.inFlight.clear();
  state.unavailableUntil = 0;
  state.pausedUntil = 0;
  state.failuresInRow = 0;
}
