import type { PartKind } from "@/lib/anilist";
import type { Messages } from "@/messages";
import { fmt } from "./format";

/** Підпис частини аніме потрібною мовою: «Season 2», «Фільм», «OVA»… */
export function partLabel(part: { kind: PartKind; season: number | null }, m: Messages): string {
  if (part.kind === "season") return fmt(m.labels.part.season, { n: part.season ?? 1 });
  return m.labels.part[part.kind] ?? m.labels.part.other;
}

/** Назва з довідника (жанр, формат…) або сам код, якщо перекладу немає. */
export function label(map: Record<string, string>, key: string | null | undefined): string {
  return key ? (map[key] ?? key) : "";
}

/** «14 жовтня 2026», «October 2026», «2026» — залежно від того, що відомо, за правилами мови. */
export function formatFuzzyDate(
  { year, month, day }: { year: number | null; month: number | null; day: number | null },
  intl: string,
): string | null {
  if (!year) return null;
  if (!month) return String(year);
  const date = new Date(Date.UTC(year, month - 1, day ?? 1));
  return new Intl.DateTimeFormat(intl, day ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } : { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** Дата виходу серії за київським часом (як і раніше), напр. «18 жовтня» / «October 18». */
export function formatAiringDate(unixSeconds: number, intl: string): string {
  return new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", timeZone: "Europe/Kyiv" }).format(
    new Date(unixSeconds * 1000),
  );
}
