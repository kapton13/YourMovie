"use client";

import { Link, useI18n } from "@/components/i18n/I18nProvider";

export default function NotFound() {
  const { m } = useI18n();
  return (
    <div style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{m.common.notFound.animeTitle}</h1>
      <p style={{ marginTop: 8, color: "var(--muted)" }}>
        {m.common.notFound.animeText}{" "}
        <Link href="/catalog" style={{ color: "var(--accent)" }}>
          {m.common.notFound.toCatalog}
        </Link>
      </p>
    </div>
  );
}
