"use client";

import { useState } from "react";
import { MediaGrid } from "@/components/MediaGrid";
import { SkipListed } from "@/components/hidden/SkipListed";
import { useHidden } from "@/components/hidden/HiddenProvider";
import { Link, useI18n } from "@/components/i18n/I18nProvider";
import { label as labelOf } from "@/lib/i18n/labels";
import type { Recommendation } from "@/lib/recommendations";
import { useReasonText, useRecommendations } from "./useRecommendations";
import styles from "./Recommendations.module.css";

type Kind = "all" | "series" | "movies";
type Airing = "all" | "finished" | "releasing";

const KINDS: Kind[] = ["all", "series", "movies"];
const AIRING: Airing[] = ["all", "finished", "releasing"];
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
  const reasonText = useReasonText();
  const { m, fmt, count, intl } = useI18n();
  const { hiddenIds, listedIds } = useHidden();
  const [kind, setKind] = useState<Kind>("all");
  const [airing, setAiring] = useState<Airing>("all");
  const [genre, setGenre] = useState("");
  const [shown, setShown] = useState(PAGE);

  const heading = <h1 className={styles.title}>{m.recs.title}</h1>;

  if (state.kind === "checking") return heading;
  if (state.kind === "guest") {
    const [before, after = ""] = m.recs.guest.split("{link}");
    return (
      <>
        {heading}
        <p className={styles.empty}>
          {before}
          <Link href="/login?next=%2Frecommendations">{m.recs.guestLink}</Link>
          {after}
        </p>
      </>
    );
  }
  if (state.kind === "loading") {
    return (
      <>
        {heading}
        <p className={styles.lead}>{m.recs.loading}</p>
        <div className={styles.gridSkeleton} aria-busy="true" />
      </>
    );
  }
  if (state.kind === "error") {
    return (
      <>
        {heading}
        <div className={styles.empty} role="alert">
          <p>{m.recs.error}</p>
          <button type="button" className={styles.retry} onClick={state.retry}>
            {m.common.retry}
          </button>
        </div>
      </>
    );
  }

  const { items, basedOn } = state.result;
  // Те, що людина щойно сховала чи додала в списки, теж прибираємо — і з лічильників.
  const visible = items.filter((i) => !hiddenIds.has(i.media.id) && !listedIds.has(i.media.id));
  // Обраний жанр лишається у списку, навіть якщо його останнє аніме щойно сховали, — щоб фільтр можна було скинути.
  const genreLabel = (g: string) => labelOf(m.labels.genre, g);
  const genres = [...new Set([...visible.flatMap((i) => i.media.genres), ...(genre ? [genre] : [])])].sort((a, b) =>
    genreLabel(a).localeCompare(genreLabel(b), intl),
  );
  const filtered = visible.filter((i) => matches(i, kind, airing, genre));
  const reasons = new Map(items.map((i) => [i.media.id, reasonText(i.reason)]));
  const reset = () => setShown(PAGE);

  return (
    <SkipListed>
      {heading}
      <p className={styles.lead}>
        {basedOn > 0 ? fmt(m.recs.lead, { count: count(m.common.anime, basedOn) }) : m.recs.leadEmpty}
      </p>
      {basedOn < 3 && (
        <p className={styles.hint}>
          {m.recs.hint} <Link href="/catalog">{m.recs.toCatalog}</Link>
        </p>
      )}

      <div className={styles.filters}>
        <Segmented
          label={m.recs.filters.kind}
          options={KINDS.map((v): [Kind, string] => [v, m.recs.filters.kinds[v]])}
          value={kind}
          onChange={(v) => (setKind(v), reset())}
        />
        <Segmented
          label={m.recs.filters.airing}
          options={AIRING.map((v): [Airing, string] => [v, m.recs.filters.airingOptions[v]])}
          value={airing}
          onChange={(v) => (setAiring(v), reset())}
        />
        <label className={styles.genre}>
          <span className={styles.filterLabel}>{m.recs.filters.genre}</span>
          <select value={genre} onChange={(e) => (setGenre(e.target.value), reset())} className={styles.select}>
            <option value="">{m.recs.filters.allGenres}</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {genreLabel(g)}
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
              {m.recs.more}
            </button>
          )}
        </>
      ) : (
        <p className={styles.empty}>{m.recs.noResults}</p>
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
