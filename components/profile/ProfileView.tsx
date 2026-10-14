"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { MediaGrid } from "@/components/MediaGrid";
import type { MyMedia } from "@/lib/anilist";
import { GENRE_LABELS } from "@/lib/labels";
import { LIST_STATUSES, LIST_STATUS_LABELS, formatUserScore, type ListStatus } from "@/lib/lists";
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

/** Профіль користувача: статистика й списки. Свій — завжди, чужий — якщо відкритий. */
export function ProfileView({ nickname }: { nickname: string }) {
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
        <h1 className={styles.title}>Користувача не знайдено</h1>
        <p>Немає користувача з нікнеймом «{nickname}». Можливо, він змінив нікнейм.</p>
      </div>
    );
  if (data.kind === "error")
    return (
      <div className={styles.message}>
        <h1 className={styles.title}>Не вдалося завантажити профіль</h1>
        <p>Спробуйте оновити сторінку трохи згодом.</p>
      </div>
    );
  if (data.kind === "closed")
    return (
      <div className={styles.message}>
        <Head profile={data.profile} />
        <p>🔒 Профіль закритий — {data.profile.nickname} не показує свої списки іншим.</p>
      </div>
    );

  const own = user?.id === data.profile.id;
  return <Ready profile={data.profile} entries={data.entries} stats={data.stats} media={data.media} own={own} />;
}

function Head({ profile }: { profile: PublicProfile }) {
  const since = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" }).format(new Date(profile.created_at));
  return (
    <div className={styles.head}>
      <span className={styles.avatar} aria-hidden="true">
        {profile.nickname[0]?.toUpperCase()}
      </span>
      <div>
        <h1 className={styles.title} dir="auto">
          {profile.nickname}
        </h1>
        <p className={styles.since}>з нами з {since}</p>
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
              <span>🌐 Відкритий профіль — цю сторінку бачать усі, хто має посилання.</span>
              <button type="button" className={styles.ownButton} onClick={copyLink}>
                {copied ? "Скопійовано ✓" : "Копіювати посилання"}
              </button>
            </>
          ) : (
            <span>🔒 Закритий профіль — статистику й списки бачите лише ви.</span>
          )}
          <Link href="/account" className={styles.ownButton}>
            Налаштування
          </Link>
        </div>
      )}

      <section className={styles.tiles} aria-label="Підсумки">
        <Tile value={String(total)} label="аніме в списках" />
        <Tile value={stats.episodes.toLocaleString("uk-UA")} label="серій переглянуто" />
        <Tile
          value={hours.toLocaleString("uk-UA")}
          label={hours >= 24 ? `годин ≈ ${Math.round(hours / 24)} дн.` : "годин перегляду"}
        />
        <Tile value={stats.averageScore !== null ? formatUserScore(stats.averageScore) : "—"} label="середня оцінка" />
      </section>

      <div className={styles.charts}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Оцінки</h2>
          {stats.scores.some((n) => n > 0) ? (
            <Columns
              bars={stats.scores.map((count, i) => ({
                label: String(i + 1),
                value: count,
                tip: `Оцінка ${i + 1}: ${count} аніме`,
              }))}
              caption="Скільки аніме отримали кожну оцінку від 1 до 10"
            />
          ) : (
            <p className={styles.empty}>Ще немає оцінених аніме.</p>
          )}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Серії по місяцях</h2>
          {stats.months.some((m) => m.episodes > 0) ? (
            <>
              <Columns
                bars={stats.months.map((m) => ({
                  label: shortMonth(m.date),
                  value: m.episodes,
                  tip: `${longMonth(m.date)}: ${m.episodes} ${pluralEpisodes(m.episodes)}`,
                }))}
                caption="Скільки серій відмічено переглянутими щомісяця за останній рік"
              />
              <p className={styles.footnote}>За датою відмітки: «Переглянуто весь сезон» записує всі серії одним днем.</p>
            </>
          ) : (
            <p className={styles.empty}>За останній рік серій не відмічено.</p>
          )}
        </section>

        <section className={`${styles.panel} ${styles.panelWide}`}>
          <h2 className={styles.panelTitle}>Улюблені жанри</h2>
          {stats.genres.length > 0 ? (
            <Genres genres={stats.genres.slice(0, 8)} />
          ) : (
            <p className={styles.empty}>Жанри з’являться, коли в списках будуть аніме, які дивляться чи вже подивилися.</p>
          )}
        </section>
      </div>

      <section className={styles.lists}>
        <h2 className={styles.panelTitle}>Списки</h2>
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
              {LIST_STATUS_LABELS[s]} <span className={styles.tabCount}>{stats.byStatus[s]}</span>
            </button>
          ))}
        </div>
        {items.length > 0 ? (
          <MediaGrid
            items={items.map((x) => x.media)}
            badge={(m) => {
              const score = scoreOf.get(m.id);
              return score != null ? `★ ${formatUserScore(score)}` : undefined;
            }}
            hideable={false}
          />
        ) : (
          <p className={styles.empty}>У цьому списку поки порожньо.</p>
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
function Columns({ bars, caption }: { bars: { label: string; value: number; tip: string }[]; caption: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const top = bars.findIndex((b) => b.value === max);
  return (
    <figure className={styles.columns}>
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
  const max = Math.max(1, ...genres.map((g) => g.count));
  return (
    <ul className={styles.genres}>
      {genres.map((g) => (
        <li key={g.genre} className={styles.genre}>
          <span className={styles.genreName}>{GENRE_LABELS[g.genre] ?? g.genre}</span>
          <span className={styles.genreTrack} aria-hidden="true">
            <span className={styles.genreBar} style={{ width: `${(g.count / max) * 100}%` }} />
          </span>
          <span className={styles.genreValue}>
            {g.count} аніме
            {g.average !== null && <span className={styles.genreScore}> · ★ {formatUserScore(g.average)}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const ten = n % 10;
  const hundred = n % 100;
  if (ten === 1 && hundred !== 11) return one;
  if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return few;
  return many;
}

const pluralEpisodes = (n: number) => plural(n, "серія", "серії", "серій");
const shortMonth = (d: Date) => new Intl.DateTimeFormat("uk-UA", { month: "short" }).format(d).replace(".", "");
const longMonth = (d: Date) => new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" }).format(d);
