/**
 * Тексти словників — звичайні рядки з місцями для значень: "Знайдено {n}".
 * Множина — об'єкт форм за правилами мови (Intl.PluralRules): англійська — one/other,
 * українська й російська — one/few/many (other — запасна).
 */
export type Plural = { one: string; other: string; few?: string; many?: string; two?: string; zero?: string };

/** Підставити значення: fmt("Сезон {n}", { n: 2 }) → "Сезон 2". */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (key in vars ? String(vars[key]) : all));
}

const rulesCache = new Map<string, Intl.PluralRules>();

/** Форма слова для числа: plural({one:"серія", few:"серії", many:"серій", other:"серії"}, 5, "uk-UA") → "серій". */
export function plural(forms: Plural, n: number, intl: string): string {
  let rules = rulesCache.get(intl);
  if (!rules) {
    rules = new Intl.PluralRules(intl);
    rulesCache.set(intl, rules);
  }
  const category = rules.select(n) as keyof Plural;
  return forms[category] ?? forms.other;
}

/** Число разом зі словом: count(forms, 5, "uk-UA") → "5 серій" (форма може містити {n} — тоді число там). */
export function count(forms: Plural, n: number, intl: string): string {
  const form = plural(forms, n, intl);
  const number = n.toLocaleString(intl);
  return form.includes("{n}") ? fmt(form, { n: number }) : `${number} ${form}`;
}
