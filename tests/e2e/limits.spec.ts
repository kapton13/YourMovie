import { expect, test } from "@playwright/test";
import { messagesFor } from "./helpers";

/**
 * Захист від зловживань: одна адреса, що «засипає» сайт запитами, отримує «зачекайте» (429),
 * інші — ні. Окрема вигадана адреса, щоб не заважати іншим перевіркам.
 */
const as = (ip: string) => ({ "x-forwarded-for": ip });

test("рекомендації: після запасу — 429 з часом очікування; інша адреса проходить", async ({ request }) => {
  const codes: number[] = [];
  for (let i = 0; i < 8; i++)
    codes.push((await request.post("/api/recommendations", { headers: as("203.0.113.10"), data: { entries: [], hidden: [] } })).status());
  expect(codes.slice(0, 6)).toEqual([200, 200, 200, 200, 200, 200]);
  expect(codes.at(-1)).toBe(429);
  const other = await request.post("/api/recommendations", { headers: as("203.0.113.11"), data: { entries: [], hidden: [] } });
  expect(other.status()).toBe(200);
});

test("пошук: дуже часті запити — сторінка «зачекайте» мовою сайту", async ({ request }) => {
  let last = await request.get("/uk/catalog?q=naruto", { headers: as("203.0.113.12") });
  for (let i = 0; i < 25 && last.status() !== 429; i++) last = await request.get("/uk/catalog?q=naruto", { headers: as("203.0.113.12") });
  expect(last.status()).toBe(429);
  expect(Number(last.headers()["retry-after"])).toBeGreaterThan(0);
  expect(await last.text()).toContain(messagesFor("uk").common.tooMany.title);
});
