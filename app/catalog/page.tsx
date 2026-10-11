import type { Metadata } from "next";
import { Suspense } from "react";
import { MediaGrid } from "@/components/MediaGrid";
import { CatalogControls } from "@/components/catalog/CatalogControls";
import { CatalogTransitionProvider, PendingResults } from "@/components/catalog/CatalogTransition";
import { PageLink } from "@/components/catalog/PageLink";
import { AniListError, getCatalogPage, getFilterOptions } from "@/lib/anilist";
import {
  PAGE_SIZE,
  catalogHref,
  countFilters,
  parseCatalogParams,
  type CatalogQuery,
} from "@/lib/catalog";
import { hasCyrillic, transliterate } from "@/lib/search";
import { suggestCorrection } from "@/lib/titleIndex";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Каталог і пошук аніме — YourMovie",
};

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const options = await getFilterOptions().catch((error) => {
    console.error(error);
    return { tagGroups: [], maxYear: 2027 };
  });

  return (
    <CatalogTransitionProvider>
      <Suspense fallback={<ControlsFallback />}>
        <CatalogControls tagGroups={options.tagGroups} maxYear={options.maxYear} />
      </Suspense>
      <PendingResults>
        <Suspense fallback={<ResultsSkeleton />}>
          <CatalogResults searchParams={searchParams} />
        </Suspense>
      </PendingResults>
    </CatalogTransitionProvider>
  );
}

function ControlsFallback() {
  return (
    <div className={styles.controlsFallback} aria-hidden="true">
      <div className={styles.titleFallback} />
      <div className={styles.searchFallback} />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Завантажуємо…">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

function pluralAnime(n: number): string {
  return `${n.toLocaleString("uk-UA")} аніме`;
}

async function CatalogResults({ searchParams }: Pick<PageProps<"/catalog">, "searchParams">) {
  const query = parseCatalogParams(await searchParams);

  let result;
  try {
    result = await getCatalogPage(query);
  } catch (error) {
    console.error(error);
    const rateLimited = error instanceof AniListError && error.status === 429;
    return (
      <div className={styles.message}>
        <p className={styles.messageTitle}>Не вдалося завантажити результати.</p>
        <p>
          {rateLimited
            ? "AniList тимчасово обмежив кількість запитів. Зачекайте хвилинку й оновіть сторінку."
            : "Схоже, AniList зараз недоступний. Спробуйте оновити сторінку трохи згодом."}
        </p>
      </div>
    );
  }

  const { media, currentPage, hasNextPage } = result;
  if (media.length === 0) return <EmptyResults query={query} />;

  // AniList не повідомляє точної кількості результатів, якщо їх більше однієї сторінки.
  const first = (currentPage - 1) * PAGE_SIZE + 1;
  const exactTotal = hasNextPage ? undefined : first - 1 + media.length;

  return (
    <>
      <p className={styles.summary}>
        {exactTotal !== undefined
          ? `Знайдено ${pluralAnime(exactTotal)}`
          : `Показано ${first}–${first + media.length - 1}`}
      </p>
      <MediaGrid items={media} />
      {(currentPage > 1 || hasNextPage) && (
        <nav className={styles.pagination} aria-label="Сторінки результатів">
          {currentPage > 1 ? (
            <PageLink href={catalogHref({ ...query, page: currentPage - 1 })}>← Попередня</PageLink>
          ) : (
            <span />
          )}
          <span className={styles.pageNumber}>Сторінка {currentPage}</span>
          {hasNextPage ? (
            <PageLink href={catalogHref({ ...query, page: currentPage + 1 })}>Наступна →</PageLink>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function EmptyResults({ query }: { query: CatalogQuery }) {
  const filters = countFilters(query);
  const correction = query.q ? suggestCorrection(query.q) : null;
  const latin = !correction && query.q && hasCyrillic(query.q) ? transliterate(query.q) : "";

  if (query.page > 1) {
    return (
      <div className={styles.message}>
        <p className={styles.messageTitle}>На цій сторінці результатів уже немає.</p>
        <PageLink href={catalogHref({ ...query, page: 1 })}>Перейти на першу сторінку</PageLink>
      </div>
    );
  }

  return (
    <div className={styles.message}>
      <p className={styles.messageTitle}>Нічого не знайдено.</p>
      {correction && (
        <p>
          Можливо, ви мали на увазі{" "}
          <PageLink href={catalogHref({ ...query, q: correction, page: 1 })}>«{correction}»</PageLink>?
        </p>
      )}
      {latin && (
        <p>
          Кирилицею AniList знає назви лише частини аніме. Спробуйте англійську або японську назву
          латиницею, наприклад:{" "}
          <PageLink href={catalogHref({ ...query, q: latin, page: 1 })}>«{latin}»</PageLink>
        </p>
      )}
      {query.q && !latin && !correction && (
        <p>Перевірте, чи правильно написана назва, або введіть лише одне слово з неї.</p>
      )}
      {filters > 0 && (
        <p>
          Можливо, фільтрів забагато.{" "}
          <PageLink href={catalogHref({ q: query.q })}>
            {query.q ? "Шукати без фільтрів" : "Скинути фільтри"}
          </PageLink>
        </p>
      )}
    </div>
  );
}
