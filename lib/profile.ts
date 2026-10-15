/**
 * Нікнейм: 3–24 символи — літери будь-якої мови, але однієї абетки (щоб «Аdmin» з кириличною «А» не
 * видавав себе за «Admin»), а також цифри та _ . -. Ті самі діапазони перевіряє база
 * (`supabase/007_international_nicknames.sql`, функція `nickname_valid`) — змінювати разом.
 * Японська — кандзі + хірагана + катакана разом; корейська — хангиль + ханча.
 */
export const NICKNAME_SCRIPTS: { name: string; ranges: string }[] = [
  { name: "латиниця", ranges: "A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u024F\\u1E00-\\u1EFF\\u0300-\\u036F" },
  { name: "кирилиця", ranges: "\\u0400-\\u052F\\u0300-\\u036F" },
  { name: "грецька", ranges: "\\u0370-\\u03FF\\u1F00-\\u1FFF\\u0300-\\u036F" },
  { name: "вірменська", ranges: "\\u0531-\\u058F" },
  { name: "грузинська", ranges: "\\u10A0-\\u10FF\\u1C90-\\u1CBF" },
  { name: "іврит", ranges: "\\u0590-\\u05FF" },
  { name: "арабська", ranges: "\\u0600-\\u06FF\\u0750-\\u077F\\u200C" },
  { name: "деванагарі", ranges: "\\u0900-\\u097F\\u200C\\u200D" },
  { name: "бенгальська", ranges: "\\u0980-\\u09FF\\u200C\\u200D" },
  { name: "гурмукхі", ranges: "\\u0A00-\\u0A7F\\u200C\\u200D" },
  { name: "гуджараті", ranges: "\\u0A80-\\u0AFF\\u200C\\u200D" },
  { name: "тамільська", ranges: "\\u0B80-\\u0BFF\\u200C\\u200D" },
  { name: "телугу", ranges: "\\u0C00-\\u0C7F\\u200C\\u200D" },
  { name: "каннада", ranges: "\\u0C80-\\u0CFF\\u200C\\u200D" },
  { name: "малаялам", ranges: "\\u0D00-\\u0D7F\\u200C\\u200D" },
  { name: "тайська", ranges: "\\u0E00-\\u0E7F" },
  { name: "лаоська", ranges: "\\u0E80-\\u0EFF" },
  { name: "японська / китайська", ranges: "\\u3040-\\u309F\\u30A0-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF" },
  { name: "корейська", ranges: "\\uAC00-\\uD7AF\\u1100-\\u11FF\\u3130-\\u318F\\u4E00-\\u9FFF" },
];

const NICKNAME_COMMON = "0-9_.\\-";
const NICKNAME_PATTERNS = NICKNAME_SCRIPTS.map((s) => new RegExp(`^[${NICKNAME_COMMON}${s.ranges}]+$`, "u"));
const NICKNAME_ANY = new RegExp(`^[${NICKNAME_COMMON}${NICKNAME_SCRIPTS.map((s) => s.ranges).join("")}]+$`, "u");

export const NICKNAME_RULES = "3–24 символи: літери однієї абетки (будь-якою мовою), цифри, _ . -";

/** Нікнейм в одному вигляді: та сама форма літер (NFC), без пробілів по краях. */
export function cleanNickname(value: string): string {
  return value.normalize("NFC").trim();
}

export type Profile = {
  id: string;
  user_number: number;
  nickname: string;
  /** Прізвище, ім'я, по батькові — окремо (до 50 символів кожне). Немає, якщо базу ще не оновлено. */
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  phone: string | null;
  /** Відкритий профіль (`/u/нікнейм` бачать усі). Немає, якщо базу ще не оновлено. */
  is_public?: boolean;
  /** Обрана мова сайту (en, uk, ru…). Немає, якщо базу ще не оновлено або не обирали. */
  language?: string | null;
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
  const value = cleanNickname(nickname);
  const length = [...value].length;
  if (length < 3) return "Нікнейм — щонайменше 3 символи.";
  if (length > 24) return "Нікнейм — не довше за 24 символи.";
  if (!NICKNAME_PATTERNS.some((p) => p.test(value)))
    return NICKNAME_ANY.test(value)
      ? "Літери лише однієї абетки — не змішуйте, наприклад, латиницю з кирилицею."
      : "Лише літери, цифри та символи _ . - (без пробілів).";
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
