// قواعد العمل (قسم 8). كل القيم دي إعدادات بتتخزن في جدول settings
// وبتتغير من لوحة التحكم؛ القيم هنا هي الافتراضي لو الإعداد مش موجود.

import type { DeliveryPeriod } from "./types";

export const STORE_NAME = "giftful";

export const TIMEZONE = "Africa/Cairo";

/** اختيار تغليف بيختاره العميل لكل هدية (فوق تغليف البوكس العادي) */
export interface WrappingOption {
  id: string;
  name: string;
  en?: string;
  /** زيادة على الهدية (صفر = من غير زيادة) */
  price: number;
  image?: string | null;
  description?: string;
  descriptionEn?: string;
}

export interface StoreSettings {
  packaging: { rate: number; min: number; max: number };
  wrappings: WrappingOption[];
  sameDayCutoffHour: number;
  defaultSlotCapacity: number;
  periods: { id: DeliveryPeriod; label: string; from: number; to: number }[];
  maxCardMessage: number;
  /** بيانات الدفع بإنستاباي اللي العميل بيشوفها: العنوان (IPA)، والرقم، ولينك الدفع، والاسم */
  instapay: { address: string; phone?: string; link: string; holderName: string };
  paymentWindowHours: number;
  sameDayPaymentWindowHours: number;
  weddingDiscounts: { minQty: number; rate: number }[];
  minPackageMargin: number;
  /** مقاسات البوكس اللي تنفع لكل باكدج (العميل يختار واحد منهم أو من غير بوكس): { packageId: [boxSizeId] } */
  packageBoxes: Record<string, string[]>;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  packaging: { rate: 0.08, min: 40, max: 200 },
  wrappings: [{ id: "standard", name: "تغليف عادي", en: "Standard wrap", price: 0, description: "ورق وشريطة على ذوق المناسبة" }],
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
  packageBoxes: {},
};
