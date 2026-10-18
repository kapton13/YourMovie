/**
 * Обмеження запитів (захист від зловживань): «відро з жетонами» на кожну адресу (IP).
 * Кожен запит забирає жетон; жетони поновлюються рівномірно (`perMinute`), запас — `burst`.
 * Пам'ять — у межах одного серверного процесу (на Vercel їх кілька, тож це межа «на процес»):
 * без платних сервісів, але одна адреса вже не завалить сайт і не вичерпає ліміт AniList.
 */

export type Limiter = {
  /** Чи пропустити запит; якщо ні — через скільки секунд можна знову. */
  take(key: string, now?: number): { ok: true } | { ok: false; retryAfter: number };
};

const MAX_KEYS = 20_000;

export function createLimiter({ perMinute, burst }: { perMinute: number; burst: number }): Limiter {
  const buckets = new Map<string, { tokens: number; at: number }>();
  const rate = perMinute / 60_000; // жетонів за мілісекунду
  return {
    take(key, now = Date.now()) {
      if (buckets.size > MAX_KEYS) {
        // Забуваємо повні відра (давно не звертались), щоб пам'ять не росла.
        for (const [k, b] of buckets) if (b.tokens + (now - b.at) * rate >= burst) buckets.delete(k);
        if (buckets.size > MAX_KEYS) buckets.clear();
      }
      const bucket = buckets.get(key) ?? { tokens: burst, at: now };
      const tokens = Math.min(burst, bucket.tokens + (now - bucket.at) * rate);
      if (tokens < 1) {
        buckets.set(key, { tokens, at: now });
        return { ok: false, retryAfter: Math.max(1, Math.ceil((1 - tokens) / rate / 1000)) };
      }
      buckets.set(key, { tokens: tokens - 1, at: now });
      return { ok: true };
    },
  };
}

/** Адреса відвідувача з заголовків (Vercel додає `x-forwarded-for`); невідома — спільний ключ. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

/**
 * Межі для найдорожчих частин сайту (кожна ходить в AniList). Звичайна людина до них не дійде:
 * «Мої аніме» чи профіль роблять кілька запитів, рекомендації — один на сторінку.
 */
export const LIMITS = {
  franchises: createLimiter({ perMinute: 60, burst: 30 }),
  myMedia: createLimiter({ perMinute: 60, burst: 30 }),
  recommendations: createLimiter({ perMinute: 12, burst: 6 }),
  search: createLimiter({ perMinute: 40, burst: 20 }),
};

/** Відповідь «забагато запитів» для API. */
export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(retryAfter) },
  });
}
