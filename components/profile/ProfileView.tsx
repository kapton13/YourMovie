"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { Link, useI18n } from "@/components/i18n/I18nProvider";
import { MediaGrid } from "@/components/MediaGrid";
import type { MyMedia } from "@/lib/anilist";
import { label } from "@/lib/i18n/labels";
import { LIST_STATUSES, type ListStatus } from "@/lib/lists";
import { computeStats, type ProfileStats, type StatsEntry, type StatsMark } from "@/lib/stats";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { selectAll } from "@/lib/supabase/selectAll";
import styles from "./Profile.module.css";

type PublicProfile = {
  id: string | null;
  nickname: string;
  user_number: number;
  created_at: string;
  is_public: boolean;
};

type Loaded =
  | { kind: "missing" }
  | { kind: "closed"; profile: PublicProfile }
  | { kind: "error" }
  | {
      kind: "ready";
      profile: PublicProfile;
      entries: (StatsEntry & { updated_at: string })[];
      stats: ProfileStats;
      media: Map<number, MyMedia>;
    };

const MEDIA_CHUNK = 200;

/** Дані AniList про аніме зі списку (тривалість, жанри, постери) — порціями. */
async function loadMedia(ids: number[]): Promise<Map<number, MyMedia>> {
  const unique = [...new Set(ids)].sort((a, b) => a - b);
  const result = new Map<number, MyMedia>();
  for (let i = 0; i < unique.length; i += MEDIA_CHUNK) {
    const res = await fetch(`/api/my-media?ids=${unique.slice(i, i + MEDIA_CHUNK).join(",")}`);
    if (!res.ok) throw new Error(`my-media ${res.status}`);
    for (const m of (await res.json()) as MyMedia[]) result.set(m.id, m);
  }
  return result;
}

/** Оцінка за правилами мови: 7 → «7», 7.4 → «7,4» / "7.4". */
function useScoreText(): (score: number) => string {
  const { intl } = useI18n();
  return (score) => score.toLocaleString(intl, { maximumFractionDigits: 1 });
}

