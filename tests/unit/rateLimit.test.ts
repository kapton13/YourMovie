import { describe, expect, it } from "vitest";
import { clientKey, createLimiter } from "@/lib/rateLimit";

/** Захист від зловживань: межа запитів на адресу. */
describe("обмеження запитів", () => {
  it("пропускає запас, далі — «зачекайте» з часом очікування", () => {
    const limiter = createLimiter({ perMinute: 60, burst: 3 });
    const t = 1_000_000;
    expect([1, 2, 3].map(() => limiter.take("a", t).ok)).toEqual([true, true, true]);
    const denied = limiter.take("a", t);
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.retryAfter).toBe(1);
  });

  it("жетони поновлюються з часом; інші адреси не страждають", () => {
    const limiter = createLimiter({ perMinute: 60, burst: 2 });
    const t = 2_000_000;
    limiter.take("a", t);
    limiter.take("a", t);
    expect(limiter.take("a", t).ok).toBe(false);
    expect(limiter.take("b", t).ok).toBe(true);
    expect(limiter.take("a", t + 1000).ok).toBe(true); // 60 за хвилину — один за секунду
    expect(limiter.take("a", t + 1000).ok).toBe(false);
  });

  it("звичайна людина не впирається в межу (рекомендації: 12 за хвилину)", () => {
    const limiter = createLimiter({ perMinute: 12, burst: 6 });
    // Сторінка рекомендацій раз на 10 секунд протягом 5 хвилин.
    for (let i = 0; i < 30; i++) expect(limiter.take("a", 3_000_000 + i * 10_000).ok).toBe(true);
  });

  it("адреса з заголовків: перша з x-forwarded-for", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientKey(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
