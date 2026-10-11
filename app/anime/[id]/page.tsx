import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaRow } from "@/components/MediaRow";
import { getMedia, getWatchOrder, type MediaDetails } from "@/lib/anilist";
import { catalogHref } from "@/lib/catalog";
import {
  COUNTRY_LABELS,
  FORMAT_LABELS,
  GENRE_LABELS,
  RELATION_LABELS,
  SEASON_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  formatAiringDate,
  formatFuzzyDate,
  formatScore,
} from "@/lib/labels";
import { descriptionParagraphs } from "@/lib/text";
import styles from "./page.module.css";

function parseId(raw: string): number | null {
  return /^\d{1,9}$/.test(raw) ? Number(raw) : null;
}

function pluralVotes(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "оцінка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "оцінки";
  return "оцінок";
}

function displayTitle(media: MediaDetails): string {
  return media.title.english ?? media.title.romaji ?? "Без назви";
}

export async function generateMetadata({ params }: PageProps<"/anime/[id]">) {
  const id = parseId((await params).id);
  const media = id ? await getMedia(id).catch(() => null) : null;
  return { title: media ? `${displayTitle(media)} — YourMovie` : "Аніме — YourMovie" };
}

export default function AnimePage({ params }: PageProps<"/anime/[id]">) {
  return (
    <Suspense fallback={<p className={styles.status}>Завантажуємо…</p>}>
      <Anime params={params} />
    </Suspense>
  );
}

async function Anime({ params }: Pick<PageProps<"/anime/[id]">, "params">) {
  const id = parseId((await params).id);
  if (!id) notFound();

  let media;
  try {
    media = await getMedia(id);
  } catch (error) {
    console.error(error);
    return (
      <p className={styles.status}>
        Не вдалося завантажити дані з AniList. Спробуйте оновити сторінку трохи згодом.
      </p>
    );
  }
  if (!media) notFound();

  const title = displayTitle(media);
  const altTitles = [media.title.romaji, media.title.native].filter((t) => t && t !== title);
  const score = formatScore(media.averageScore);
  const votes = media.stats?.scoreDistribution.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const paragraphs = descriptionParagraphs(media.description);
  const tags = media.tags
    .filter((tag) => !tag.isMediaSpoiler && !tag.isGeneralSpoiler && tag.rank >= 50)
    .slice(0, 12);

  const related = media.relations.edges
    .filter((edge) => edge.node.type === "ANIME" && RELATION_LABELS[edge.relationType])
    .map((edge) => ({ ...edge.node, relation: RELATION_LABELS[edge.relationType]! }));
  const recommendations = media.recommendations.nodes
    .map((node) => node.mediaRecommendation)
    .filter((m): m is NonNullable<typeof m> => m != null && !m.isAdult);

  return (
    <>
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
            <img src={media.coverImage.extraLarge ?? media.coverImage.large!} alt={`Постер: ${title}`} />
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
                  Середня оцінка користувачів AniList
                  {votes > 0 && <> · {votes.toLocaleString("uk-UA")} {pluralVotes(votes)}</>}
                </span>
              </>
            ) : (
              <span className={styles.ratingNote}>Оцінки ще немає</span>
            )}
          </div>
          <div className={styles.badges}>
            {media.format && <span>{FORMAT_LABELS[media.format]}</span>}
            {media.seasonYear && <span>{media.seasonYear}</span>}
            {media.status && <span>{STATUS_LABELS[media.status]}</span>}
          </div>
          {media.nextAiringEpisode && (
            <p className={styles.airing}>
              Серія {media.nextAiringEpisode.episode} вийде {formatAiringDate(media.nextAiringEpisode.airingAt)}
            </p>
          )}
          {media.genres.length > 0 && (
            <ul className={styles.genres}>
              {media.genres.map((genre) => (
                <li key={genre}>{GENRE_LABELS[genre] ?? genre}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.body}>
          <h2 className={styles.subheading}>Опис</h2>
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => <p key={i} className={styles.paragraph}>{p}</p>)
          ) : (
            <p className={styles.muted}>Опису поки немає.</p>
          )}
          {paragraphs.length > 0 && <p className={styles.note}>Опис англійською — так його надає AniList.</p>}

          {tags.length > 0 && (
            <>
              <h2 className={styles.subheading}>Теги</h2>
              <ul className={styles.tags}>
                {tags.map((tag) => (
                  <li key={tag.name}>{tag.name}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <InfoList media={media} />
      </div>

      <Suspense fallback={null}>
        <WatchOrder id={media.id} />
      </Suspense>

      {related.length > 0 && (
        <MediaRow title="Пов'язане" items={related} label={(m) => m.relation} />
      )}
      {recommendations.length > 0 && <MediaRow title="Схожі аніме" items={recommendations} />}
    </>
  );
}

function InfoList({ media }: { media: MediaDetails }) {
  const start = formatFuzzyDate(media.startDate);
  const end = formatFuzzyDate(media.endDate);
  const dates = start && end && start !== end ? `${start} — ${end}` : start;

  const rows: [string, React.ReactNode][] = [];
  if (media.format) rows.push(["Формат", FORMAT_LABELS[media.format]]);
  if (media.episodes) rows.push(["Серій", media.episodes]);
  if (media.duration) rows.push(["Тривалість серії", `${media.duration} хв`]);
  if (media.status) rows.push(["Статус", STATUS_LABELS[media.status]]);
  if (media.season && media.seasonYear)
    rows.push([
      "Сезон",
      <Link key="season" href={catalogHref({ season: media.season, year: media.seasonYear })}>
        {SEASON_LABELS[media.season]} {media.seasonYear}
      </Link>,
    ]);
  if (dates) rows.push(["Дати виходу", dates]);
  if (media.studios.nodes.length > 0)
    rows.push(["Студія", media.studios.nodes.map((s) => s.name).join(", ")]);
  if (media.source) rows.push(["Першоджерело", SOURCE_LABELS[media.source] ?? media.source]);
  if (media.countryOfOrigin)
    rows.push(["Країна", COUNTRY_LABELS[media.countryOfOrigin] ?? media.countryOfOrigin]);
  if (media.popularity) rows.push(["Додали до списків", media.popularity.toLocaleString("uk-UA")]);

  return (
    <aside className={styles.info}>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.infoRow}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <a className={styles.source} href={media.siteUrl} target="_blank" rel="noopener noreferrer">
        Сторінка на AniList ↗
      </a>
    </aside>
  );
}

async function WatchOrder({ id }: { id: number }) {
  const items = await getWatchOrder(id).catch((error) => {
    console.error(error);
    return [];
  });
  if (items.length === 0) return null;
  return (
    <MediaRow title="Порядок перегляду" items={items} currentId={id} badge={(m) => (m.startDate.year ? String(m.startDate.year) : "Анонс")} />
  );
}
