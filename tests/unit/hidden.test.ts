import { describe, expect, it } from "vitest";
import { franchiseRows, isCardHidden, quickRows, rowsToComplete } from "@/lib/hidden";

/** «Не цікаво»: хрестик на будь-якій частині ховає все аніме скрізь (рішення 2026-10-15). */

// «Атака титанів»: 16498 — сезон 1 (ключ аніме), 20958 — сезон 2, 99147 — сезон 3, 19391 — спешл.
const aot = { key: 16498, main: [{ id: 16498 }, { id: 20958 }, { id: 99147 }], extras: [{ id: 19391 }] };

describe("що зберігаємо", () => {
  it("усі частини аніме під одним ключем", () => {
    const rows = franchiseRows(aot, [20958]);
    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.franchise_key))).toEqual(new Set([16498]));
  });

  it("одразу після хрестика — саму частину й перший сезон", () => {
    expect(quickRows(20958, 16498)).toEqual([
      { media_id: 20958, franchise_key: 16498 },
      { media_id: 16498, franchise_key: 16498 },
    ]);
    expect(quickRows(16498)).toEqual([{ media_id: 16498, franchise_key: 16498 }]);
  });
});

describe("доповнення схованого", () => {
  it("сховано лише сезон 2 під його ж id → усі частини під ключем аніме", () => {
    const fixes = rowsToComplete(new Map([[20958, [20958]]]), { 20958: aot });
    expect(fixes.map((r) => r.media_id).sort()).toEqual([16498, 19391, 20958, 99147]);
    expect(fixes.every((r) => r.franchise_key === 16498)).toBe(true);
  });

  it("вийшов новий сезон → додається", () => {
    const withNew = { ...aot, main: [...aot.main, { id: 110277 }] };
    const fixes = rowsToComplete(new Map([[16498, [16498, 20958, 99147, 19391]]]), { 16498: withNew });
    expect(fixes.map((r) => r.media_id)).toContain(110277);
  });

  it("усе вже збережено або AniList не відповів — нічого не міняємо", () => {
    expect(rowsToComplete(new Map([[16498, [16498, 20958, 99147, 19391]]]), { 16498: aot })).toEqual([]);
    expect(rowsToComplete(new Map([[16498, [16498]]]), {})).toEqual([]);
  });
});

describe("які картки ховати", () => {
  const hidden = new Set([16498, 20958, 99147, 19391]);
  it("сама частина, перший сезон чи попередня частина сховані → ховаємо", () => {
    expect(isCardHidden({ mediaId: 20958 }, hidden)).toBe(true);
    expect(isCardHidden({ mediaId: 555, rootId: 16498 }, hidden)).toBe(true);
    expect(isCardHidden({ mediaId: 139754, parentId: 99147 }, hidden)).toBe(true); // спешл / новий сезон
  });

  it("інше аніме й спін-оф без зв'язку не ховаємо", () => {
    expect(isCardHidden({ mediaId: 21281, rootId: 21281 }, hidden)).toBe(false);
    expect(isCardHidden({ mediaId: 1 }, new Set())).toBe(false);
  });

  it("аніме зі списків ховаємо лише там, де передано listedIds (головна, схожі)", () => {
    const listed = new Set([1535]);
    expect(isCardHidden({ mediaId: 1535 }, new Set(), listed)).toBe(true);
    expect(isCardHidden({ mediaId: 1535 }, new Set())).toBe(false);
    // Попередня частина в списку — новий сезон не ховаємо (на нього якраз чекають).
    expect(isCardHidden({ mediaId: 2, parentId: 1535 }, new Set(), listed)).toBe(false);
  });
});
