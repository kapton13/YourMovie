"use client";

import { Link, useI18n } from "@/components/i18n/I18nProvider";

export default function NotFound() {
  const { m } = useI18n();
  return (
    <div style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{m.common.notFound.title}</h1>
      <p style={{ marginTop: 8, color: "var(--muted)" }}>
        {m.common.notFound.text}{" "}
        <Link href="/" style={{ color: "var(--accent)" }}>
          {m.common.notFound.home}
        </Link>
      </p>
    </div>
  );
}
