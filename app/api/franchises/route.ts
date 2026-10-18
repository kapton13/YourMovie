import { NextResponse, type NextRequest } from "next/server";
import { LIMITS, clientKey, tooMany } from "@/lib/rateLimit";
import { getFranchises } from "@/lib/anilist";

/** До яких аніме належать частини: /api/franchises?ids=1,2,3 → { id: аніме з усіма частинами }. */
export async function GET(request: NextRequest) {
  const limit = LIMITS.franchises.take(clientKey(request.headers));
  if (!limit.ok) return tooMany(limit.retryAfter);
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 300);
  if (ids.length === 0) return NextResponse.json({});
  try {
    return NextResponse.json(await getFranchises(ids));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "anilist" }, { status: 502 });
  }
}
