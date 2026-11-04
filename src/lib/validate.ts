/*
 * التحقق من بيانات العميل والمستلم (نفس القواعد في المتصفح والسيرفر).
 * كل دالة بترجع رسالة المشكلة بالعربي (مفتاح ترجمة)، أو null لو البيان مظبوط.
 */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** الأرقام العربي والفارسي → إنجليزي */
export const toLatinDigits = (s: string) =>
  s.replace(/[٠-٩۰-۹]/g, (d) => String(AR_DIGITS.includes(d) ? AR_DIGITS.indexOf(d) : FA_DIGITS.indexOf(d)));

/** رقم الموبايل المصري بالشكل 01xxxxxxxxx (بيقبل +20 و 0020 والمسافات والشرط) */
export function normalizePhone(raw: string) {
  let d = toLatinDigits(raw).replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0020")) d = d.slice(4);
  else if (d.startsWith("20") && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.startsWith("1")) d = `0${d}`;
  return d;
}

export const PHONE_RE = /^01[0125]\d{8}$/;

export function phoneError(raw: string): string | null {
  if (!raw.trim()) return "اكتب رقم الموبايل";
  const d = normalizePhone(raw);
  if (/[^\d\s+()-]/.test(toLatinDigits(raw))) return "رقم الموبايل أرقام بس";
  if (d.length !== 11) return "رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 01";
  if (!PHONE_RE.test(d)) return "رقم الموبايل لازم يبدأ بـ 010 أو 011 أو 012 أو 015";
  return null;
}

export const isValidPhone = (raw: string) => phoneError(raw) === null;

const LETTERS = /[\p{L}]/gu;

export function nameError(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "اكتب الاسم";
  if (/\d|[٠-٩]/.test(s)) return "الاسم من غير أرقام";
  if ((s.match(LETTERS) ?? []).length < 2) return "الاسم قصير أوي";
  if (s.length > 60) return "الاسم طويل أوي";
  if (/[<>{}[\]\\/@#$%^*=_|~`]/.test(s)) return "الاسم فيه رموز مش مسموحة";
  return null;
}

export function addressError(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "اكتب العنوان";
  if ((s.match(LETTERS) ?? []).length < 6 || s.length < 10) return "اكتب العنوان بالتفصيل (الشارع والعمارة والدور)";
  if (s.length > 300) return "العنوان طويل أوي";
  return null;
}

export function landmarkError(raw: string): string | null {
  return raw.trim().length > 120 ? "العلامة المميزة طويلة أوي" : null;
}

/** لينك اللوكيشن اختياري، بس لو اتكتب لازم يبقى لينك حقيقي */
export function urlError(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.length > 500) return "اللينك طويل أوي";
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "اللينك لازم يبدأ بـ https://";
    if (!u.hostname.includes(".")) return "اللينك مش مظبوط";
    return null;
  } catch {
    return "اللينك مش مظبوط، انسخه من خرايط جوجل";
  }
}

/** الإيميل اختياري */
export function emailError(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.length > 120 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s)) return "الإيميل مش مظبوط";
  return null;
}

export interface RecipientInput {
  name: string;
  phone: string;
  zoneId: string;
  address: string;
  landmark: string;
  locationUrl: string;
}

/** مشاكل بيانات المستلم، كل خانة ورسالتها */
export function recipientErrors(r: RecipientInput): Partial<Record<keyof RecipientInput, string>> {
  const out: Partial<Record<keyof RecipientInput, string>> = {};
  const set = (k: keyof RecipientInput, e: string | null) => {
    if (e) out[k] = e;
  };
  set("name", nameError(r.name));
  set("phone", phoneError(r.phone));
  if (!r.zoneId) out.zoneId = "اختار المنطقة";
  set("address", addressError(r.address));
  set("landmark", landmarkError(r.landmark));
  set("locationUrl", urlError(r.locationUrl));
  return out;
}
