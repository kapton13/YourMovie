"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import type { MyMedia } from "@/lib/anilist";
import { entryAfterMarks } from "@/lib/listRules";
import { LIST_STATUSES, LIST_STATUS_LABELS, formatUserScore, type ListEntry, type ListStatus } from "@/lib/lists";
import { FORMAT_LABELS } from "@/lib/labels";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import styles from "./MyAnime.module.css";

type Mark = { watched: boolean; score: number | null };
type Item = { entry: ListEntry; media: MyMedia | undefined; watched: Set<number> };
type SortKey = "new" | "title" | "recent";

const NEW_EPISODE_DAYS = 7;

const shortDate = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", timeZone: "Europe/Kyiv" });

function titleOf(media: MyMedia | undefined, id: number): string {
  return media?.title.english ?? media?.title.romaji ?? `Аніме #${id}`;
}

/** «2 год 10 хв», «45 хв». */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} хв`;
  return m === 0 ? `${h} год` : `${h} год ${m} хв`;
}

function pluralEpisodes(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "серія";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "серії";
  return "серій";
}

export function MyAnime() {
  const user = useUser();
  const [entries, setEntries] = useState<ListEntry[] | undefined>(undefined);
  const [marks, setMarks] = useState<Map<number, Map<number, Mark>>>(new Map());
  const [media, setMedia] = useState<Map<number, MyMedia>>(new Map());
  const [mediaFailed, setMediaFailed] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ListStatus>("watching");
  const [sort, setSort] = useState<SortKey>("new");
  const [open, setOpen] = useState<number | null>(null);
  const [showWaiting, setShowWaiting] = useState(false);
  /** Відкрита оцінка серії: «mediaId:номер». */
  const [rating, setRating] = useState<string | null>(null);
  /** Аніме, для якого питаємо «Відмітити весь сезон?». */
  const [confirmAll, setConfirmAll] = useState<number | null>(null);
  // Поточний час (секунди) — фіксуємо під час завантаження, щоб «Нова серія!» не мигала.
  const [now, setNow] = useState(0);

  // 1) свої записи й відмітки з бази, 2) дані про аніме з AniList
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    (async () => {
      const [entriesRes, marksRes] = await Promise.all([
        supabase.from("list_entries").select("media_id, status, score, updated_at").order("updated_at", { ascending: false }),
        supabase.from("episode_marks").select("media_id, episode, watched, score"),
      ]);
      if (cancelled) return;
      if (entriesRes.error || marksRes.error) {
        console.error(entriesRes.error ?? marksRes.error);
        setError("Не вдалося завантажити ваш список. Оновіть сторінку.");
        setEntries([]);
        return;
      }
      const byMedia = new Map<number, Map<number, Mark>>();
      for (const m of marksRes.data as { media_id: number; episode: number; watched: boolean; score: number | null }[]) {
        if (!byMedia.has(m.media_id)) byMedia.set(m.media_id, new Map());
        byMedia.get(m.media_id)!.set(m.episode, { watched: m.watched, score: m.score });
      }
      const list = entriesRes.data as ListEntry[];
      setNow(Date.now() / 1000);
      setMarks(byMedia);
      setEntries(list);
      if (list.length === 0) return;
      try {
        const res = await fetch(`/api/my-media?ids=${list.map((e) => e.media_id).join(",")}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as MyMedia[];
        if (!cancelled) setMedia(new Map(data.map((m) => [m.id, m])));
      } catch (e) {
        console.error(e);
        if (!cancelled) setMediaFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const items: Item[] = useMemo(
    () =>
      (entries ?? []).map((entry) => {
        const watched = new Set<number>();
        for (const [episode, m] of marks.get(entry.media_id) ?? []) if (m.watched) watched.add(episode);
        return { entry, media: media.get(entry.media_id), watched };
      }),
    [entries, marks, media],
  );

  if (user === undefined || (user && entries === undefined)) return <div className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.title}>Мої аніме</h1>
        <p>
          <Link href="/login?next=%2Fmy">Увійдіть</Link>, щоб бачити свої списки, нові серії й прогрес.
        </p>
      </div>
    );
  }

  const counts = Object.fromEntries(LIST_STATUSES.map((s) => [s, 0])) as Record<ListStatus, number>;
  for (const item of items) counts[item.entry.status]++;

  /** Непереглянуті серії, що вже вийшли. */
  const unwatched = (item: Item): number[] => {
    const aired = item.media?.airedCount ?? 0;
    const result: number[] = [];
    for (let n = 1; n <= aired; n++) if (!item.watched.has(n)) result.push(n);
    return result;
  };

  const watching = items.filter((i) => i.entry.status === "watching");
  const behind = watching.filter((i) => !i.media || unwatched(i).length > 0);
  const waiting = watching.filter((i) => i.media && unwatched(i).length === 0);

  const isNew = (item: Item) =>
    Boolean(item.media?.lastAiredAt && now - item.media.lastAiredAt < NEW_EPISODE_DAYS * 86400 && unwatched(item).length > 0);

  const sorted = [...behind].sort((a, b) => {
    if (sort === "title") return titleOf(a.media, a.entry.media_id).localeCompare(titleOf(b.media, b.entry.media_id));
    if (sort === "recent") return b.entry.updated_at.localeCompare(a.entry.updated_at);
    return (b.media?.lastAiredAt ?? 0) - (a.media?.lastAiredAt ?? 0) || b.entry.updated_at.localeCompare(a.entry.updated_at);
  });

  // ---- зміни ----

  /** Відмітити серії переглянутими; з `score` — ще й оцінити (оцінена серія = переглянута). */
  async function markEpisodes(item: Item, episodes: number[], score?: number | null) {
    if (episodes.length === 0 || !item.media) return;
    const mediaId = item.entry.media_id;
    const prevMarks = marks;
    const prevEntries = entries;
    const nextForMedia = new Map(marks.get(mediaId) ?? []);
    for (const n of episodes)
      nextForMedia.set(n, { watched: true, score: score !== undefined ? score : (nextForMedia.get(n)?.score ?? null) });
    const nextEntry = entryAfterMarks(item.entry, nextForMedia, {
      mediaId,
      total: item.media.episodes,
      finished: item.media.status === "FINISHED",
    });
    setMarks(new Map(marks).set(mediaId, nextForMedia));
    if (nextEntry && nextEntry !== item.entry)
      setEntries((list) => list?.map((e) => (e.media_id === mediaId ? nextEntry : e)));
    setError("");

    const supabase = getSupabaseBrowser();
    const { error: marksError } = await supabase
      .from("episode_marks")
      .upsert(
        episodes.map((episode) =>
          score !== undefined ? { media_id: mediaId, episode, watched: true, score } : { media_id: mediaId, episode, watched: true },
        ),
      );
    let entryError = null;
    if (!marksError && nextEntry && nextEntry !== item.entry) {
      entryError = (
        await supabase
          .from("list_entries")
          .upsert({ media_id: mediaId, status: nextEntry.status, score: nextEntry.score })
      ).error;
    }
    if (marksError || entryError) {
      console.error(marksError ?? entryError);
      setMarks(prevMarks);
      setEntries(prevEntries);
      setError("Не вдалося зберегти. Перевірте інтернет і спробуйте ще раз.");
    }
  }

  // ---- вигляд ----

  return (
    <div>
      <h1 className={styles.title}>Мої аніме</h1>

      <div className={styles.tabs} role="tablist" aria-label="Списки">
        {LIST_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={tab === s}
            className={`${styles.tab} ${tab === s ? styles.tabActive : ""}`}
            onClick={() => setTab(s)}
          >
            {LIST_STATUS_LABELS[s]} <span className={styles.count}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {mediaFailed && (
        <p className={styles.error}>Не вдалося завантажити дані з AniList. Спробуйте оновити сторінку трохи згодом.</p>
      )}

      {tab === "watching" ? (
        <>
          {behind.length > 0 && (
            <div className={styles.sortRow}>
              <span>Сортування:</span>
              {(
                [
                  ["new", "нові серії"],
                  ["title", "назва"],
                  ["recent", "остання відмітка"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.sortButton} ${sort === key ? styles.sortActive : ""}`}
                  aria-pressed={sort === key}
                  onClick={() => setSort(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {behind.length === 0 && (
            <div className={styles.empty}>
              {watching.length === 0 ? (
                <p>
                  Тут з’являться аніме зі статусом «Дивлюся». Знайдіть щось у <Link href="/catalog">каталозі</Link> і
                  відмітьте першу серію.
                </p>
              ) : (
                <p>Усе, що вийшло, переглянуто. Щойно вийде нова серія — аніме з’явиться тут.</p>
              )}
            </div>
          )}

          <ul className={styles.list}>
            {sorted.map((item) => {
              const id = item.entry.media_id;
              const left = unwatched(item);
              const aired = item.media?.airedCount ?? 0;
              const watchedCount = Math.min(item.watched.size, aired || item.watched.size);
              const minutes = (item.media?.duration ?? 0) * left.length;
              const percent = aired ? Math.round((watchedCount / aired) * 100) : 0;
              const expanded = open === id;
              return (
                <li key={id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <Link href={`/anime/${id}`} className={styles.poster}>
                      {item.media?.coverImage.large && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.media.coverImage.large} alt="" loading="lazy" />
                      )}
                    </Link>
                    <div className={styles.itemInfo}>
                      <Link href={`/anime/${id}`} className={styles.itemTitle}>
                        {titleOf(item.media, id)}
                      </Link>
                      <p className={styles.itemMeta}>
                        {isNew(item) && <span className={styles.newBadge}>Нова серія!</span>}
                        {item.media && (
                          <>
                            {watchedCount} з {item.media.episodes ?? aired} ·{" "}
                            <b>
                              залишилось {left.length} {pluralEpisodes(left.length)}
                            </b>
                            {minutes > 0 && <> (~{formatDuration(minutes)})</>}
                          </>
                        )}
                      </p>
                      <div className={styles.progress} aria-hidden="true">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                      {left.length > 0 &&
                        (confirmAll === id ? (
                          <p className={styles.confirmAll}>
                            Відмітити {left.length} {pluralEpisodes(left.length)} переглянутими?{" "}
                            <button
                              type="button"
                              className={styles.confirmYes}
                              onClick={() => (setConfirmAll(null), markEpisodes(item, left))}
                            >
                              Так
                            </button>
                            <button type="button" className={styles.confirmNo} onClick={() => setConfirmAll(null)}>
                              Ні
                            </button>
                          </p>
                        ) : (
                          <button
                            type="button"
                            className={styles.seasonDone}
                            onClick={() => (left.length > 1 ? setConfirmAll(id) : markEpisodes(item, left))}
                          >
                            ✓{" "}
                            {item.media && item.media.episodes && item.media.airedCount >= item.media.episodes
                              ? "Переглянуто весь сезон"
                              : "Переглянуто все, що вийшло"}
                          </button>
                        ))}
                      {item.media?.nextAiringEpisode && (
                        <p className={styles.next}>
                          Серія {item.media.nextAiringEpisode.episode} вийде{" "}
                          {shortDate.format(new Date(item.media.nextAiringEpisode.airingAt * 1000))}
                        </p>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      {left.length > 0 && (
                        <button type="button" className={styles.plusOne} onClick={() => markEpisodes(item, [left[0]])}>
                          +1 серія
                          <span className={styles.plusOneHint}>№{left[0]}</span>
                        </button>
                      )}
                      {left.length > 0 && (
                        <button
                          type="button"
                          className={styles.expand}
                          aria-expanded={expanded}
                          aria-label={expanded ? "Згорнути серії" : "Показати непереглянуті серії"}
                          onClick={() => setOpen(expanded ? null : id)}
                        >
                          {expanded ? "▴" : "▾"}
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <ol className={styles.episodes}>
                      {left.slice(0, 50).map((n) => {
                        const key = `${id}:${n}`;
                        return (
                          <li key={n} className={styles.episode}>
                            <div className={styles.episodeRow}>
                              <span className={styles.episodeNumber}>{n}</span>
                              <span className={styles.episodeTitle}>Серія {n}</span>
                              {n > left[0] && (
                                <button
                                  type="button"
                                  className={styles.upTo}
                                  onClick={() => markEpisodes(item, left.filter((x) => x <= n))}
                                >
                                  усі до цієї
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.rate}
                                aria-expanded={rating === key}
                                aria-label={`Оцінити серію ${n}`}
                                onClick={() => setRating(rating === key ? null : key)}
                              >
                                ☆
                              </button>
                              <button
                                type="button"
                                className={styles.watchedButton}
                                aria-label={`Серію ${n} переглянуто`}
                                onClick={() => markEpisodes(item, [n])}
                              >
                                ✓ <span>Переглянуто</span>
                              </button>
                            </div>
                            {rating === key && (
                              <div className={styles.rating} role="group" aria-label={`Оцінка серії ${n}`}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                  <button
                                    key={score}
                                    type="button"
                                    className={styles.ratingButton}
                                    onClick={() => (setRating(null), markEpisodes(item, [n], score))}
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
                          Ще {left.length - 50} — на <Link href={`/anime/${id}`}>сторінці аніме</Link>
                        </li>
                      )}
                    </ol>
                  )}
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
                {showWaiting ? "▴" : "▾"} Чекають нових серій ({waiting.length})
              </button>
              {showWaiting && (
                <ul className={styles.waitingList}>
                  {waiting.map((item) => (
                    <li key={item.entry.media_id}>
                      <Link href={`/anime/${item.entry.media_id}`}>{titleOf(item.media, item.entry.media_id)}</Link>
                      <span>
                        {item.media?.nextAiringEpisode
                          ? `серія ${item.media.nextAiringEpisode.episode} — ${shortDate.format(new Date(item.media.nextAiringEpisode.airingAt * 1000))}`
                          : "дата наступної серії невідома"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : (
        <Grid items={items.filter((i) => i.entry.status === tab)} />
      )}
    </div>
  );
}

function Grid({ items }: { items: Item[] }) {
  if (items.length === 0) return <div className={styles.empty}>Тут поки порожньо.</div>;
  return (
    <ul className={styles.grid}>
      {items.map(({ entry, media }) => (
        <li key={entry.media_id}>
          <Link href={`/anime/${entry.media_id}`} className={styles.card}>
            <span className={styles.cardPoster} style={{ backgroundColor: media?.coverImage.color ?? undefined }}>
              {media?.coverImage.large && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.coverImage.large} alt="" loading="lazy" />
              )}
              {entry.score !== null && <span className={styles.myScore}>★ {formatUserScore(entry.score)}</span>}
            </span>
            <span className={styles.cardTitle}>{titleOf(media, entry.media_id)}</span>
            {media && (
              <span className={styles.cardMeta}>
                {[media.format && FORMAT_LABELS[media.format], media.startDate.year ?? media.seasonYear].filter(Boolean).join(" · ")}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
