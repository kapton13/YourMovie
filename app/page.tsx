import { Suspense } from "react";
import { MediaRow } from "@/components/MediaRow";
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
      </section>
      <Suspense fallback={<p className={styles.status}>Завантажуємо добірки…</p>}>
        <HomeSections />
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
        href={catalogHref({ sort: "TRENDING_DESC" })}
        items={data.trending}
      />
      <MediaRow
        title={`Поточний сезон: ${seasonTitle}`}
        href={catalogHref(data.season)}
        items={data.seasonal}
      />
      <MediaRow
        title="Популярне за весь час"
        href={catalogHref({ sort: "POPULARITY_DESC" })}
        items={data.popular}
      />
      <MediaRow title="Топ рейтингу" href={catalogHref({ sort: "SCORE_DESC" })} items={data.top} />
    </>
  );
}