/** Профіль користувача: статистика й списки. Свій — завжди, чужий — якщо відкритий. */
export function ProfileView({ nickname }: { nickname: string }) {
  const { m, fmt } = useI18n();
  const user = useUser();
  const userId = user === undefined ? undefined : (user?.id ?? null);
  const [loaded, setLoaded] = useState<{ key: string; data: Loaded } | null>(null);
  const loadKey = `${nickname}|${userId}`;

  useEffect(() => {
    // Чекаємо, доки стане відомо, чи людина ввійшла: від цього залежить, чи бачить вона свій закритий профіль.
    if (userId === undefined) return;
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    const done = (data: Loaded) => !cancelled && setLoaded({ key: loadKey, data });
    (async () => {
      const { data: rows, error } = await supabase.rpc("profile_by_nickname", { nick: nickname });
      if (error) return done({ kind: "error" });
      const profile = (rows as PublicProfile[] | null)?.[0];
      if (!profile) return done({ kind: "missing" });
      if (!profile.id) return done({ kind: "closed", profile });
      const id = profile.id;
      const [entriesRes, marksRes] = await Promise.all([
        selectAll((from, to) =>
          supabase
            .from("list_entries")
            .select("media_id, status, score, updated_at")
            .eq("user_id", id)
            .order("updated_at", { ascending: false })
            .order("media_id")
            .range(from, to),
        ),
        selectAll((from, to) =>
          supabase
            .from("episode_marks")
            .select("media_id, episode, watched, updated_at")
            .eq("user_id", id)
            .order("media_id")
            .order("episode")
            .range(from, to),
        ),
      ]);
      if (entriesRes.error || marksRes.error) return done({ kind: "error" });
      const entries = (entriesRes.data as (StatsEntry & { updated_at: string })[]).map((e) => ({
        ...e,
        score: e.score === null ? null : Number(e.score),
      }));
      const marks = marksRes.data as StatsMark[];
      try {
        const media = await loadMedia([...entries.map((e) => e.media_id), ...marks.map((m) => m.media_id)]);
        done({ kind: "ready", profile, entries, media, stats: computeStats(entries, marks, media, new Date()) });
      } catch (e) {
        console.error(e);
        done({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nickname, userId, loadKey]);

  const data = loaded?.key === loadKey ? loaded.data : null;
  if (!data) return <div className={styles.skeleton} aria-busy="true" />;

  if (data.kind === "missing")
    return (
      <div className={styles.message}>
        <h1 className={styles.title}>{m.profile.missing.title}</h1>
        <p>{fmt(m.profile.missing.text, { nickname })}</p>
      </div>
    );
  if (data.kind === "error")
    return (
      <div className={styles.message}>
        <h1 className={styles.title}>{m.profile.error.title}</h1>
        <p>{m.profile.error.text}</p>
      </div>
    );
  if (data.kind === "closed")
    return (
      <div className={styles.message}>
        <Head profile={data.profile} />
        <p>{fmt(m.profile.closed, { nickname: data.profile.nickname })}</p>
      </div>
    );

  const own = user?.id === data.profile.id;
  return <Ready profile={data.profile} entries={data.entries} stats={data.stats} media={data.media} own={own} />;
}

function Head({ profile }: { profile: PublicProfile }) {
  const { m, fmt, intl } = useI18n();
  const since = new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(profile.created_at),
  );
  return (
    <div className={styles.head}>
      <span className={styles.avatar} aria-hidden="true">
        {profile.nickname[0]?.toUpperCase()}
      </span>
      <div>
        <h1 className={styles.title} dir="auto">
          {profile.nickname}
        </h1>
        <p className={styles.since}>{fmt(m.profile.since, { date: since })}</p>
      </div>
    </div>
  );
}

function Ready({
  profile,
  entries,
  stats,
  media,
  own,
}: {
  profile: PublicProfile;
  entries: (StatsEntry & { updated_at: string })[];
  stats: ProfileStats;
  media: Map<number, MyMedia>;
  own: boolean;
}) {
  const { m, fmt, count, intl } = useI18n();
  const scoreText = useScoreText();
  const firstTab = LIST_STATUSES.find((s) => stats.byStatus[s] > 0) ?? "watching";
  const [tab, setTab] = useState<ListStatus>(firstTab);
  const [copied, setCopied] = useState(false);
  const total = entries.length;
  const hours = Math.round(stats.minutes / 60);

  const items = useMemo(
    () =>
      entries
        .filter((e) => e.status === tab)
        .map((e) => ({ entry: e, media: media.get(e.media_id) }))
        .filter((x): x is { entry: typeof x.entry; media: MyMedia } => Boolean(x.media)),
    [entries, media, tab],
  );
  const scoreOf = new Map(items.map((x) => [x.media.id, x.entry.score]));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер обміну недоступний — посилання й так у адресному рядку.
    }
  }

  return (
    <div>
      <Head profile={profile} />

      {own && (
        <div className={styles.ownBar}>
          {profile.is_public ? (
            <>
              <span>{m.profile.own.public}</span>
              <button type="button" className={styles.ownButton} onClick={copyLink}>
                {copied ? m.profile.own.copied : m.profile.own.copy}
              </button>
            </>
          ) : (
            <span>{m.profile.own.private}</span>
          )}
          <Link href="/account" className={styles.ownButton}>
            {m.profile.own.settings}
          </Link>
        </div>
      )}

      <section className={styles.tiles} aria-label={m.profile.tiles.label}>
        <Tile value={total.toLocaleString(intl)} label={m.profile.tiles.anime} />
        <Tile value={stats.episodes.toLocaleString(intl)} label={m.profile.tiles.episodes} />
        <Tile
          value={hours.toLocaleString(intl)}
          label={
            hours >= 24
              ? fmt(m.profile.tiles.hoursDays, { days: Math.round(hours / 24).toLocaleString(intl) })
              : m.profile.tiles.hours
          }
        />
        <Tile
          value={stats.averageScore !== null ? scoreText(stats.averageScore) : "—"}
          label={m.profile.tiles.average}
        />
      </section>

      <div className={styles.charts}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{m.profile.scores.title}</h2>
          {stats.scores.some((n) => n > 0) ? (
            <Columns
              bars={stats.scores.map((n, i) => ({
                label: String(i + 1),
                value: n,
                tip: fmt(m.profile.scores.tip, { score: i + 1, count: count(m.common.anime, n) }),
              }))}
              caption={m.profile.scores.caption}
            />
          ) : (
            <p className={styles.empty}>{m.profile.scores.empty}</p>
          )}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{m.profile.months.title}</h2>
          {stats.months.some((m) => m.episodes > 0) ? (
            <>
              <Columns
                bars={stats.months.map((month) => ({
                  label: shortMonth(month.date, intl),
                  value: month.episodes,
                  tip: `${longMonth(month.date, intl)}: ${count(m.common.episodes, month.episodes)}`,
                }))}
                caption={m.profile.months.caption}
                dense
              />
              <p className={styles.footnote}>{m.profile.months.footnote}</p>
            </>
          ) : (
            <p className={styles.empty}>{m.profile.months.empty}</p>
          )}
        </section>

        <section className={`${styles.panel} ${styles.panelWide}`}>
          <h2 className={styles.panelTitle}>{m.profile.genres.title}</h2>
          {stats.genres.length > 0 ? (
            <Genres genres={stats.genres.slice(0, 8)} />
          ) : (
            <p className={styles.empty}>{m.profile.genres.empty}</p>
          )}
        </section>
      </div>

      <section className={styles.lists}>
        <h2 className={styles.panelTitle}>{m.profile.lists.title}</h2>
        <div className={styles.tabs} role="tablist" aria-label={m.profile.lists.title}>
          {LIST_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={tab === s}
              className={`${styles.tab} ${tab === s ? styles.tabActive : ""}`}
              onClick={() => setTab(s)}
            >
              {m.profile.status[s]} <span className={styles.tabCount}>{stats.byStatus[s]}</span>
            </button>
          ))}
        </div>
        {items.length > 0 ? (
          <MediaGrid
            items={items.map((x) => x.media)}
            badge={(m) => {
              const score = scoreOf.get(m.id);
              return score != null ? `★ ${scoreText(score)}` : undefined;
            }}
            hideable={false}
          />
        ) : (
          <p className={styles.empty}>{m.profile.lists.empty}</p>
        )}
      </section>
    </div>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileLabel}>{label}</span>
    </div>
  );
}

