"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { Link, useI18n } from "@/components/i18n/I18nProvider";
import type { Franchise, FranchisePart, MyMedia } from "@/lib/anilist";
import { franchiseEntryAfter, hasUnwatchedAired, mergeStatuses, seasonAverage, type Marks } from "@/lib/franchiseRules";
import type { Locale } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import { formatAiringDate, label, partLabel } from "@/lib/i18n/labels";
import { animeTitle } from "@/lib/i18n/title";
import { LIST_STATUSES, type ListEntry, type ListStatus } from "@/lib/lists";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { selectAll } from "@/lib/supabase/selectAll";
import { useHidden } from "@/components/hidden/HiddenProvider";
import { HiddenList } from "./HiddenList";
import type { Messages } from "@/messages";
import styles from "./MyAnime.module.css";

type SortKey = "new" | "title" | "recent";

/** Частина аніме так, як її показуємо в «Дивлюся». */
type PartView = {
  part: FranchisePart;
  media: MyMedia | undefined;
  isMain: boolean;
  unwatched: number[];
  /** Чи показувати частину серед непереглянутих. */
  pending: boolean;
};

type Item = {
  key: number;
  franchise: Franchise;
  entry: ListEntry;
  parts: PartView[];
};

const NEW_EPISODE_DAYS = 7;
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** «2 год 10 хв», «45 хв». */
function formatDuration(minutes: number, t: Messages["my"]["duration"]): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return fmt(t.minutes, { m });
  return m === 0 ? fmt(t.hours, { h }) : fmt(t.hoursMinutes, { h, m });
}

/** Оцінка: «8», «7,5» / «7.5» — за правилами мови. */
function formatScore(score: number, intl: string): string {
  return score.toLocaleString(intl, { minimumFractionDigits: Number.isInteger(score) ? 0 : 1, maximumFractionDigits: 1 });
}

/** Вставити елемент (посилання, жирний текст) замість {name} у тексті зі словника. */
function withNode(template: string, name: string, node: React.ReactNode): React.ReactNode {
  const [before, after] = template.split(`{${name}}`);
  return (
    <>
      {before}
      {node}
      {after}
    </>
  );
}

function dateValue(part: FranchisePart): number {
  const { year, month, day } = part.startDate;
  return year == null ? Infinity : year * 10000 + (month ?? 12) * 100 + (day ?? 31);
}

/** Місце частини серед усіх частин аніме за датою виходу. */
function chronoIndex(item: { franchise: Franchise }, view: { part: FranchisePart }): number {
  const all = [...item.franchise.main, ...item.franchise.extras].sort((a, b) => dateValue(a) - dateValue(b) || a.id - b.id);
  return all.findIndex((p) => p.id === view.part.id);
}

function partTitle(part: FranchisePart, lang: Locale): string {
  return animeTitle(part.title, lang) || `#${part.id}`;
}

/** Якщо AniList не відповів про частини — показуємо аніме як одну частину. */
function singlePartFranchise(id: number, media: MyMedia | undefined, m: Messages): Franchise {
  const part: FranchisePart = {
    id,
    title: media?.title ?? { romaji: null, english: fmt(m.my.animeNumber, { id }) },
    coverImage: media?.coverImage ?? { large: null, color: null },
    format: media?.format ?? null,
    seasonYear: media?.seasonYear ?? null,
    episodes: media?.episodes ?? null,
    averageScore: media?.averageScore ?? null,
    startDate: { year: media?.startDate.year ?? null, month: null, day: null },
    status: media?.status ?? null,
    duration: media?.duration ?? null,
    kind: "season",
    season: 1,
  };
  return { key: id, title: part.title.english ?? part.title.romaji ?? "", titles: part.title, main: [part], extras: [] };
}

