import { Suspense } from "react";
import { HomeSearch } from "@/components/HomeSearch";
import { MediaRow } from "@/components/MediaRow";
import { SkipListed } from "@/components/hidden/SkipListed";
import { ForYouRow } from "@/components/recs/ForYouRow";
import { getHomeSections } from "@/lib/anilist";
import { catalogHref } from "@/lib/catalog";
import { fmt } from "@/lib/i18n/format";
import { label } from "@/lib/i18n/labels";
import { getI18n } from "@/lib/i18n/server";
import styles from "./page.module.css";

export default async function Home() {
  const { m } = await getI18n();
  return (
    <>
      <section className={styles.intro}>
        <h1>{m.home.intro.title}</h1>
        <p>{m.home.intro.text}</p>
        <HomeSearch />
      </section>
      <Suspense fallback={<p className={styles.status}>{m.home.loading}</p>}>
        {/* Те, що людина вже дивиться чи подивилася, на головній не показуємо. */}
        <SkipListed>
          <HomeSections />
        </SkipListed>
      </Suspense>
    </>
  );
}

async function HomeSections() {
  const { m } = await getI18n();
  let data;
  try {
    data = await getHomeSections();
  } catch (error) {
    console.error(error);
    return (
      <p className={styles.status}>{m.common.anilistError}</p>
    );
  }

  const seasonTitle = fmt(m.home.seasonName, { season: label(m.labels.season, data.season.season), year: data.season.year });
  return (
    <>
      <ForYouRow />
      <MediaRow
        title={m.home.trending}
        href={catalogHref({ sort: "trending" })}
        items={data.trending}
        limit={12}
      />
      <MediaRow
        title={fmt(m.home.currentSeason, { season: seasonTitle })}
        href={catalogHref({
          season: data.season.season,
          yearFrom: data.season.year,
          yearTo: data.season.year,
        })}
        items={data.seasonal}
        limit={12}
      />
      <MediaRow
        title={m.home.popular}
        href={catalogHref({ sort: "popular" })}
        items={data.popular}
        limit={12}
      />
      <MediaRow title={m.home.top} href={catalogHref({ sort: "score" })} items={data.top} limit={12} />
    </>
  );
}
