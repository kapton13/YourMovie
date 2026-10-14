/**
 * Куди повернути людину після входу чи з листа: лише сторінки нашого сайту.
 * Браузер читає «/\evil.com» або «/<Tab>/evil.com» як «//evil.com» — тобто чужий сайт, тож
 * перевіряємо не початок рядка, а куди адреса веде насправді.
 */
export function safeNext(value: string | null | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/")) return fallback;
  const base = "https://yourmovie.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
