"use client";

import Link from "next/link";
import { useState } from "react";
import { MediaGrid } from "@/components/MediaGrid";
import { SkipListed } from "@/components/hidden/SkipListed";
import { useHidden } from "@/components/hidden/HiddenProvider";
import { GENRE_LABELS } from "@/lib/labels";
import type { Recommendation } from "@/lib/recommendations";
import { useRecommendations } from "./useRecommendations";
import styles from "./Recommendations.module.css";

type Kind = "all" | "series" | "movies";
type Airing = "all" | "finished" | "releasing";

const KINDS: [Kind, string][] = [
  ["all", "Усі"],
  ["series", "Серіали"],
  ["movies", "Фільми"],
];
const AIRING: [Airing, string][] = [
  ["all", "Усі"],
  ["finished", "Завершені"],
  ["releasing", "Виходять зараз"],
];
const SERIES = new Set(["TV", "TV_SHORT", "ONA", "OVA"]);
const PAGE = 48;

function matches(item: Recommendation, kind: Kind, airing: Airing, genre: string): boolean {
  const { format, status, genres } = item.media;
  if (kind === "series" && !SERIES.has(format ?? "")) return false;
  if (kind === "movies" && format !== "MOVIE") return false;
  if (airing === "finished" && status !== "FINISHED") return false;
  if (airing === "releasing" && status !== "RELEASING") return false;
  if (genre && !genres.includes(genre)) return false;
  return true;
}

/** Сторінка «Рекомендації»: за списками й оцінками людини, з простими фільтрами. */
export function Recommendations() {
  const state = useRecommendations();
  const { hiddenIds, listedIds } = useHidden();
  const [kind, setKind] = useState<Kind>("all");
  const [airing, setAiring] = useState<Airing>("all");
  const [genre, setGenre] = useState("");
  const [shown, setShown] = useState(PAGE);

  const heading = <h1 className={styles.title}>Рекомендації</h1>;

  if (state.kind === "checking") return heading;
  if (state.kind === "guest") {
    return (
      <>
        {heading}
        <p className={styles.empty}>
          <Link href="/login?next=%2Frecommendations">Увійдіть</Link>, і ми підберемо аніме за вашими списками й
          оцінками.
        </p>
      </>
    );
  }
  if (state.kind === "loading") {
    return (
      <>
        {heading}
        <p className={styles.lead}>Підбираємо аніме за вашими списками й оцінками…</p>
        <div className={styles.gridSkeleton} aria-busy="true" />
      </>
    );
  }
  if (state.kind === "error") {
    return (
      <>
        {heading}
        <p className={styles.empty}>Не вдалося підібрати рекомендації. Спробуйте оновити сторінку трохи згодом.</p>
      </>
    );
  }

  const { items, basedOn } = state.result;
  // Те, що людина щойно сховала чи додала в списки, теж прибираємо — і з лічильників.
  const visible = items.filter((i) => !hiddenIds.has(i.media.id) && !listedIds.has(i.media.id));
  const genres = [...new Set(visible.flatMap((i) => i.media.genres))].sort((a, b) =>
    (GENRE_LABELS[a] ?? a).localeCompare(GENRE_LABELS[b] ?? b, "uk"),
  );
  const filtered = visible.filter((i) => matches(i, kind, airing, genre));
  const reasons = new Map(items.map((i) => [i.media.id, i.reason]));
  const reset = () => setShown(PAGE);

  return (
    <SkipListed>
      {heading}
      <p className={styles.lead}>
        {basedOn > 0
          ? `Підібрано за ${basedOn} аніме з ваших списків і вашими оцінками. Що вище — то більше підходить.`
          : "Поки що ми мало знаємо про ваш смак, тому показуємо популярне."}
      </p>
      {basedOn < 3 && (
        <p className={styles.hint}>
          Додайте в списки й оцініть хоча б 3 аніме, які ви дивилися, — рекомендації стануть точнішими.{" "}
          <Link href="/catalog">Перейти до каталогу →</Link>
        </p>
      )}

      <div className={styles.filters}>
        <Segmented label="Тип" options={KINDS} value={kind} onChange={(v) => (setKind(v), reset())} />
        <Segmented label="Статус" options={AIRING} value={airing} onChange={(v) => (setAiring(v), reset())} />
        <label className={styles.genre}>
          <span className={styles.filterLabel}>Жанр</span>
          <select value={genre} onChange={(e) => (setGenre(e.target.value), reset())} className={styles.select}>
            <option value="">Усі жанри</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {GENRE_LABELS[g] ?? g}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length > 0 ? (
        <>
          <MediaGrid items={filtered.slice(0, shown).map((i) => i.media)} note={(m) => reasons.get(m.id)} />
          {filtered.length > shown && (
            <button type="button" className={styles.more} onClick={() => setShown((n) => n + PAGE)}>
              Показати ще
            </button>
          )}
        </>
      ) : (
        <p className={styles.empty}>За цими фільтрами нічого не знайшлося. Спробуйте інші.</p>
      )}
    </SkipListed>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.segmentedWrap}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.segmented} role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            className={`${styles.segment} ${value === v ? styles.segmentActive : ""}`}
            aria-pressed={value === v}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
