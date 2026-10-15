import type { Metadata } from "next";
import { Suspense } from "react";
import { MediaGrid } from "@/components/MediaGrid";
import { CatalogControls } from "@/components/catalog/CatalogControls";
import { CatalogTransitionProvider, PendingResults } from "@/components/catalog/CatalogTransition";
import { PageLink } from "@/components/catalog/PageLink";
import { VisibleCount } from "@/components/hidden/VisibleCount";
import { AniListError, getCatalogPage, getFilterOptions } from "@/lib/anilist";
import {
  PAGE_SIZE,
  catalogHref,
  countFilters,
  parseCatalogParams,
  type CatalogQuery,
} from "@/lib/catalog";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";
import { hasCyrillic, transliterate } from "@/lib/search";
import { suggestCorrection } from "@/lib/titleIndex";
import type { Messages } from "@/messages";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.catalog.metaTitle };
}

export default async function CatalogPage({ searchParams }: PageProps<"/[lang]/catalog">) {
  const { m } = await getI18n();
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
        <Suspense fallback={<ResultsSkeleton label={m.common.loading} />}>
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

function ResultsSkeleton({ label }: { label: string }) {
  return (
    <div className={styles.skeleton} aria-label={label}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

async function CatalogResults({ searchParams }: Pick<PageProps<"/[lang]/catalog">, "searchParams">) {
  const query = parseCatalogParams(await searchParams);
  const { m } = await getI18n();

  let result;
  try {
    result = await getCatalogPage(query);
  } catch (error) {
    console.error(error);
    const rateLimited = error instanceof AniListError && error.status === 429;
    return (
      <div className={styles.message}>
        <p className={styles.messageTitle}>{m.catalog.results.errorTitle}</p>
        <p>{rateLimited ? m.catalog.results.rateLimited : m.catalog.results.unavailable}</p>
      </div>
    );
  }

  const { media, currentPage, hasNextPage } = result;
  if (media.length === 0) return <EmptyResults query={query} m={m} />;

  // AniList не повідомляє точної кількості результатів, якщо їх більше однієї сторінки.
  const first = (currentPage - 1) * PAGE_SIZE + 1;
  const exactTotal = hasNextPage ? undefined : first - 1 + media.length;

  return (
    <>
      {exactTotal !== undefined ? (
        <VisibleCount ids={media.map((m) => m.id)} className={styles.summary} />
      ) : (
        <p className={styles.summary}>{fmt(m.catalog.results.shown, { from: first, to: first + media.length - 1 })}</p>
      )}
      <MediaGrid items={media} />
      {(currentPage > 1 || hasNextPage) && (
        <nav className={styles.pagination} aria-label={m.catalog.results.pages}>
          {currentPage > 1 ? (
            <PageLink href={catalogHref({ ...query, page: currentPage - 1 })}>{m.catalog.results.prev}</PageLink>
          ) : (
            <span />
          )}
          <span className={styles.pageNumber}>{fmt(m.catalog.results.page, { n: currentPage })}</span>
          {hasNextPage ? (
            <PageLink href={catalogHref({ ...query, page: currentPage + 1 })}>{m.catalog.results.next}</PageLink>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function EmptyResults({ query, m }: { query: CatalogQuery; m: Messages }) {
  const t = m.catalog.empty;
  const filters = countFilters(query);
  const correction = query.q ? suggestCorrection(query.q) : null;
  const latin = !correction && query.q && hasCyrillic(query.q) ? transliterate(query.q) : "";

  if (query.page > 1) {
    return (
      <div className={styles.message}>
        <p className={styles.messageTitle}>{t.pageEmpty}</p>
        <PageLink href={catalogHref({ ...query, page: 1 })}>{t.firstPage}</PageLink>
      </div>
    );
  }

  return (
    <div className={styles.message}>
      <p className={styles.messageTitle}>{t.nothing}</p>
      {correction && (
        <WithSuggestion template={t.didYouMean}>
          <PageLink href={catalogHref({ ...query, q: correction, page: 1 })}>
            {fmt(m.catalog.quoted, { text: correction })}
          </PageLink>
        </WithSuggestion>
      )}
      {latin && (
        <WithSuggestion template={t.cyrillic}>
          <PageLink href={catalogHref({ ...query, q: latin, page: 1 })}>{fmt(m.catalog.quoted, { text: latin })}</PageLink>
        </WithSuggestion>
      )}
      {query.q && !latin && !correction && <p>{t.checkSpelling}</p>}
      {filters > 0 && (
        <p>
          {t.tooManyFilters}{" "}
          <PageLink href={catalogHref({ q: query.q })}>{query.q ? t.searchWithoutFilters : t.resetFilters}</PageLink>
        </p>
      )}
    </div>
  );
}

/** Речення з посиланням усередині: {suggestion} у тексті замінюється на посилання. */
function WithSuggestion({ template, children }: { template: string; children: React.ReactNode }) {
  const [before, after = ""] = template.split("{suggestion}");
  return (
    <p>
      {before}
      {children}
      {after}
    </p>
  );
}
