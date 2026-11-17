import { translator, type T } from "@/i18n/t";
import type { PackageTier } from "./types";

const isEn = (t?: T) => t?.locale === "en";

export const egp = (n: number, t?: T) =>
  isEn(t) ? `EGP ${n.toLocaleString("en-US")}` : `${n.toLocaleString("en-US")} ج.م`;

/** مفاتيح ترجمة: بتتعرض بـ t(tierLabels[tier]) */
export const tierLabels: Record<PackageTier, string> = {
  latif: "لطيف",
  momayaz: "مميز",
  fakher: "فاخر",
};

/**
 * عدد الأيام بالعربي الصح: يوم واحد، يومين، 3 أيام، 30 يوماً (والإنجليزي: 1 day / 30 days).
 * أي جملة فيها عدد أيام تاخد {days} من هنا بدل «{n} يوم».
 */
export function dayCount(n: number, t?: { locale?: string }) {
  if (t?.locale === "en") return n === 1 ? "1 day" : `${n} days`;
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومين";
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

export function prepLabel(days: number, t?: T) {
  const tr = t ?? translator("ar");
  if (days === 0) return tr("جاهز للتوصيل النهارده");
  return tr("يُجهَّز خلال {days}", { days: dayCount(days, tr) });
}

const fmts = {
  ar: new Intl.DateTimeFormat("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
};

/** YYYY-MM-DD → "الخميس 15 أكتوبر" / "Thursday 15 October" */
export const formatDay = (date: string, t?: T) =>
  fmts[isEn(t) ? "en" : "ar"].format(new Date(`${date}T00:00:00Z`));
