import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaRow } from "@/components/MediaRow";
import { SkipListed } from "@/components/hidden/SkipListed";
import { Link } from "@/components/i18n/I18nProvider";
import { EpisodeList } from "@/components/list/EpisodeList";
import { MyListBlock } from "@/components/list/MyListBlock";
import { UserMediaProvider, type FranchiseContext } from "@/components/list/UserMediaProvider";
import {
  airedEpisodeCount,
  getEpisodes,
  getFranchise,
  getMedia,
  getRoots,
  getWatchOrder,
  type Franchise,
  type MediaDetails,
} from "@/lib/anilist";
import { catalogHref } from "@/lib/catalog";
import { count, fmt } from "@/lib/i18n/format";
import { formatAiringDate, formatFuzzyDate, label, partLabel } from "@/lib/i18n/labels";
import { getI18n } from "@/lib/i18n/server";
import { formatScore } from "@/lib/labels";
import type { Messages } from "@/messages";
import { descriptionParagraphs } from "@/lib/text";
import styles from "./page.module.css";

function parseId(raw: string): number | null {
  return /^\d{1,9}$/.test(raw) ? Number(raw) : null;
}

function displayTitle(media: MediaDetails, m: Messages): string {
  return media.title.english ?? media.title.romaji ?? m.common.untitled;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/anime/[id]">): Promise<Metadata> {
  const { m } = await getI18n();
  const id = parseId((await params).id);
  const media = id ? await getMedia(id).catch(() => null) : null;
  return { title: media ? fmt(m.anime.metaTitle, { title: displayTitle(media, m) }) : m.anime.metaFallback };
}

export default async function AnimePage({ params }: PageProps<"/[lang]/anime/[id]">) {
  const { m } = await getI18n();
  return (
    <Suspense fallback={<p className={styles.status}>{m.anime.loading}</p>}>
      <Anime params={params} />
    </Suspense>
  );
}

