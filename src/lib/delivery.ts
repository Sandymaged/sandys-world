// قواعد التوصيل والمواعيد (قسم 8.2). كل الحسابات بتوقيت القاهرة،
// لأن العميل ممكن يطلب من الخليج أو من برا مصر.

import { translator, type T } from "@/i18n/t";
import { TIMEZONE, type StoreSettings } from "./settings";
import type { DeliveryPeriod, Zone } from "./types";

export interface CairoNow {
  date: string; // YYYY-MM-DD
  hour: number;
}

/**
 * بنوصّل فين، من مناطق التوصيل اللي في اللوحة (مش كلام ثابت):
 * عشان صفحة المنتج والفوتر والسياسات والسلة يقولوا نفس الحاجة.
 */
export function coverageText(zones: Pick<Zone, "kind">[], t: T) {
  const kinds = new Set(zones.map((z) => z.kind));
  const city = kinds.has("city"), markaz = kinds.has("markaz"), gov = kinds.has("governorate");
  if (city && markaz && gov) return t("نوصّل داخل مدينة أسيوط ومراكزها، وإلى محافظات أخرى.");
  if (city && markaz) return t("نوصّل داخل مدينة أسيوط ومراكزها.");
  if (city && gov) return t("نوصّل داخل مدينة أسيوط، وإلى محافظات أخرى.");
  if (markaz && gov) return t("نوصّل إلى مراكز أسيوط، وإلى محافظات أخرى.");
  if (city) return t("نوصّل داخل مدينة أسيوط.");
  if (markaz) return t("نوصّل إلى مراكز أسيوط.");
  return t("نوصّل إلى العنوان الذي تختاره.");
}

export function cairoNow(at: Date = new Date()): CairoNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** هل الهدية تنفع توصيل في نفس اليوم؟ مدينة أسيوط بس، مدة تجهيز صفر، وقبل الساعة المحددة */
export function sameDayAllowed(
  prepDays: number,
  zone: Zone,
  now: CairoNow,
  settings: StoreSettings,
): boolean {
  return (
    zone.sameDay &&
    prepDays === 0 &&
    zone.extraDays === 0 &&
    now.hour < settings.sameDayCutoffHour
  );
}

/** أقرب يوم توصيل = النهارده + أطول مدة تجهيز (+ أيام الشحن للمحافظات) */
export function earliestDeliveryDate(
  prepDays: number,
  zone: Zone,
  now: CairoNow,
  settings: StoreSettings,
): string {
  if (sameDayAllowed(prepDays, zone, now, settings)) return now.date;
  return addDays(now.date, Math.max(1, prepDays + zone.extraDays));
}

/** الفترات اللي لسه ممكن تتحجز في يوم معين (في نفس اليوم: الفترات اللي لسه مبدأتش) */
export function periodsForDate(
  date: string,
  now: CairoNow,
  settings: StoreSettings,
): DeliveryPeriod[] {
  return settings.periods
    .filter((p) => date !== now.date || p.from > now.hour)
    .map((p) => p.id);
}

export function periodLabel(id: DeliveryPeriod, settings: StoreSettings, t?: T) {
  const p = settings.periods.find((x) => x.id === id);
  if (!p) return id;
  const h = (x: number) => (x > 12 ? x - 12 : x);
  const tr = t ?? translator("ar");
  // بالكلام بدل "10–1" عشان الشَرطة بتتقلب في الاتجاه العربي
  return tr("{label} من {from} لـ {to}", { label: tr(p.label), from: h(p.from), to: h(p.to) });
}
