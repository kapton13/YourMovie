import { Suspense } from "react";
import { HomeSearch } from "@/components/HomeSearch";
import { MediaRow } from "@/components/MediaRow";
import { SkipListed } from "@/components/hidden/SkipListed";
import { getHomeSections } from "@/lib/anilist";
import { catalogHref } from "@/lib/catalog";
import { SEASON_LABELS } from "@/lib/labels";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <section className={styles.intro}>
        <h1>Відкривай аніме</h1>
        <p>Що зараз дивляться, що виходить цього сезону і що варто побачити кожному.</p>
        <HomeSearch />
      </section>
      <Suspense fallback={<p className={styles.status}>Завантажуємо добірки…</p>}>
        {/* Те, що людина вже дивиться чи подивилася, на головній не показуємо. */}
        <SkipListed>
          <HomeSections />
        </SkipListed>
      </Suspense>
    </>
  );
}

async function HomeSections() {
  let data;
  try {
    data = await getHomeSections();
  } catch (error) {
    console.error(error);
    return (
      <p className={styles.status}>
        Не вдалося завантажити дані з AniList. Спробуйте оновити сторінку трохи згодом.
      </p>
    );
  }

  const seasonTitle = `${SEASON_LABELS[data.season.season]} ${data.season.year}`;
  return (
    <>
      <MediaRow
        title="Зараз у тренді"
        href={catalogHref({ sort: "trending" })}
        items={data.trending}
        limit={12}
      />
      <MediaRow
        title={`Поточний сезон: ${seasonTitle}`}
        href={catalogHref({
          season: data.season.season,
          yearFrom: data.season.year,
          yearTo: data.season.year,
        })}
        items={data.seasonal}
        limit={12}
      />
      <MediaRow
        title="Популярне за весь час"
        href={catalogHref({ sort: "popular" })}
        items={data.popular}
        limit={12}
      />
      <MediaRow title="Топ рейтингу" href={catalogHref({ sort: "score" })} items={data.top} limit={12} />
    </>
  );
}