async function Anime({ params }: Pick<PageProps<"/[lang]/anime/[id]">, "params">) {
  const { lang, m, intl } = await getI18n();
  const id = parseId((await params).id);
  if (!id) notFound();

  let media;
  try {
    media = await getMedia(id);
  } catch (error) {
    console.error(error);
    return (
      <p className={styles.status}>{m.common.anilistError}</p>
    );
  }
  if (!media) notFound();

  const franchise = await getFranchise(media.id).catch((error) => {
    console.error(error);
    return null;
  });
  const partInFranchise = franchise ? [...franchise.main, ...franchise.extras].find((p) => p.id === media.id) : undefined;
  const mainIndex = franchise ? franchise.main.findIndex((p) => p.id === media.id) : -1;

  const title = displayTitle(media, m);
  const altTitles = [media.title.romaji, media.title.native].filter((t) => t && t !== title);
  const score = formatScore(media.averageScore);
  const votes = media.stats?.scoreDistribution.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const paragraphs = descriptionParagraphs(media.description);
  const tags = media.tags
    .filter((tag) => !tag.isMediaSpoiler && !tag.isGeneralSpoiler && tag.rank >= 50)
    .slice(0, 12);

  const related = media.relations.edges
    .filter((edge) => edge.node.type === "ANIME" && m.labels.relation[edge.relationType])
    .map((edge) => ({ ...edge.node, relation: m.labels.relation[edge.relationType] }));
  const similar = media.recommendations.nodes
    .map((node) => node.mediaRecommendation)
    .filter((rec): rec is NonNullable<typeof rec> => rec != null && !rec.isAdult);
  // Перша частина кожного схожого аніме — щоб сховати й сезон 2 того, що вже є в списках.
  const roots = await getRoots(similar.map((rec) => rec.id).sort((a, b) => a - b)).catch((error) => {
    console.error(error);
    return {} as Record<number, number>;
  });
  const recommendations = similar.map((rec) => ({ ...rec, rootId: roots[rec.id] ?? rec.id }));
  const part = partInFranchise ? partLabel(partInFranchise, m) : undefined;
  const [partOfBefore, partOfAfter] = m.anime.franchise.partOf.split("{title}");

  return (
    <UserMediaProvider franchise={franchiseContext(media, franchise)} airedCount={airedEpisodeCount(media)}>
      {media.bannerImage && (
        <div
          className={styles.banner}
          style={{ backgroundImage: `url(${JSON.stringify(media.bannerImage)})` }}
          aria-hidden="true"
        />
      )}

      <div className={`${styles.hero} ${media.bannerImage ? styles.withBanner : ""}`}>
        <div className={styles.poster} style={{ backgroundColor: media.coverImage.color ?? undefined }}>
          {(media.coverImage.extraLarge ?? media.coverImage.large) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.coverImage.extraLarge ?? media.coverImage.large!} alt={fmt(m.anime.poster, { title })} />
          )}
        </div>

        <div className={styles.head}>
          <h1 className={styles.title}>{title}</h1>
          {altTitles.length > 0 && <p className={styles.altTitles}>{altTitles.join(" · ")}</p>}
          <div className={styles.rating}>
            {score ? (
              <>
                <span className={styles.ratingValue}>
                  ★ {score}
                  <span className={styles.ratingScale}> / 10</span>
                </span>
                <span className={styles.ratingNote}>
                  {m.anime.rating.note}
                  {votes > 0 && <> · {count(m.anime.rating.votes, votes, intl)}</>}
                </span>
              </>
            ) : (
              <span className={styles.ratingNote}>{m.anime.rating.none}</span>
            )}
          </div>
          <div className={styles.badges}>
            {media.format && <span>{label(m.labels.format, media.format)}</span>}
            {media.seasonYear && <span>{media.seasonYear}</span>}
            {media.status && <span>{label(m.labels.status, media.status)}</span>}
          </div>
          {media.nextAiringEpisode && (
            <p className={styles.airing}>
              {fmt(m.anime.nextEpisode, {
                n: media.nextAiringEpisode.episode,
                date: formatAiringDate(media.nextAiringEpisode.airingAt, intl),
              })}
            </p>
          )}
          {media.genres.length > 0 && (
            <ul className={styles.genres}>
              {media.genres.map((genre) => (
                <li key={genre}>{label(m.labels.genre, genre)}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.body}>
          {franchise && partInFranchise && franchise.main.length + franchise.extras.length > 1 && (
            <p className={styles.franchiseNote}>
              {franchise.key === media.id ? (
                fmt(m.anime.franchise.root, { n: franchise.main.length + franchise.extras.length })
              ) : (
                <>
                  {partOfBefore}
                  <Link href={`/anime/${franchise.key}`} className={styles.franchiseLink}>
                    {fmt(m.anime.franchise.quoted, { title: franchise.title })}
                  </Link>
                  {partOfAfter} · {part}
                  {mainIndex >= 0
                    ? ` ${fmt(m.anime.franchise.position, { n: mainIndex + 1, total: franchise.main.length })}`
                    : ` · ${m.anime.franchise.extra}`}
                </>
              )}
            </p>
          )}
          <MyListBlock seasonLabel={part} mediaId={media.id} title={title} />
          <h2 className={styles.subheading}>{m.anime.description.heading}</h2>
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => <p key={i} className={styles.paragraph}>{p}</p>)
          ) : (
            <p className={styles.muted}>{m.anime.description.empty}</p>
          )}
          {paragraphs.length > 0 && lang !== "en" && <p className={styles.note}>{m.anime.description.englishNote}</p>}

          {tags.length > 0 && (
            <>
              <h2 className={styles.subheading}>{m.anime.tags}</h2>
              <ul className={styles.tags}>
                {tags.map((tag) => (
                  <li key={tag.name}>{tag.name}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <InfoList media={media} m={m} intl={intl} />
      </div>

      <Suspense fallback={null}>
        <Episodes id={media.id} />
      </Suspense>

      <Suspense fallback={null}>
        <WatchOrder id={media.id} m={m} />
      </Suspense>

      {related.length > 0 && (
        <MediaRow title={m.anime.related} items={related} label={(item) => item.relation} />
      )}
      {recommendations.length > 0 && (
        // Те, що людина вже дивиться чи подивилася, у «Схожих» не показуємо.
        <SkipListed>
          <MediaRow title={m.anime.similar} items={recommendations} />
        </SkipListed>
      )}
    </UserMediaProvider>
  );
}

/** Що потрібно «Моєму списку» про аніме цілком; якщо AniList не відповів — аніме з однієї частини. */
function franchiseContext(media: MediaDetails, franchise: Franchise | null): FranchiseContext {
  const part = { id: media.id, episodes: media.episodes, status: media.status };
  // AniList не відповів — не знаємо інших сезонів, тож не робимо висновків про все аніме
  // (без автостатусу «Переглянуто» й без оцінки аніме із сезону).
  if (!franchise) return { key: media.id, part, main: [], allIds: [media.id] };
  const info = (p: { id: number; episodes: number | null; status: string | null }) => ({
    id: p.id,
    episodes: p.episodes,
    status: p.status,
  });
  return {
    key: franchise.key,
    part,
    main: franchise.main.map(info),
    allIds: [...franchise.main, ...franchise.extras].map((p) => p.id),
  };
}

async function Episodes({ id }: { id: number }) {
  const data = await getEpisodes(id).catch((error) => {
    console.error(error);
    return null;
  });
  return data ? <EpisodeList data={data} /> : null;
}

function InfoList({ media, m, intl }: { media: MediaDetails; m: Messages; intl: string }) {
  const t = m.anime.info;
  const start = formatFuzzyDate(media.startDate, intl);
  const end = formatFuzzyDate(media.endDate, intl);
  const dates = start && end && start !== end ? `${start} — ${end}` : start;

  const rows: [string, React.ReactNode][] = [];
  if (media.format) rows.push([t.format, label(m.labels.format, media.format)]);
  if (media.episodes) rows.push([t.episodes, media.episodes]);
  if (media.duration) rows.push([t.duration, fmt(t.minutes, { n: media.duration })]);
  if (media.status) rows.push([t.status, label(m.labels.status, media.status)]);
  if (media.season && media.seasonYear)
    rows.push([
      t.season,
      <Link key="season" href={catalogHref({
          season: media.season,
          yearFrom: media.seasonYear,
          yearTo: media.seasonYear,
        })}>
        {label(m.labels.season, media.season)} {media.seasonYear}
      </Link>,
    ]);
  if (dates) rows.push([t.dates, dates]);
  if (media.studios.nodes.length > 0)
    rows.push([t.studio, media.studios.nodes.map((s) => s.name).join(", ")]);
  if (media.source) rows.push([t.source, label(m.labels.source, media.source)]);
  if (media.countryOfOrigin)
    rows.push([t.country, label(m.labels.country, media.countryOfOrigin)]);
  if (media.popularity) rows.push([t.popularity, media.popularity.toLocaleString(intl)]);

  return (
    <aside className={styles.info}>
      <dl>
        {rows.map(([name, value]) => (
          <div key={name} className={styles.infoRow}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <a className={styles.source} href={media.siteUrl} target="_blank" rel="noopener noreferrer">
        {t.anilistPage}
      </a>
    </aside>
  );
}

async function WatchOrder({ id, m }: { id: number; m: Messages }) {
  const items = await getWatchOrder(id).catch((error) => {
    console.error(error);
    return [];
  });
  if (items.length === 0) return null;
  return (
    <MediaRow
      title={m.anime.watchOrder}
      items={items}
      currentId={id}
      badge={(item) => (item.startDate.year ? String(item.startDate.year) : m.anime.announced)}
    />
  );
}
