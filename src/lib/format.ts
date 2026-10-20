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

export function prepLabel(days: number, t?: T) {
  const tr = t ?? translator("ar");
  if (days === 0) return tr("جاهز للتوصيل النهارده");
  if (days === 1) return tr("بيتجهز في يوم");
  if (days === 2) return tr("بيتجهز في يومين");
  return tr("بيتجهز في {n} أيام", { n: days });
}

const fmts = {
  ar: new Intl.DateTimeFormat("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
};

/** YYYY-MM-DD → "الخميس 15 أكتوبر" / "Thursday 15 October" */
export const formatDay = (date: string, t?: T) =>
  fmts[isEn(t) ? "en" : "ar"].format(new Date(`${date}T00:00:00Z`));