/** Стовпчики однієї серії: підпис під кожним, значення — у підказці при наведенні й для читалок екрана. */
function Columns({
  bars,
  caption,
  dense = false,
}: {
  bars: { label: string; value: number; tip: string }[];
  caption: string;
  /** Багато стовпчиків: на телефоні підписуємо кожен другий. */
  dense?: boolean;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const top = bars.findIndex((b) => b.value === max);
  return (
    <figure className={`${styles.columns} ${dense ? styles.dense : ""}`}>
      <ul className={styles.columnsPlot} aria-label={caption}>
        {bars.map((b, i) => (
          <li key={i} className={styles.column} aria-label={b.tip} data-tip={b.tip} tabIndex={0}>
            <span className={styles.columnValue} aria-hidden="true">
              {i === top && b.value > 0 ? b.value : ""}
            </span>
            <span className={styles.columnBar} style={{ height: `${(b.value / max) * 85}%` }} aria-hidden="true" />
            <span className={styles.columnLabel} aria-hidden="true">
              {b.label}
            </span>
          </li>
        ))}
      </ul>
      <figcaption className={styles.srOnly}>{caption}</figcaption>
    </figure>
  );
}

function Genres({ genres }: { genres: { genre: string; count: number; average: number | null }[] }) {
  const { m, count } = useI18n();
  const scoreText = useScoreText();
  const max = Math.max(1, ...genres.map((g) => g.count));
  return (
    <ul className={styles.genres}>
      {genres.map((g) => (
        <li key={g.genre} className={styles.genre}>
          <span className={styles.genreName}>{label(m.labels.genre, g.genre)}</span>
          <span className={styles.genreTrack} aria-hidden="true">
            <span className={styles.genreBar} style={{ width: `${(g.count / max) * 100}%` }} />
          </span>
          <span className={styles.genreValue}>
            {count(m.common.anime, g.count)}
            {g.average !== null && <span className={styles.genreScore}> · ★ {scoreText(g.average)}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const shortMonth = (d: Date, intl: string) => new Intl.DateTimeFormat(intl, { month: "short" }).format(d).replace(".", "");
const longMonth = (d: Date, intl: string) => new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(d);
