import { describe, expect, it } from "vitest";
import { countWithNewEpisodes, isNewEpisode, isPending, unwatchedAired, type AnimeParts } from "@/lib/newEpisodes";

/** «Нова серія!» і лічильник у шапці — одне правило. */

const DAY = 86400;
const now = 1_800_000_000;
const watched = (n: number) => new Map(Array.from({ length: n }, (_, i) => [i + 1, { watched: true }]));

describe("нова серія", () => {
  it("непереглянуті — лише ті, що вже вийшли", () => {
    expect(unwatchedAired(5, watched(3))).toEqual([4, 5]);
    expect(unwatchedAired(0, undefined)).toEqual([]);
  });

  it("побічна частина (OVA) рахується, лише якщо її почали дивитися", () => {
    expect(isPending([1], true, undefined)).toBe(true);
    expect(isPending([1], false, undefined)).toBe(false);
    expect(isPending([2], false, watched(1))).toBe(true);
  });

  it("нова — якщо остання серія вийшла не раніше ніж 7 днів тому", () => {
    expect(isNewEpisode(true, now - 2 * DAY, now)).toBe(true);
    expect(isNewEpisode(true, now - 8 * DAY, now)).toBe(false);
    expect(isNewEpisode(false, now - DAY, now)).toBe(false);
    expect(isNewEpisode(true, null, now)).toBe(false);
  });
});

describe("лічильник у шапці", () => {
  const anime = (status: AnimeParts["status"], aired: number, seen: number, daysAgo: number): AnimeParts => ({
    status,
    parts: [{ aired, lastAiredAt: now - daysAgo * DAY, isMain: true, marks: watched(seen) }],
  });

  it("рахує аніме (не серії) з новою серією в «Дивлюся» й «Переглянуто»", () => {
    const list = [
      anime("watching", 6, 5, 1), // нова серія
      anime("watching", 12, 2, 2), // відстає на 10 серій, остання — вчора-позавчора: теж одне аніме
      anime("completed", 4, 3, 3), // «Переглянуто», але вийшла нова
      anime("watching", 6, 6, 1), // усе переглянуто
      anime("watching", 6, 5, 30), // давно не виходило — не «нова»
      anime("planning", 6, 0, 1), // «Планую» не рахуємо
      anime("paused", 6, 5, 1), // «На паузі» не рахуємо
    ];
    expect(countWithNewEpisodes(list, now)).toBe(3);
  });

  it("порожній список — 0", () => expect(countWithNewEpisodes([], now)).toBe(0));
});