export function MyAnime() {
  const user = useUser();
  const { m, intl, count, plural, lang } = useI18n();
  const t = m.my;
  const [entries, setEntries] = useState<ListEntry[] | undefined>(undefined);
  const [marks, setMarks] = useState<Map<number, Marks>>(new Map());
  const [seasonScores, setSeasonScores] = useState<Map<number, number>>(new Map());
  const [franchises, setFranchises] = useState<Record<number, Franchise>>({});
  const [media, setMedia] = useState<Map<number, MyMedia>>(new Map());
  const [loadProblem, setLoadProblem] = useState<"" | "list" | "franchises" | "anilist">("");
  const [error, setError] = useState(false);
  // Збільшуємо, щоб перечитати все з бази (після невдалого збереження частина могла записатися).
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<ListStatus | "hidden">("watching");
  const { hiddenKeys } = useHidden();
  const [sort, setSort] = useState<SortKey>("new");
  const [openPart, setOpenPart] = useState<number | null>(null);
  const [rating, setRating] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState<number | null>(null);
  const [showWaiting, setShowWaiting] = useState(false);
  // Поточний час (секунди) — фіксуємо під час завантаження, щоб «Нова серія!» не мигала.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    (async () => {
      const [entriesRes, marksRes, scoresRes] = await Promise.all([
        // Лише свої: відкриті профілі інших людей теж можна читати.
        // Порціями: у великого списку відміток серій більше за 1000 (ліміт одного запиту).
        selectAll((from, to) =>
          supabase
            .from("list_entries")
            .select("media_id, status, score, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .order("media_id")
            .range(from, to),
        ),
        selectAll((from, to) =>
          supabase
            .from("episode_marks")
            .select("media_id, episode, watched, score")
            .eq("user_id", user.id)
            .order("media_id")
            .order("episode")
            .range(from, to),
        ),
        selectAll((from, to) =>
          supabase.from("season_scores").select("media_id, score").eq("user_id", user.id).order("media_id").range(from, to),
        ),
      ]);
      if (cancelled) return;
      if (entriesRes.error || marksRes.error) {
        console.error(entriesRes.error ?? marksRes.error);
        setLoadProblem("list");
        setEntries([]);
        return;
      }
      const byMedia = new Map<number, Marks>();
      for (const m of marksRes.data as { media_id: number; episode: number; watched: boolean; score: number | null }[]) {
        if (!byMedia.has(m.media_id)) byMedia.set(m.media_id, new Map());
        byMedia.get(m.media_id)!.set(m.episode, { watched: m.watched, score: m.score });
      }
      const scores = new Map<number, number>();
      for (const s of (scoresRes.data ?? []) as { media_id: number; score: number }[]) scores.set(s.media_id, Number(s.score));
      let list = entriesRes.data as ListEntry[];
      setNow(Date.now() / 1000);
      setMarks(byMedia);
      setSeasonScores(scores);
      if (list.length === 0) {
        setEntries([]);
        return;
      }

      // До яких аніме належать записи (і всі їхні частини).
      let groups: Record<number, Franchise> = {};
      try {
        const res = await fetch(`/api/franchises?ids=${list.map((e) => e.media_id).join(",")}`);
        if (!res.ok) throw new Error(String(res.status));
        groups = await res.json();
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoadProblem("franchises");
      }
      if (cancelled) return;

      // Раніше кожен сезон мав свій запис — об'єднуємо в один запис усього аніме.
      const byKey = new Map<number, ListEntry[]>();
      for (const e of list) {
        const key = groups[e.media_id]?.key ?? e.media_id;
        byKey.set(key, [...(byKey.get(key) ?? []), e]);
      }
      const merged: ListEntry[] = [];
      for (const [key, group] of byKey) {
        const own = group.find((e) => e.media_id === key);
        if (group.length === 1 && own) {
          merged.push(own);
          continue;
        }
        const entry: ListEntry = {
          media_id: key,
          status: mergeStatuses(group.map((e) => e.status)),
          score: own?.score ?? group.find((e) => e.score !== null)?.score ?? null,
          updated_at: group.map((e) => e.updated_at).sort().at(-1)!,
        };
        merged.push(entry);
        const { error: upsertError } = await supabase
          .from("list_entries")
          .upsert({ media_id: key, status: entry.status, score: entry.score });
        if (!upsertError) {
          const stray = group.filter((e) => e.media_id !== key).map((e) => e.media_id);
          if (stray.length) await supabase.from("list_entries").delete().in("media_id", stray);
        }
      }
      list = merged.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      if (cancelled) return;
      setFranchises(groups);
      setEntries(list);

      // Свіжі дані про вихід серій для всіх частин аніме, що «Дивлюся» або «Переглянуто».
      const partIds = new Set<number>();
      for (const e of list) {
        const f = groups[e.media_id];
        if (f && (e.status === "watching" || e.status === "completed"))
          for (const p of [...f.main, ...f.extras]) partIds.add(p.id);
        partIds.add(e.media_id);
      }
      let fresh = new Map<number, MyMedia>();
      try {
        const res = await fetch(`/api/my-media?ids=${[...partIds].join(",")}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as MyMedia[];
        fresh = new Map(data.map((m) => [m.id, m]));
        if (!cancelled) setMedia(fresh);
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoadProblem("anilist");
        return;
      }

      // «Переглянуто», а є серія, що вже вийшла й не відмічена (новий сезон, нова серія чи просто
      // невідмічена) → назад у «Дивлюся», де видно саме ці серії.
      const reopened: number[] = [];
      for (const e of list) {
        const f = groups[e.media_id];
        if (e.status !== "completed" || !f) continue;
        const main = f.main.map((p) => ({
          id: p.id,
          episodes: fresh.get(p.id)?.episodes ?? p.episodes,
          status: fresh.get(p.id)?.status ?? p.status,
          aired: fresh.get(p.id)?.airedCount,
        }));
        if (hasUnwatchedAired(main, byMedia)) reopened.push(e.media_id);
      }
      if (reopened.length > 0 && !cancelled) {
        const { error: entriesError } = await supabase
          .from("list_entries")
          .upsert(reopened.map((key) => ({ media_id: key, status: "watching", score: list.find((x) => x.media_id === key)?.score ?? null })));
        if (entriesError) {
          console.error(entriesError);
        } else if (!cancelled) {
          const now = new Date().toISOString();
          setEntries((current) =>
            current?.map((x) => (reopened.includes(x.media_id) ? { ...x, status: "watching", updated_at: now } : x)),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, version]);

  const items: Item[] = useMemo(
    () =>
      (entries ?? []).map((entry) => {
        const franchise = franchises[entry.media_id] ?? singlePartFranchise(entry.media_id, media.get(entry.media_id), m);
        const mainIds = new Set(franchise.main.map((p) => p.id));
        const parts = [...franchise.main, ...franchise.extras].map((part): PartView => {
          const fresh = media.get(part.id);
          const partMarks = marks.get(part.id);
          const aired = fresh?.airedCount ?? 0;
          const unwatched: number[] = [];
          for (let n = 1; n <= aired; n++) if (!partMarks?.get(n)?.watched) unwatched.push(n);
          const isMain = mainIds.has(part.id);
          // Побічні частини показуємо, лише якщо людина вже почала їх дивитися.
          const started = Boolean(partMarks && [...partMarks.values()].some((x) => x.watched));
          return { part, media: fresh, isMain, unwatched, pending: unwatched.length > 0 && (isMain || started) };
        });
        return { key: entry.media_id, franchise, entry, parts };
      }),
    [entries, franchises, marks, media, m],
  );

  if (user === undefined || (user && entries === undefined)) return <div className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.title}>{t.title}</h1>
        <p>{withNode(t.loggedOut.text, "link", <Link href="/login?next=%2Fmy">{t.loggedOut.link}</Link>)}</p>
      </div>
    );
  }

  const counts = Object.fromEntries(LIST_STATUSES.map((s) => [s, 0])) as Record<ListStatus, number>;
  for (const item of items) counts[item.entry.status]++;

  const mediaReady = media.size > 0;
  const watching = items.filter((i) => i.entry.status === "watching");
  const behind = watching.filter((i) => !mediaReady || i.parts.some((p) => p.pending));
  const waiting = mediaReady ? watching.filter((i) => !i.parts.some((p) => p.pending)) : [];

  const lastAired = (item: Item) => Math.max(0, ...item.parts.filter((p) => p.pending).map((p) => p.media?.lastAiredAt ?? 0));
  const isNewPart = (p: PartView) => Boolean(p.pending && p.media?.lastAiredAt && now - p.media.lastAiredAt < NEW_EPISODE_DAYS * 86400);

  const sorted = [...behind].sort((a, b) => {
    if (sort === "title") return animeTitle(a.franchise.titles, lang).localeCompare(animeTitle(b.franchise.titles, lang), intl);
    if (sort === "recent") return b.entry.updated_at.localeCompare(a.entry.updated_at);
    return lastAired(b) - lastAired(a) || b.entry.updated_at.localeCompare(a.entry.updated_at);
  });

  // ---- зміни ----

  /** Відмітити серії частини переглянутими; з `score` — ще й оцінити (оцінена серія = переглянута). */
  async function markEpisodes(item: Item, view: PartView, episodes: number[], score?: number) {
    if (episodes.length === 0) return;
    const partId = view.part.id;
    const before = { marks, seasonScores, entries };

    const partMarks: Marks = new Map(marks.get(partId));
    for (const n of episodes)
      partMarks.set(n, { watched: true, score: score !== undefined ? score : (partMarks.get(n)?.score ?? null) });
    const nextMarks = new Map(marks).set(partId, partMarks);

    const partInfo = { id: partId, episodes: view.media?.episodes ?? view.part.episodes, status: view.media?.status ?? view.part.status };
    const average = seasonAverage(partInfo, partMarks);
    const nextScores = new Map(seasonScores);
    const seasonChanged = average !== null && average !== seasonScores.get(partId);
    if (seasonChanged) nextScores.set(partId, average);

    const main = item.franchise.main.map((p) => {
      const fresh = media.get(p.id);
      return { id: p.id, episodes: fresh?.episodes ?? p.episodes, status: fresh?.status ?? p.status, aired: fresh?.airedCount };
    });
    const nextEntry = franchiseEntryAfter({ key: item.key, entry: item.entry, main, marks: nextMarks, seasonScores: nextScores });

    setMarks(nextMarks);
    setSeasonScores(nextScores);
    if (nextEntry && nextEntry !== item.entry)
      setEntries((list) => list?.map((e) => (e.media_id === item.key ? nextEntry : e)));
    setError(false);

    const supabase = getSupabaseBrowser();
    const writes: PromiseLike<{ error: { message: string } | null }>[] = [
      supabase
        .from("episode_marks")
        .upsert(
          episodes.map((episode) =>
            score !== undefined ? { media_id: partId, episode, watched: true, score } : { media_id: partId, episode, watched: true },
          ),
        ),
    ];
    if (seasonChanged) writes.push(supabase.from("season_scores").upsert({ media_id: partId, score: average }));
    if (nextEntry && nextEntry !== item.entry)
      writes.push(supabase.from("list_entries").upsert({ media_id: item.key, status: nextEntry.status, score: nextEntry.score }));
    const results = await Promise.all(writes);
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error(failed.error);
      setMarks(before.marks);
      setSeasonScores(before.seasonScores);
      setEntries(before.entries);
      setVersion((v) => v + 1);
      setError(true);
    }
  }

  // ---- вигляд ----

  return (
    <div>
      <h1 className={styles.title}>{t.title}</h1>

      <div className={styles.tabs} role="tablist" aria-label={t.tabsLabel}>
        {LIST_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={tab === s}
            className={`${styles.tab} ${tab === s ? styles.tabActive : ""}`}
            onClick={() => setTab(s)}
          >
            {t.statuses[s]} <span className={styles.count}>{counts[s]}</span>
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={tab === "hidden"}
          className={`${styles.tab} ${styles.tabHidden} ${tab === "hidden" ? styles.tabActive : ""}`}
          onClick={() => setTab("hidden")}
        >
          ✕ {m.hidden.tab} <span className={styles.count}>{hiddenKeys.size}</span>
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {m.common.saveError}
        </p>
      )}
      {loadProblem && (
        <p className={styles.error}>
          {loadProblem === "list" ? t.loadError : loadProblem === "franchises" ? t.franchisesSlow : m.common.anilistError}
        </p>
      )}

      {tab === "watching" ? (
        <>
          {behind.length > 0 && (
            <div className={styles.sortRow}>
              <span>{t.sort.label}</span>
              {(["new", "title", "recent"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.sortButton} ${sort === key ? styles.sortActive : ""}`}
                  aria-pressed={sort === key}
                  onClick={() => setSort(key)}
                >
                  {t.sort[key]}
                </button>
              ))}
            </div>
          )}

          {behind.length === 0 && (
            <div className={styles.empty}>
              {watching.length === 0 ? (
                <p>{withNode(t.empty.watching, "link", <Link href="/catalog">{t.empty.catalogLink}</Link>)}</p>
              ) : (
                <p>{t.empty.caughtUp}</p>
              )}
            </div>
          )}

          <ul className={styles.list}>
            {sorted.map((item) => {
              // Найновіша частина зверху — як на myshows.
              const pending = item.parts.filter((p) => p.pending).sort((a, b) => chronoIndex(item, b) - chronoIndex(item, a));
              const minutes = pending.reduce((sum, p) => sum + p.unwatched.length * (p.media?.duration ?? p.part.duration ?? 0), 0);
              const cover = item.franchise.main[0]?.coverImage ?? pending[0]?.part.coverImage;
              const anyNew = pending.some(isNewPart);
              return (
                <li key={item.key} className={styles.item}>
                  <div className={styles.franchiseHead}>
                    <Link href={`/anime/${item.key}`} className={styles.poster}>
                      {cover?.large && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover.large} alt="" loading="lazy" />
                      )}
                    </Link>
                    <div className={styles.itemInfo}>
                      <Link href={`/anime/${item.key}`} className={styles.itemTitle}>
                        {animeTitle(item.franchise.titles, lang) || m.common.untitled}
                      </Link>
                      <p className={styles.itemMeta}>
                        {anyNew && <span className={styles.newBadge}>{t.newEpisode}</span>}
                        {mediaReady ? (
                          <>
                            {(() => {
                              // «осталась 1 серия» / «осталось 5 серий» — форма дієслова теж залежить від числа.
                              const total = pending.reduce((n, p) => n + p.unwatched.length, 0);
                              return withNode(plural(t.left, total), "episodes", <b>{count(m.common.episodes, total)}</b>);
                            })()}
                            {minutes > 0 && <> · ~{formatDuration(minutes, t.duration)}</>}
                          </>
                        ) : (
                          t.loading
                        )}
                        {item.entry.score !== null && <> · {fmt(t.myScore, { score: formatScore(item.entry.score, intl) })}</>}
                      </p>
                    </div>
                  </div>

                  <ul className={styles.parts}>
                    {pending.map((view) => {
                      const id = view.part.id;
                      const expanded = openPart === id;
                      const left = view.unwatched;
                      const showTitle = partTitle(view.part, lang) !== animeTitle(item.franchise.titles, lang);
                      const fullSeason =
                        (view.media?.episodes ?? view.part.episodes ?? 0) > 0 &&
                        (view.media?.airedCount ?? 0) >= (view.media?.episodes ?? view.part.episodes ?? 0);
                      return (
                        <li key={id} className={styles.part}>
                          <div className={styles.partRow}>
                            <button
                              type="button"
                              className={styles.partToggle}
                              aria-expanded={expanded}
                              onClick={() => (setOpenPart(expanded ? null : id), setRating(null), setConfirmAll(null))}
                            >
                              <span className={styles.partLabel}>{partLabel(view.part, m)}</span>
                              {showTitle && <span className={styles.partTitle}>{partTitle(view.part, lang)}</span>}
                              <span className={styles.partCount}>{count(m.common.episodes, left.length)}</span>
                              {isNewPart(view) && <span className={styles.newDot}>{t.newDot}</span>}
                              <span className={styles.chevron} aria-hidden="true">
                                {expanded ? "▴" : "▾"}
                              </span>
                            </button>
                            <button
                              type="button"
                              className={styles.plusOne}
                              onClick={() => markEpisodes(item, view, [left[0]])}
                              aria-label={fmt(t.plusOneLabel, { n: left[0], part: partLabel(view.part, m) })}
                            >
                              +1 <span className={styles.plusOneHint}>{fmt(t.episodeNo, { n: left[0] })}</span>
                            </button>
                          </div>
                          {view.media?.nextAiringEpisode && (
                            <p className={styles.next}>
                              {fmt(t.nextEpisode, {
                                n: view.media.nextAiringEpisode.episode,
                                date: formatAiringDate(view.media.nextAiringEpisode.airingAt, intl),
                              })}
                            </p>
                          )}

                          {expanded && (
                            <div className={styles.partBody}>
                              {confirmAll === id ? (
                                <p className={styles.confirmAll}>
                                  {fmt(t.confirmAll, { episodes: count(m.common.episodes, left.length) })}{" "}
                                  <button
                                    type="button"
                                    className={styles.confirmYes}
                                    onClick={() => (setConfirmAll(null), markEpisodes(item, view, left))}
                                  >
                                    {m.common.yes}
                                  </button>
                                  <button type="button" className={styles.confirmNo} onClick={() => setConfirmAll(null)}>
                                    {m.common.no}
                                  </button>
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.seasonDone}
                                  onClick={() => (left.length > 1 ? setConfirmAll(id) : markEpisodes(item, view, left))}
                                >
                                  ✓ {fullSeason ? t.seasonDone : t.airedDone}
                                </button>
                              )}
                              <ol className={styles.episodes}>
                                {left.slice(0, 50).map((n) => {
                                  const key = `${id}:${n}`;
                                  return (
                                    <li key={n} className={styles.episode}>
                                      <div className={styles.episodeRow}>
                                        <span className={styles.episodeNumber}>{n}</span>
                                        <span className={styles.episodeTitle}>{fmt(t.episode, { n })}</span>
                                        {n > left[0] && (
                                          <button
                                            type="button"
                                            className={styles.upTo}
                                            onClick={() => markEpisodes(item, view, left.filter((x) => x <= n))}
                                          >
                                            {t.upTo}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className={styles.rate}
                                          aria-expanded={rating === key}
                                          aria-label={fmt(t.rateLabel, { n })}
                                          onClick={() => setRating(rating === key ? null : key)}
                                        >
                                          ☆
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.watchedButton}
                                          aria-label={fmt(t.watchedLabel, { n })}
                                          onClick={() => markEpisodes(item, view, [n])}
                                        >
                                          ✓ <span>{t.watched}</span>
                                        </button>
                                      </div>
                                      {rating === key && (
                                        <div className={styles.rating} role="group" aria-label={fmt(t.ratingLabel, { n })}>
                                          {SCORES.map((score) => (
                                            <button
                                              key={score}
                                              type="button"
                                              className={styles.ratingButton}
                                              onClick={() => (setRating(null), markEpisodes(item, view, [n], score))}
                                            >
                                              {score}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </li>
                                  );
                                })}
                                {left.length > 50 && (
                                  <li className={styles.more}>
                                    {withNode(
                                      fmt(t.more.text, { n: left.length - 50 }),
                                      "link",
                                      <Link href={`/anime/${id}`}>{t.more.link}</Link>,
                                    )}
                                  </li>
                                )}
                              </ol>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>

          {waiting.length > 0 && (
            <div className={styles.waiting}>
              <button
                type="button"
                className={styles.waitingToggle}
                aria-expanded={showWaiting}
                onClick={() => setShowWaiting((v) => !v)}
              >
                {showWaiting ? "▴" : "▾"} {fmt(t.waiting.toggle, { n: waiting.length })}
              </button>
              {showWaiting && (
                <ul className={styles.waitingList}>
                  {waiting.map((item) => {
                    const next = item.parts
                      .map((p) => p.media?.nextAiringEpisode && { ...p.media.nextAiringEpisode, label: partLabel(p.part, m) })
                      .find(Boolean);
                    return (
                      <li key={item.key}>
                        <Link href={`/anime/${item.key}`}>{animeTitle(item.franchise.titles, lang) || m.common.untitled}</Link>
                        <span>
                          {next
                            ? fmt(t.waiting.next, { part: next.label, n: next.episode, date: formatAiringDate(next.airingAt, intl) })
                            : t.waiting.unknown}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      ) : tab === "hidden" ? (
        <HiddenList />
      ) : (
        <Grid items={items.filter((i) => i.entry.status === tab)} />
      )}
    </div>
  );
}

function Grid({ items }: { items: Item[] }) {
  const { m, intl, count, lang } = useI18n();
  if (items.length === 0) return <div className={styles.empty}>{m.my.empty.grid}</div>;
  return (
    <ul className={styles.grid}>
      {items.map(({ key, franchise, entry }) => {
        const first = franchise.main[0];
        const parts = franchise.main.length + franchise.extras.length;
        return (
          <li key={key}>
            <Link href={`/anime/${key}`} className={styles.card}>
              <span className={styles.cardPoster} style={{ backgroundColor: first?.coverImage.color ?? undefined }}>
                {first?.coverImage.large && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={first.coverImage.large} alt="" loading="lazy" />
                )}
                {entry.score !== null && <span className={styles.myScore}>★ {formatScore(entry.score, intl)}</span>}
              </span>
              <span className={styles.cardTitle}>{animeTitle(franchise.titles, lang) || m.common.untitled}</span>
              <span className={styles.cardMeta}>
                {parts > 1
                  ? `${count(m.my.parts, franchise.main.length)}${franchise.extras.length ? fmt(m.my.extras, { n: franchise.extras.length }) : ""}`
                  : [first?.format && label(m.labels.format, first.format), first?.startDate.year ?? first?.seasonYear].filter(Boolean).join(" · ")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
