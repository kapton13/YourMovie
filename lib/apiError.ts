import { NextResponse } from "next/server";
import { AniListError } from "./anilist";

/**
 * AniList не відповів. У відповіді — що саме сказав AniList (429 — ліміт, 403 — відмова тощо),
 * щоб збій на Vercel можна було розпізнати, просто відкривши адресу в браузері.
 */
export function anilistFailed(error: unknown) {
  console.error(error);
  const status = error instanceof AniListError ? error.status : null;
  const detail = error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200);
  return NextResponse.json({ error: "anilist", status, detail }, { status: 502 });
}
