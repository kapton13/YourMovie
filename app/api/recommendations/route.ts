import { NextResponse, type NextRequest } from "next/server";
import { anilistFailed } from "@/lib/apiError";
import { LIMITS, clientKey, tooMany } from "@/lib/rateLimit";
import { LIST_STATUSES, type ListStatus } from "@/lib/lists";
import { buildRecommendations, type RecEntry } from "@/lib/recommendations";

/** Холодний сервер збирає рекомендації кількома запитами до AniList, а той іноді просить зачекати. */
export const maxDuration = 60;

const ids = (value: unknown): number[] =>
  Array.isArray(value) ? value.filter((n): n is number => Number.isInteger(n) && n > 0) : [];

/**
 * Рекомендації за списками людини. Списки читає браузер (вони приватні), тож надсилає сюди
 * лише id, статуси й оцінки: { entries: [{ id, status, score }], hidden: [id] }.
 */
export async function POST(request: NextRequest) {
  const limit = LIMITS.recommendations.take(clientKey(request.headers));
  if (!limit.ok) return tooMany(limit.retryAfter);
  const body = await request.json().catch(() => null);
  const entries: RecEntry[] = (Array.isArray(body?.entries) ? body.entries : [])
    .filter(
      (e: unknown): e is RecEntry =>
        typeof e === "object" &&
        e !== null &&
        Number.isInteger((e as RecEntry).id) &&
        LIST_STATUSES.includes((e as RecEntry).status as ListStatus) &&
        ((e as RecEntry).score === null || typeof (e as RecEntry).score === "number"),
    )
    .slice(0, 2000);
  const hidden = ids(body?.hidden).slice(0, 5000);
  try {
    return NextResponse.json(await buildRecommendations(entries, hidden));
  } catch (error) {
    return anilistFailed(error);
  }
}
