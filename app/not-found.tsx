import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Такої сторінки немає</h1>
      <p style={{ marginTop: 8, color: "var(--muted)" }}>
        Можливо, посилання застаріло або в ньому помилка.{" "}
        <Link href="/" style={{ color: "var(--accent)" }}>
          На головну
        </Link>
      </p>
    </div>
  );
}
