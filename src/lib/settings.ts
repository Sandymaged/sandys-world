// قواعد العمل (قسم 8). كل القيم دي إعدادات بتتخزن في جدول settings
// وبتتغير من لوحة التحكم؛ القيم هنا هي الافتراضي لو الإعداد مش موجود.

import type { DeliveryPeriod } from "./types";

export const STORE_NAME = "Sandy's World";

export const TIMEZONE = "Africa/Cairo";

export interface StoreSettings {
  packaging: { rate: number; min: number; max: number };
  sameDayCutoffHour: number;
  defaultSlotCapacity: number;
  periods: { id: DeliveryPeriod; label: string; from: number; to: number }[];
  maxCardMessage: number;
  instapay: { address: string; link: string; holderName: string };
  paymentWindowHours: number;
  sameDayPaymentWindowHours: number;
  weddingDiscounts: { minQty: number; rate: number }[];
  minPackageMargin: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  packaging: { rate: 0.08, min: 40, max: 200 },
  sameDayCutoffHour: 13,
  defaultSlotCapacity: 8,
  periods: [
    { id: "morning", label: "الصبح", from: 10, to: 13 },
    { id: "afternoon", label: "بعد الضهر", from: 13, to: 17 },
    { id: "evening", label: "بالليل", from: 17, to: 21 },
  ],
  maxCardMessage: 250,
  instapay: { address: "", link: "", holderName: "" },
  paymentWindowHours: 24,
  sameDayPaymentWindowHours: 2,
  weddingDiscounts: [
    { minQty: 10, rate: 0.1 },
    { minQty: 6, rate: 0.05 },
  ],
  minPackageMargin: 0.3,
};
