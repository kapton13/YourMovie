import { NextResponse, type NextRequest } from "next/server";
import { getMyMedia } from "@/lib/anilist";

/** Дані AniList для сторінки «Мої аніме»: /api/my-media?ids=1,2,3 (до 500 id). */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 500);
  if (ids.length === 0) return NextResponse.json([]);
  try {
    return NextResponse.json(await getMyMedia(ids));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "anilist" }, { status: 502 });
  }
}
