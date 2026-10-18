import { NextResponse, type NextRequest } from "next/server";
import { anilistFailed } from "@/lib/apiError";
import { LIMITS, clientKey, tooMany } from "@/lib/rateLimit";
import { getMyMedia } from "@/lib/anilist";

/** Дані AniList для сторінки «Мої аніме»: /api/my-media?ids=1,2,3 (до 500 id). */
export async function GET(request: NextRequest) {
  const limit = LIMITS.myMedia.take(clientKey(request.headers));
  if (!limit.ok) return tooMany(limit.retryAfter);
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 500);
  if (ids.length === 0) return NextResponse.json([]);
  try {
    return NextResponse.json(await getMyMedia(ids));
  } catch (error) {
    return anilistFailed(error);
  }
}
