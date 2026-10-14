/** Нікнейм: 3–24 символи — латиниця, кирилиця, цифри, _ . - (те саме правило перевіряє база). */
export const NICKNAME_PATTERN = /^[A-Za-z0-9_.А-Яа-яЁёІіЇїЄєҐґ-]{3,24}$/;

export const NICKNAME_RULES = "3–24 символи: літери, цифри, _ . -";

export type Profile = {
  id: string;
  user_number: number;
  nickname: string;
  /** Прізвище, ім'я, по батькові — окремо (до 50 символів кожне). Немає, якщо базу ще не оновлено. */
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  phone: string | null;
  country: string | null;
};

export const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;

/** Прізвище, ім'я, по батькові: до 50 символів (те саме обмеження в базі). */
export const NAME_MAX_LENGTH = 50;

/** Літери будь-якої абетки, апостроф, дефіс, крапка й пробіли між словами («Квітка-Основ'яненко»). */
const NAME_PATTERN = /^[\p{L}\p{M}'’ʼ.-]+( [\p{L}\p{M}'’ʼ.-]+)*$/u;

export function nameProblem(value: string, label: string): string {
  const clean = value.trim();
  if (!clean) return "";
  if (clean.length > NAME_MAX_LENGTH) return `${label}: не довше за ${NAME_MAX_LENGTH} символів.`;
  if (!NAME_PATTERN.test(clean.replace(/\s+/g, " "))) return `${label}: лише літери, апостроф, дефіс і пробіл.`;
  return "";
}

export function nicknameProblem(nickname: string): string {
  const value = nickname.trim();
  if (value.length < 3) return "Нікнейм — щонайменше 3 символи.";
  if (value.length > 24) return "Нікнейм — не довше за 24 символи.";
  if (!NICKNAME_PATTERN.test(value)) return "Лише літери, цифри та символи _ . - (без пробілів).";
  return "";
}

/** Коди країн ISO 3166-1; назви показує браузер мовою сайту. */
const COUNTRY_CODES =
  "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW".split(
    " ",
  );

export function countryOptions(): { code: string; name: string }[] {
  const names = new Intl.DisplayNames(["uk"], { type: "region" });
  return COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, "uk"),
  );
}
