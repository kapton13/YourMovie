"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { useI18n, useLocaleRouter } from "@/components/i18n/I18nProvider";
import type { TagGroup } from "@/lib/anilist";
import {
  COUNTRIES,
  EPISODE_PRESETS,
  FORMATS,
  GENRES,
  MIN_YEAR,
  SCORE_PRESETS,
  SEASONS,
  SORTS,
  SOURCES,
  STATUSES,
  catalogHref,
  catalogTitle,
  countFilters,
  defaultSort,
  episodePresetLabel,
  parseCatalogParams,
  parseRange,
  rangeToParam,
  type CatalogQuery,
  type Range,
  type SortKey,
} from "@/lib/catalog";
import { label as labelOf } from "@/lib/i18n/labels";
import { useCatalogTransition } from "./CatalogTransition";
import { Popover } from "./Popover";
import styles from "./CatalogControls.module.css";

type I18n = ReturnType<typeof useI18n>;

type Props = {
  tagGroups: TagGroup[];
  maxYear: number;
};

const TYPING_DELAY = 400;

export function CatalogControls({ tagGroups, maxYear }: Props) {
  const router = useLocaleRouter();
  const i18n = useI18n();
  const { m, fmt } = i18n;
  const c = m.catalog.controls;
  const L = m.labels;
  const searchParams = useSearchParams();
  const { startTransition } = useCatalogTransition();

  const urlQuery = useMemo(() => parseCatalogParams(searchParams), [searchParams]);
  // Фільтри змінюються на екрані одразу, ще до того, як прийдуть нові результати.
  const [query, setOptimisticQuery] = useOptimistic(urlQuery);

  // Текст пошуку живе окремо, щоб введення не перебивалося оновленням адреси.
  const [text, setText] = useState(urlQuery.q);
  const [sentQ, setSentQ] = useState(urlQuery.q);
  const [seenUrlQ, setSeenUrlQ] = useState(urlQuery.q);
  if (urlQuery.q !== seenUrlQ) {
    // Адреса змінилася не через введення (кнопка «Назад», «Скинути все») — підхоплюємо її.
    setSeenUrlQ(urlQuery.q);
    if (urlQuery.q !== sentQ) {
      setText(urlQuery.q);
      setSentQ(urlQuery.q);
    }
  }

  const typingTimer = useRef<number | undefined>(undefined);
  // Якщо людина пішла зі сторінки, не дописавши запит, — не повертати її назад.
  useEffect(() => {
    const timer = typingTimer;
    return () => window.clearTimeout(timer.current);
  }, []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  function navigate(next: CatalogQuery, mode: "push" | "replace" = "push") {
    window.clearTimeout(typingTimer.current);
    // Якщо сортування не вибирали вручну, воно залежить від того, чи є пошук.
    if (next.q !== query.q && query.sort === defaultSort(query.q)) next.sort = defaultSort(next.q);
    if (next.sort === "relevance" && !next.q) next.sort = "popular";
    setSentQ(next.q);
    startTransition(() => {
      setOptimisticQuery(next);
      const href = catalogHref(next);
      if (mode === "replace") router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  /** Змінити фільтри; пошук береться з поля введення, сторінка — перша. */
  function update(patch: Partial<CatalogQuery>) {
    navigate({ ...query, q: text.trim(), ...patch, page: 1 });
  }

  function onTextChange(value: string) {
    setText(value);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      const q = value.trim();
      if (q !== query.q) navigate({ ...query, q, page: 1 }, query.q ? "replace" : "push");
    }, TYPING_DELAY);
  }

  const filterCount = countFilters(query);
  const advancedCount =
    (query.episodes ? 1 : 0) + (query.minScore !== undefined ? 1 : 0) + (query.country ? 1 : 0) + (query.source ? 1 : 0);
  const showMore = moreOpen || advancedCount > 0;
  const years = useMemo(
    () => Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, i) => maxYear - i),
    [maxYear],
  );
  const chips = activeChips(query, i18n);

  return (
    <div className={styles.controls}>
      <h1 className={styles.title}>{catalogTitle(query, m)}</h1>

      <div className={styles.searchRow}>
        <form
          className={styles.searchForm}
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            update({});
          }}
        >
          <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            className={`${styles.control} ${styles.searchInput}`}
            placeholder={c.searchPlaceholder}
            aria-label={c.searchLabel}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
          />
          {text && (
            <button
              type="button"
              className={styles.clearText}
              aria-label={c.clearSearch}
              onClick={() => {
                setText("");
                navigate({ ...query, q: "", page: 1 });
              }}
            >
              ✕
            </button>
          )}
        </form>
        <button
          type="button"
          className={`${styles.control} ${styles.filtersToggle}`}
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((value) => !value)}
        >
          {c.filters}{filterCount > 0 && <span className={styles.count}>{filterCount}</span>}
        </button>
      </div>

      <div className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`}>
        <div className={styles.grid}>
          <Field label={c.genresTags} wide>
            <Popover
              label={c.genresTags}
              summary={genreSummary(query, i18n)}
              active={query.genres.length + query.genresNot.length + query.tags.length + query.tagsNot.length > 0}
              wide
            >
              <GenreTagPicker query={query} tagGroups={tagGroups} onChange={update} />
            </Popover>
          </Field>

          <Field label={c.years} wide>
            <div className={styles.yearRange}>
              <Select
                label={c.yearFrom}
                value={query.yearFrom?.toString() ?? ""}
                onChange={(v) => update(yearPatch(query, v ? Number(v) : undefined, query.yearTo))}
                options={[["", c.from], ...years.map((y) => [String(y), String(y)] as [string, string])]}
              />
              <span aria-hidden="true">–</span>
              <Select
                label={c.yearTo}
                value={query.yearTo?.toString() ?? ""}
                onChange={(v) => update(yearPatch(query, query.yearFrom, v ? Number(v) : undefined))}
                options={[["", c.to], ...years.map((y) => [String(y), String(y)] as [string, string])]}
              />
            </div>
          </Field>

          <Field label={c.season}>
            <Select
              label={c.season}
              value={query.season ?? ""}
              onChange={(v) => update({ season: (v || undefined) as CatalogQuery["season"] })}
              options={[["", c.any.season], ...SEASONS.map((s) => [s, labelOf(L.season, s)] as [string, string])]}
            />
          </Field>

          <Field label={c.format}>
            <CheckList
              label={c.format}
              anyLabel={c.any.format}
              values={FORMATS}
              selected={query.formats}
              labelOf={(f) => labelOf(L.format, f)}
              onChange={(formats) => update({ formats })}
            />
          </Field>

          <Field label={c.status}>
            <CheckList
              label={c.status}
              anyLabel={c.any.status}
              values={STATUSES}
              selected={query.statuses}
              labelOf={(s) => labelOf(L.status, s)}
              onChange={(statuses) => update({ statuses })}
            />
          </Field>

          <Field label={c.sort}>
            <Select
              label={c.sort}
              value={query.sort}
              active={query.sort !== defaultSort(query.q)}
              onChange={(v) => update({ sort: v as SortKey })}
              options={SORTS.filter((s) => s !== "relevance" || text.trim() || query.q).map(
                (s) => [s, labelOf(L.sort, s)] as [string, string],
              )}
            />
          </Field>
        </div>

        {showMore && (
          <div className={styles.grid}>
            <Field label={c.episodes}>
              <Select
                label={c.episodes}
                value={rangeToParam(query.episodes) ?? ""}
                onChange={(v) => update({ episodes: parseRange(v, 1, 5000) })}
                options={episodeOptions(query.episodes, i18n)}
              />
            </Field>
            <Field label={c.minScore}>
              <Select
                label={c.minScore}
                value={query.minScore?.toString() ?? ""}
                onChange={(v) => update({ minScore: v ? Number(v) : undefined })}
                options={[
                  ["", c.any.score],
                  ...SCORE_PRESETS.map((s) => [String(s), fmt(c.scoreOption, { score: s })] as [string, string]),
                ]}
              />
            </Field>
            <Field label={c.country}>
              <Select
                label={c.country}
                value={query.country ?? ""}
                onChange={(v) => update({ country: v || undefined })}
                options={[["", c.any.country], ...COUNTRIES.map((x) => [x, labelOf(L.country, x)] as [string, string])]}
              />
            </Field>
            <Field label={c.source}>
              <Select
                label={c.source}
                value={query.source ?? ""}
                onChange={(v) => update({ source: v || undefined })}
                options={[["", c.any.source], ...SOURCES.map((s) => [s, labelOf(L.source, s)] as [string, string])]}
              />
            </Field>
          </div>
        )}

        {advancedCount === 0 && (
          <button type="button" className={styles.moreToggle} onClick={() => setMoreOpen((v) => !v)}>
            {moreOpen ? c.fewer : c.more}
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className={styles.chips} aria-label={c.activeFilters}>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className={`${styles.chip} ${chip.exclude ? styles.chipExclude : ""}`}
              onClick={() => update(chip.remove)}
              aria-label={fmt(c.removeFilter, { label: chip.label })}
            >
              {chip.label}
              <span aria-hidden="true">✕</span>
            </button>
          ))}
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              setText("");
              navigate({ ...EMPTY, sort: "popular" });
            }}
          >
            {c.resetAll}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const EMPTY: CatalogQuery = parseCatalogParams(new URLSearchParams());

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  active = Boolean(value),
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
  /** Чи підсвічувати поле як змінене (типово — якщо щось вибрано). */
  active?: boolean;
}) {
  return (
    <span className={`${styles.selectWrap} ${active ? styles.selectActive : ""}`}>
      <select
        className={`${styles.control} ${styles.select}`}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </span>
  );
}

function CheckList<T extends string>({
  label,
  anyLabel,
  values,
  selected,
  labelOf,
  onChange,
}: {
  label: string;
  /** Що показати, коли нічого не вибрано: «Будь-який». */
  anyLabel: string;
  values: T[];
  selected: T[];
  labelOf: (value: T) => string;
  onChange: (selected: T[]) => void;
}) {
  const { m, fmt } = useI18n();
  const summary =
    selected.length === 0
      ? anyLabel
      : selected.length <= 2
        ? selected.map(labelOf).join(", ")
        : fmt(m.catalog.controls.andMore, { first: labelOf(selected[0]), n: selected.length - 1 });
  return (
    <Popover label={label} summary={summary} active={selected.length > 0}>
      <div className={styles.checkList}>
        {values.map((value) => {
          const checked = selected.includes(value);
          return (
            <label key={value} className={styles.check}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? selected.filter((v) => v !== value) : [...selected, value])}
              />
              {labelOf(value)}
            </label>
          );
        })}
      </div>
      {selected.length > 0 && (
        <button type="button" className={styles.clearList} onClick={() => onChange([])}>
          {m.catalog.controls.reset}
        </button>
      )}
    </Popover>
  );
}

type TriState = "off" | "include" | "exclude";

function GenreTagPicker({
  query,
  tagGroups,
  onChange,
}: {
  query: CatalogQuery;
  tagGroups: TagGroup[];
  onChange: (patch: Partial<CatalogQuery>) => void;
}) {
  const { m } = useI18n();
  const p = m.catalog.picker;
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const [hintBefore, hintRest = ""] = p.hint.split("{include}");
  const [hintMiddle, hintAfter = ""] = hintRest.split("{exclude}");

  const genres = GENRES.filter(
    (g) => !needle || labelOf(m.labels.genre, g).toLowerCase().includes(needle) || g.toLowerCase().includes(needle),
  );
  const groups = tagGroups
    .map((group) => ({ ...group, tags: group.tags.filter((t) => !needle || t.toLowerCase().includes(needle)) }))
    .filter((group) => group.tags.length > 0);

  const stateOf = (included: string[], excluded: string[], value: string): TriState =>
    included.includes(value) ? "include" : excluded.includes(value) ? "exclude" : "off";

  /** Клік: не вибрано → показувати → виключити → не вибрано. */
  function cycle(kind: "genres" | "tags", value: string) {
    const include = kind === "genres" ? query.genres : query.tags;
    const exclude = kind === "genres" ? query.genresNot : query.tagsNot;
    const state = stateOf(include, exclude, value);
    const nextInclude = state === "off" ? [...include, value] : include.filter((v) => v !== value);
    const nextExclude = state === "include" ? [...exclude, value] : exclude.filter((v) => v !== value);
    onChange(
      kind === "genres"
        ? { genres: nextInclude, genresNot: nextExclude }
        : { tags: nextInclude, tagsNot: nextExclude },
    );
  }

  return (
    <div className={styles.picker}>
      <input
        type="search"
        className={`${styles.control} ${styles.pickerSearch}`}
        placeholder={p.placeholder}
        aria-label={p.label}
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        autoComplete="off"
      />
      <p className={styles.pickerHint}>
        {hintBefore}
        <b className={styles.hintInclude}>{p.include}</b>
        {hintMiddle}
        <b className={styles.hintExclude}>{p.exclude}</b>
        {hintAfter}
      </p>

      {genres.length > 0 && (
        <section>
          <h3 className={styles.pickerHeading}>{p.genres}</h3>
          <div className={styles.triList}>
            {genres.map((genre) => (
              <TriChip
                key={genre}
                label={labelOf(m.labels.genre, genre)}
                state={stateOf(query.genres, query.genresNot, genre)}
                onClick={() => cycle("genres", genre)}
              />
            ))}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section>
          <h3 className={styles.pickerHeading}>
            {p.tags} <span className={styles.pickerNote}>{p.tagsNote}</span>
          </h3>
          {groups.map((group) => (
            <details key={group.category} className={styles.tagGroup} open={Boolean(needle)}>
              <summary>
                {labelOf(m.labels.tagCategory, group.category)}{" "}
                <span className={styles.pickerNote}>{group.tags.length}</span>
              </summary>
              <div className={styles.triList}>
                {group.tags.map((tag) => (
                  <TriChip
                    key={tag}
                    label={tag}
                    state={stateOf(query.tags, query.tagsNot, tag)}
                    onClick={() => cycle("tags", tag)}
                  />
                ))}
              </div>
            </details>
          ))}
        </section>
      )}

      {genres.length === 0 && groups.length === 0 && <p className={styles.pickerNote}>{p.nothing}</p>}
    </div>
  );
}

function TriChip({ label, state, onClick }: { label: string; state: TriState; onClick: () => void }) {
  const { m, fmt } = useI18n();
  const description = m.catalog.picker.state[state];
  return (
    <button
      type="button"
      className={`${styles.tri} ${state === "include" ? styles.triInclude : ""} ${state === "exclude" ? styles.triExclude : ""}`}
      onClick={onClick}
      aria-label={fmt(m.catalog.picker.chipState, { label, state: description })}
    >
      {state === "include" && <span aria-hidden="true">✓ </span>}
      {state === "exclude" && <span aria-hidden="true">✕ </span>}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------

function genreSummary(query: CatalogQuery, { m, fmt }: I18n): string {
  const c = m.catalog.controls;
  const names = [...query.genres.map((g) => labelOf(m.labels.genre, g)), ...query.tags];
  const excluded = query.genresNot.length + query.tagsNot.length;
  if (names.length === 0 && excluded === 0) return c.any.genres;
  const parts: string[] = [];
  if (names.length > 0)
    parts.push(names.length <= 2 ? names.join(", ") : fmt(c.andMore, { first: names[0], n: names.length - 1 }));
  if (excluded > 0) parts.push(fmt(c.excluded, { n: excluded }));
  return parts.join("; ");
}

function yearPatch(query: CatalogQuery, from: number | undefined, to: number | undefined): Partial<CatalogQuery> {
  if (from !== undefined && to !== undefined && from > to) [from, to] = [to, from];
  return { yearFrom: from, yearTo: to };
}

function episodeOptions(current: Range | undefined, i18n: I18n): [string, string][] {
  const options: [string, string][] = [
    ["", i18n.m.catalog.controls.any.episodes],
    ...EPISODE_PRESETS.map((value) => [value, episodePresetLabel(value, i18n.m, i18n.intl)] as [string, string]),
  ];
  const value = rangeToParam(current);
  if (value && !options.some(([v]) => v === value)) options.push([value, episodesLabel(current!, i18n)]);
  return options;
}

function episodesLabel({ min, max }: Range, { m, fmt, count }: I18n): string {
  const e = m.catalog.episodes;
  if (min !== undefined && min === max) return count(m.common.episodes, min);
  if (min !== undefined && max !== undefined) return fmt(e.range, { min, max });
  if (min !== undefined) return fmt(e.over, { count: count(m.common.episodes, min - 1) });
  return fmt(e.upTo, { count: count(m.common.episodes, max!) });
}

type Chip = { key: string; label: string; exclude?: boolean; remove: Partial<CatalogQuery> };

function activeChips(query: CatalogQuery, i18n: I18n): Chip[] {
  const { m, fmt } = i18n;
  const t = m.catalog.chips;
  const L = m.labels;
  const chips: Chip[] = [];
  for (const g of query.genres)
    chips.push({ key: `g:${g}`, label: labelOf(L.genre, g), remove: { genres: query.genres.filter((x) => x !== g) } });
  for (const g of query.genresNot)
    chips.push({
      key: `gn:${g}`,
      label: fmt(t.notGenre, { genre: labelOf(L.genre, g) }),
      exclude: true,
      remove: { genresNot: query.genresNot.filter((x) => x !== g) },
    });
  for (const t of query.tags)
    chips.push({ key: `t:${t}`, label: `#${t}`, remove: { tags: query.tags.filter((x) => x !== t) } });
  for (const t of query.tagsNot)
    chips.push({
      key: `tn:${t}`,
      label: fmt(chipsText.notTag, { tag }),
      exclude: true,
      remove: { tagsNot: query.tagsNot.filter((x) => x !== t) },
    });
  if (query.yearFrom !== undefined || query.yearTo !== undefined) {
    const { yearFrom: from, yearTo: to } = query;
    const label =
      from !== undefined && from === to
        ? fmt(t.year, { year: from })
        : from !== undefined && to !== undefined
          ? `${from}–${to}`
          : from !== undefined
            ? fmt(t.yearFrom, { year: from })
            : fmt(t.yearTo, { year: to! });
    chips.push({ key: "year", label, remove: { yearFrom: undefined, yearTo: undefined } });
  }
  if (query.season) chips.push({ key: "season", label: labelOf(L.season, query.season), remove: { season: undefined } });
  for (const f of query.formats)
    chips.push({ key: `f:${f}`, label: labelOf(L.format, f), remove: { formats: query.formats.filter((x) => x !== f) } });
  for (const s of query.statuses)
    chips.push({ key: `s:${s}`, label: labelOf(L.status, s), remove: { statuses: query.statuses.filter((x) => x !== s) } });
  if (query.episodes) chips.push({ key: "eps", label: episodesLabel(query.episodes, i18n), remove: { episodes: undefined } });
  if (query.minScore !== undefined)
    chips.push({ key: "score", label: fmt(t.score, { score: query.minScore }), remove: { minScore: undefined } });
  if (query.country)
    chips.push({ key: "country", label: labelOf(L.country, query.country), remove: { country: undefined } });
  if (query.source)
    chips.push({ key: "source", label: labelOf(L.source, query.source), remove: { source: undefined } });
  return chips;
}
