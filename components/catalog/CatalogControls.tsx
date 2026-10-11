"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useOptimistic, useRef, useState } from "react";
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
  parseCatalogParams,
  parseRange,
  rangeToParam,
  type CatalogQuery,
  type Range,
  type SortKey,
} from "@/lib/catalog";
import {
  COUNTRY_LABELS,
  FORMAT_LABELS,
  GENRE_LABELS,
  SEASON_LABELS,
  SORT_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  TAG_CATEGORY_LABELS,
} from "@/lib/labels";
import { useCatalogTransition } from "./CatalogTransition";
import { Popover } from "./Popover";
import styles from "./CatalogControls.module.css";

type Props = {
  tagGroups: TagGroup[];
  maxYear: number;
};

const TYPING_DELAY = 400;

export function CatalogControls({ tagGroups, maxYear }: Props) {
  const router = useRouter();
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
  const chips = activeChips(query);

  return (
    <div className={styles.controls}>
      <h1 className={styles.title}>{catalogTitle(query)}</h1>

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
            placeholder="Назва аніме або слово з назви…"
            aria-label="Пошук за назвою"
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
              aria-label="Очистити пошук"
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
          Фільтри{filterCount > 0 && <span className={styles.count}>{filterCount}</span>}
        </button>
      </div>

      <div className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`}>
        <div className={styles.grid}>
          <Field label="Жанри й теги" wide>
            <Popover
              label="Жанри й теги"
              summary={genreSummary(query)}
              active={query.genres.length + query.genresNot.length + query.tags.length + query.tagsNot.length > 0}
              wide
            >
              <GenreTagPicker query={query} tagGroups={tagGroups} onChange={update} />
            </Popover>
          </Field>

          <Field label="Роки" wide>
            <div className={styles.yearRange}>
              <Select
                label="Рік від"
                value={query.yearFrom?.toString() ?? ""}
                onChange={(v) => update(yearPatch(query, v ? Number(v) : undefined, query.yearTo))}
                options={[["", "Від"], ...years.map((y) => [String(y), String(y)] as [string, string])]}
              />
              <span aria-hidden="true">–</span>
              <Select
                label="Рік до"
                value={query.yearTo?.toString() ?? ""}
                onChange={(v) => update(yearPatch(query, query.yearFrom, v ? Number(v) : undefined))}
                options={[["", "До"], ...years.map((y) => [String(y), String(y)] as [string, string])]}
              />
            </div>
          </Field>

          <Field label="Сезон">
            <Select
              label="Сезон"
              value={query.season ?? ""}
              onChange={(v) => update({ season: (v || undefined) as CatalogQuery["season"] })}
              options={[["", "Будь-який"], ...SEASONS.map((s) => [s, SEASON_LABELS[s]] as [string, string])]}
            />
          </Field>

          <Field label="Формат">
            <CheckList
              label="Формат"
              values={FORMATS}
              selected={query.formats}
              labelOf={(f) => FORMAT_LABELS[f]}
              onChange={(formats) => update({ formats })}
            />
          </Field>

          <Field label="Статус">
            <CheckList
              label="Статус"
              values={STATUSES}
              selected={query.statuses}
              labelOf={(s) => STATUS_LABELS[s]}
              onChange={(statuses) => update({ statuses })}
            />
          </Field>

          <Field label="Сортування">
            <Select
              label="Сортування"
              value={query.sort}
              active={query.sort !== defaultSort(query.q)}
              onChange={(v) => update({ sort: v as SortKey })}
              options={SORTS.filter((s) => s !== "relevance" || text.trim() || query.q).map(
                (s) => [s, SORT_LABELS[s]] as [string, string],
              )}
            />
          </Field>
        </div>

        {showMore && (
          <div className={styles.grid}>
            <Field label="Кількість серій">
              <Select
                label="Кількість серій"
                value={rangeToParam(query.episodes) ?? ""}
                onChange={(v) => update({ episodes: parseRange(v, 1, 5000) })}
                options={episodeOptions(query.episodes)}
              />
            </Field>
            <Field label="Мінімальна оцінка">
              <Select
                label="Мінімальна оцінка"
                value={query.minScore?.toString() ?? ""}
                onChange={(v) => update({ minScore: v ? Number(v) : undefined })}
                options={[
                  ["", "Будь-яка"],
                  ...SCORE_PRESETS.map((s) => [String(s), `від ${s} з 10`] as [string, string]),
                ]}
              />
            </Field>
            <Field label="Країна">
              <Select
                label="Країна"
                value={query.country ?? ""}
                onChange={(v) => update({ country: v || undefined })}
                options={[["", "Будь-яка"], ...COUNTRIES.map((c) => [c, COUNTRY_LABELS[c]] as [string, string])]}
              />
            </Field>
            <Field label="Першоджерело">
              <Select
                label="Першоджерело"
                value={query.source ?? ""}
                onChange={(v) => update({ source: v || undefined })}
                options={[["", "Будь-яке"], ...SOURCES.map((s) => [s, SOURCE_LABELS[s]] as [string, string])]}
              />
            </Field>
          </div>
        )}

        {advancedCount === 0 && (
          <button type="button" className={styles.moreToggle} onClick={() => setMoreOpen((v) => !v)}>
            {moreOpen ? "Менше фільтрів ▴" : "Більше фільтрів: серії, оцінка, країна, першоджерело ▾"}
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className={styles.chips} aria-label="Увімкнені фільтри">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className={`${styles.chip} ${chip.exclude ? styles.chipExclude : ""}`}
              onClick={() => update(chip.remove)}
              aria-label={`Прибрати фільтр: ${chip.label}`}
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
            Скинути все
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
  values,
  selected,
  labelOf,
  onChange,
}: {
  label: string;
  values: T[];
  selected: T[];
  labelOf: (value: T) => string;
  onChange: (selected: T[]) => void;
}) {
  const summary =
    selected.length === 0
      ? "Будь-який"
      : selected.length <= 2
        ? selected.map(labelOf).join(", ")
        : `${labelOf(selected[0])} і ще ${selected.length - 1}`;
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
          Скинути
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
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();

  const genres = GENRES.filter(
    (g) => !needle || GENRE_LABELS[g].toLowerCase().includes(needle) || g.toLowerCase().includes(needle),
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
        placeholder="Знайти жанр або тег…"
        aria-label="Знайти жанр або тег"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        autoComplete="off"
      />
      <p className={styles.pickerHint}>
        Натисніть раз — <b className={styles.hintInclude}>показувати</b>, ще раз —{" "}
        <b className={styles.hintExclude}>виключити</b>, втретє — скасувати.
      </p>

      {genres.length > 0 && (
        <section>
          <h3 className={styles.pickerHeading}>Жанри</h3>
          <div className={styles.triList}>
            {genres.map((genre) => (
              <TriChip
                key={genre}
                label={GENRE_LABELS[genre]}
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
            Теги <span className={styles.pickerNote}>(англійською, як в AniList)</span>
          </h3>
          {groups.map((group) => (
            <details key={group.category} className={styles.tagGroup} open={Boolean(needle)}>
              <summary>
                {TAG_CATEGORY_LABELS[group.category] ?? group.category}{" "}
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

      {genres.length === 0 && groups.length === 0 && <p className={styles.pickerNote}>Нічого не знайдено.</p>}
    </div>
  );
}

function TriChip({ label, state, onClick }: { label: string; state: TriState; onClick: () => void }) {
  const description = state === "include" ? "показувати" : state === "exclude" ? "виключено" : "не вибрано";
  return (
    <button
      type="button"
      className={`${styles.tri} ${state === "include" ? styles.triInclude : ""} ${state === "exclude" ? styles.triExclude : ""}`}
      onClick={onClick}
      aria-label={`${label}: ${description}`}
    >
      {state === "include" && <span aria-hidden="true">✓ </span>}
      {state === "exclude" && <span aria-hidden="true">✕ </span>}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------

function genreSummary(query: CatalogQuery): string {
  const names = [...query.genres.map((g) => GENRE_LABELS[g]), ...query.tags];
  const excluded = query.genresNot.length + query.tagsNot.length;
  if (names.length === 0 && excluded === 0) return "Будь-які";
  const parts: string[] = [];
  if (names.length > 0) parts.push(names.length <= 2 ? names.join(", ") : `${names[0]} і ще ${names.length - 1}`);
  if (excluded > 0) parts.push(`без ${excluded}`);
  return parts.join("; ");
}

function yearPatch(query: CatalogQuery, from: number | undefined, to: number | undefined): Partial<CatalogQuery> {
  if (from !== undefined && to !== undefined && from > to) [from, to] = [to, from];
  return { yearFrom: from, yearTo: to };
}

function episodeOptions(current: Range | undefined): [string, string][] {
  const options: [string, string][] = [
    ["", "Будь-яка"],
    ...EPISODE_PRESETS.map((p) => [p.value, p.label] as [string, string]),
  ];
  const value = rangeToParam(current);
  if (value && !options.some(([v]) => v === value)) options.push([value, episodesLabel(current!)]);
  return options;
}

function pluralEpisodes(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "серія";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "серії";
  return "серій";
}

function episodesLabel({ min, max }: Range): string {
  if (min !== undefined && min === max) return `${min} ${pluralEpisodes(min)}`;
  if (min !== undefined && max !== undefined) return `${min}–${max} серій`;
  if (min !== undefined) return `понад ${min - 1} ${pluralEpisodes(min - 1)}`;
  return `до ${max} ${pluralEpisodes(max!)}`;
}

type Chip = { key: string; label: string; exclude?: boolean; remove: Partial<CatalogQuery> };

function activeChips(query: CatalogQuery): Chip[] {
  const chips: Chip[] = [];
  for (const g of query.genres)
    chips.push({ key: `g:${g}`, label: GENRE_LABELS[g], remove: { genres: query.genres.filter((x) => x !== g) } });
  for (const g of query.genresNot)
    chips.push({
      key: `gn:${g}`,
      label: `без «${GENRE_LABELS[g]}»`,
      exclude: true,
      remove: { genresNot: query.genresNot.filter((x) => x !== g) },
    });
  for (const t of query.tags)
    chips.push({ key: `t:${t}`, label: `#${t}`, remove: { tags: query.tags.filter((x) => x !== t) } });
  for (const t of query.tagsNot)
    chips.push({
      key: `tn:${t}`,
      label: `без #${t}`,
      exclude: true,
      remove: { tagsNot: query.tagsNot.filter((x) => x !== t) },
    });
  if (query.yearFrom !== undefined || query.yearTo !== undefined) {
    const { yearFrom: from, yearTo: to } = query;
    const label =
      from !== undefined && from === to
        ? `${from} рік`
        : from !== undefined && to !== undefined
          ? `${from}–${to}`
          : from !== undefined
            ? `з ${from} року`
            : `до ${to} року`;
    chips.push({ key: "year", label, remove: { yearFrom: undefined, yearTo: undefined } });
  }
  if (query.season) chips.push({ key: "season", label: SEASON_LABELS[query.season], remove: { season: undefined } });
  for (const f of query.formats)
    chips.push({ key: `f:${f}`, label: FORMAT_LABELS[f], remove: { formats: query.formats.filter((x) => x !== f) } });
  for (const s of query.statuses)
    chips.push({ key: `s:${s}`, label: STATUS_LABELS[s], remove: { statuses: query.statuses.filter((x) => x !== s) } });
  if (query.episodes) chips.push({ key: "eps", label: episodesLabel(query.episodes), remove: { episodes: undefined } });
  if (query.minScore !== undefined)
    chips.push({ key: "score", label: `оцінка від ${query.minScore}`, remove: { minScore: undefined } });
  if (query.country)
    chips.push({ key: "country", label: COUNTRY_LABELS[query.country] ?? query.country, remove: { country: undefined } });
  if (query.source)
    chips.push({ key: "source", label: SOURCE_LABELS[query.source] ?? query.source, remove: { source: undefined } });
  return chips;
}
