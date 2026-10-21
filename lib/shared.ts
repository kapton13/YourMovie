/**
 * Одне значення на весь серверний процес. Next збирає сторінки й API окремими частинами, і кожна має
 * свою копію модулів — без цього пам'ять і паузи для AniList були б у кожної частини свої.
 */
export function shared<T>(name: string, create: () => T): T {
  const store = globalThis as unknown as Record<string, T | undefined>;
  const key = `__yourmovie_${name}`;
  return (store[key] ??= create());
}
