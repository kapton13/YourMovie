import { beforeEach, describe, expect, it, vi } from "vitest";

/** Списки людини — один запит до бази на всю сторінку; після зміни — читаємо знову. */

const calls: string[] = [];
const fail = { next: false };
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowser: () => ({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        range: async () => {
          calls.push(table);
          if (fail.next) {
            fail.next = false;
            return { data: null, error: { message: "offline" } };
          }
          return table === "list_entries"
            ? { data: [{ media_id: 1, status: "watching", score: "8.5" }], error: null }
            : { data: [{ media_id: 2, franchise_key: 2 }], error: null };
        },
      };
      return query;
    },
  }),
}));
vi.stubGlobal("window", { dispatchEvent: vi.fn() });
const lists = await import("@/lib/myLists");

beforeEach(() => {
  calls.length = 0;
  lists.notifyListsChanged();
  lists.forgetMyHidden();
});

describe("списки людини в браузері", () => {
  it("кілька читань поспіль — один запит; оцінка — число", async () => {
    const [a, b] = await Promise.all([lists.myEntries("u1"), lists.myEntries("u1")]);
    await lists.myEntries("u1");
    expect(calls).toEqual(["list_entries"]);
    expect(a).toEqual([{ media_id: 1, status: "watching", score: 8.5 }]);
    // Кожен отримує свою копію — зміни одного не зачеплять іншого.
    expect(a).not.toBe(b);
  });

  it("списки змінились — наступне читання йде в базу", async () => {
    await lists.myEntries("u1");
    lists.notifyListsChanged();
    await lists.myEntries("u1");
    expect(calls).toEqual(["list_entries", "list_entries"]);
  });

  it("інший користувач — свій запит", async () => {
    await lists.myEntries("u1");
    await lists.myEntries("u2");
    expect(calls).toEqual(["list_entries", "list_entries"]);
  });

  it("«Не цікаво» скидається окремо; помилка не запам'ятовується", async () => {
    fail.next = true;
    await expect(lists.myHiddenRows("u1")).rejects.toBeTruthy();
    expect(await lists.myHiddenRows("u1")).toEqual([{ media_id: 2, franchise_key: 2 }]);
    await lists.myHiddenRows("u1");
    lists.forgetMyHidden();
    await lists.myHiddenRows("u1");
    expect(calls).toEqual(["hidden_media", "hidden_media", "hidden_media"]);
  });
});
