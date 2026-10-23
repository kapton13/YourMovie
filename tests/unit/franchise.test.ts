import { beforeEach, describe, expect, it, vi } from "vitest";

/** Групування частин в одне аніме (`buildFranchise`) на вигаданому графі зв'язків AniList. */

type Edge = { relationType: string; node: { id: number; type: string; format: string; startDate: { year: number } } };
type Node = { id: number; format: string; year: number; edges: [string, number][] };

const graph = new Map<number, Node>();
const client = vi.hoisted(() => ({ anilist: vi.fn() }));
vi.mock("@/lib/anilistClient", () => ({ anilist: client.anilist, AniListError: class extends Error {} }));
const { buildFranchise } = await import("@/lib/anilist");

function add(id: number, format: string, year: number, edges: [string, number][] = []) {
  graph.set(id, { id, format, year, edges });
}
const media = (n: Node) => ({
  id: n.id,
  title: { romaji: `Anime ${n.id}`, english: null },
  coverImage: { large: null, color: null },
  format: n.format,
  seasonYear: n.year,
  startDate: { year: n.year, month: 1, day: 1 },
  episodes: 12,
  averageScore: 80,
  status: "FINISHED",
  duration: 24,
  relations: {
    edges: n.edges.map(([relationType, id]): Edge => {
      const other = graph.get(id)!;
      return { relationType, node: { id, type: "ANIME", format: other.format, startDate: { year: other.year } } };
    }),
  },
});

beforeEach(() => {
  graph.clear();
  client.anilist.mockImplementation(async (_query: string, { ids }: { ids: number[] }) => ({
    Page: { media: ids.filter((id) => graph.has(id)).map((id) => media(graph.get(id)!)) },
  }));
  // Детектив Конан (1, серіал) і Люпен III (2, серіал) — окремі аніме зі спільним спешлом-кросовером (3).
  add(1, "TV", 1996, [["SIDE_STORY", 3], ["SIDE_STORY", 4]]);
  add(2, "TV", 1971, [["SIDE_STORY", 3], ["SEQUEL", 5]]);
  add(3, "SPECIAL", 2009, [["PARENT", 1], ["PARENT", 2]]);
  add(4, "MOVIE", 1997, [["PARENT", 1]]); // фільм Конана
  add(5, "TV", 1977, [["PREQUEL", 2]]); // Люпен, частина 2
});

const ids = (f: Awaited<ReturnType<typeof buildFranchise>>) => [...f.main, ...f.extras].map((p) => p.id).sort();

describe("групування аніме", () => {
  it("кросовер не зливає два різні аніме в одне", async () => {
    expect(ids(await buildFranchise(1))).toEqual([1, 3, 4]);
    expect(ids(await buildFranchise(2))).toEqual([2, 3, 5]);
  });

  it("фільм чи OVA — частина свого аніме (відкрили саму OVA — знаходимо серіал)", async () => {
    const f = await buildFranchise(4);
    expect(f.key).toBe(1);
    expect(ids(f)).toEqual([1, 3, 4]);
  });

  it("сезони одного аніме — разом, навіть через фільм між ними", async () => {
    add(6, "TV", 2013, [["SEQUEL", 7]]);
    add(7, "MOVIE", 2014, [["PREQUEL", 6], ["SEQUEL", 8]]);
    add(8, "TV", 2015, [["PREQUEL", 7]]);
    const f = await buildFranchise(8);
    expect(f.key).toBe(6);
    expect(ids(f)).toEqual([6, 7, 8]);
  });
});
