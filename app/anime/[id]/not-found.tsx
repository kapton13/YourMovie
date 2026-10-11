import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Такого аніме не знайдено</h1>
      <p style={{ marginTop: 8, color: "var(--muted)" }}>
        Можливо, посилання застаріло. <Link href="/catalog" style={{ color: "var(--accent)" }}>Перейти до каталогу</Link>
      </p>
    </div>
  );
}
