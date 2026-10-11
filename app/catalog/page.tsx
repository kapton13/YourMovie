import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MediaGrid } from "@/components/MediaGrid";
import { getCatalogPage } from "@/lib/anilist";
import { catalogHref, catalogTitle, parseCatalogParams } from "@/lib/catalog";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Каталог аніме — YourMovie",
};

export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <Suspense fallback={<p className={styles.status}>Завантажуємо…</p>}>
      <Catalog searchParams={searchParams} />
    </Suspense>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/catalog">, "searchParams">) {
  const query = parseCatalogParams(await searchParams);
  const title = catalogTitle(query);

  let result;
  try {
    result = await getCatalogPage(query);
  } catch (error) {
    console.error(error);
    return (
      <>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.status}>
          Не вдалося завантажити дані з AniList. Спробуйте оновити сторінку трохи згодом.
        </p>
      </>
    );
  }

  const { media, currentPage, hasNextPage } = result;
  return (
    <>
      <Link href="/" className={styles.back}>
        ← На головну
      </Link>
      <h1 className={styles.title}>{title}</h1>
      {currentPage > 1 && <p className={styles.pageNote}>Сторінка {currentPage}</p>}

      {media.length > 0 ? (
        <MediaGrid items={media} />
      ) : (
        <p className={styles.status}>Нічого не знайдено.</p>
      )}

      {(currentPage > 1 || hasNextPage) && (
        <nav className={styles.pagination} aria-label="Сторінки">
          {currentPage > 1 ? (
            <Link href={catalogHref({ ...query, page: currentPage - 1 })}>← Попередня</Link>
          ) : (
            <span />
          )}
          <span className={styles.pageNumber}>{currentPage}</span>
          {hasNextPage ? (
            <Link href={catalogHref({ ...query, page: currentPage + 1 })}>Наступна →</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
