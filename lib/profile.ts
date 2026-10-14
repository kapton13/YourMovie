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

/**
 * Імена будь-якою мовою: літери будь-якої абетки з діакритикою (é, ễ, ё, ї, огласовки івриту, знаки
 * деванагарі й тайської), невидимі з'єднувачі перської та індійських мов, апострофи (O’Brien, Ів'ян,
 * ʻOkina), дефіси, крапки, «·» і «・» (ジョン・スミス) та одиночні пробіли між словами.
 */
const NAME_CHAR = "[\\p{L}\\p{M}\\u200C\\u200D'’ʼ‘`´ʹ՚׳״.·・‐‑–-]";
const NAME_PATTERN = new RegExp(`^${NAME_CHAR}+( ${NAME_CHAR}+)*$`, "u");

/** Ім'я в одному вигляді: та сама форма літер (NFC), без зайвих пробілів (зокрема нерозривних). */
export function cleanName(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** Довжина в символах так, як рахує база (емодзі чи рідкісний ієрогліф — один символ). */
export function nameLength(value: string): number {
  return [...cleanName(value)].length;
}

export function nameProblem(value: string, label: string): string {
  const clean = cleanName(value);
  if (!clean) return "";
  if (nameLength(clean) > NAME_MAX_LENGTH) return `${label}: не довше за ${NAME_MAX_LENGTH} символів.`;
  if (!NAME_PATTERN.test(clean) || !/\p{L}/u.test(clean))
    return `${label}: лише літери (будь-якою мовою), апостроф, дефіс, крапка й пробіл.`;
  return "";
}

export function nicknameProblem(nickname: string): string {
  const value = nickname.trim();
  if (value.length < 3) return "Нікнейм — щонайменше 3 символи.";
  if (value.length > 24) return "Нікнейм — не довше за 24 символи.";
  if (!NICKNAME_PATTERN.test(value)) return "Лише літери, цифри та символи _ . - (без пробілів).";
  if (/^user[0-9]+$/i.test(value)) return "Ніки «User» + цифри сайт видає автоматично — оберіть інший.";
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
