/**
 * Supabase віддає за раз не більше 1000 рядків. Для великих списків (тисячі відміток серій) дочитуємо
 * порціями: `make(from, to)` — той самий запит із `.range(from, to)` і сталим порядком.
 */
const PAGE = 1000;

export async function selectAll<T>(
  make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await make(from, from + PAGE - 1);
    if (error) return { data: all, error };
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) return { data: all, error: null };
  }
}
