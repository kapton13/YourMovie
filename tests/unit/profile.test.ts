import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NICKNAME_SCRIPTS, nameProblem, nicknameProblem } from "@/lib/profile";
import { safeNext } from "@/lib/safeNext";

describe("нікнейм: будь-якою мовою, але літери однієї абетки", () => {
  it.each(["Kapton13", "Ковальчук", "Їжак_2000", "Ελένη", "Արամ", "გიორგი", "דוד_7", "محمد", "नरेंद्र", "สมชาย", "ナルト好き", "王小明", "김민준", "José-María", "Nguyễn.99", "user_cool"])(
    "%s — можна",
    (nick) => expect(nicknameProblem(nick)).toBe(""),
  );
  it.each([
    ["Аdmin", "mixed"], // кирилична «А» + латиниця
    ["Claude_Тест", "mixed"],
    ["ab", "short"],
    ["a".repeat(25), "long"],
    ["with space", "chars"],
    ["Олег!", "chars"],
    ["User123", "reserved"],
  ])("%s — ні (%s)", (nick, problem) => expect(nicknameProblem(nick)).toBe(problem));

  it("абетки в коді збігаються з перевіркою в базі (supabase/007)", () => {
    const sql = readFileSync("supabase/007_international_nicknames.sql", "utf8");
    const sqlRanges = [...sql.matchAll(/nick ~ '\^\[(.+?)0-9_\.-\]\+\$'/g)].map((m) => m[1]);
    const codeRanges = NICKNAME_SCRIPTS.map((s) => s.ranges.replace(/\\\\/g, "\\"));
    expect(sqlRanges).toEqual(codeRanges);
  });
});

describe("прізвище, ім'я, по батькові: будь-якою мовою, до 50 символів", () => {
  it.each(["Квітка-Основ'яненко", "O’Brien", "Jean-Luc", "José María", "Nguyễn", "Ελένη", "山田", "ジョン・スミス", "محمد", "שָׁלוֹם", "नरेंद्र", "Łukasz", "Smith Jr."])(
    "%s — можна",
    (name) => expect(nameProblem(name)).toBe(""),
  );
  it.each(["Тест123", "<script>", "Олег!", "😀", "---", "a_b"])("%s — ні", (name) => expect(nameProblem(name)).toBe("chars"));
  it("51 символ — задовге", () => expect(nameProblem("а".repeat(51))).toBe("long"));
  it("порожнє — можна (поле необов'язкове)", () => expect(nameProblem("  ")).toBe(""));
});

describe("повернення після входу — лише на наш сайт", () => {
  it.each(["/catalog?q=1", "/uk/my#x", "/account"])("%s — лишаємо", (url) => expect(safeNext(url)).toBe(url));
  it.each(["//evil.com", "/\\evil.com", "/\t/evil.com", "https://evil.com", "javascript:alert(1)", "", null])(
    "%s — на /account",
    (url) => expect(safeNext(url as string | null)).toBe("/account"),
  );
});
