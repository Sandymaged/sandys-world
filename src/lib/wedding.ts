// طلبات الأفراح الخاصة (قسم 5 في الـ SRS): بتتسعّر يدوي، والفورم بيعرض سعر مبدئي بس (FR-82)

export interface WeddingType {
  id: "bridesmaid-request" | "wedding-day-kit" | "bride-box" | "favors" | "signs";
  label: string; // مفتاح ترجمة
  unit: number; // سعر مبدئي للقطعة
  unitLabel: string; // مفتاح ترجمة
}

export const weddingTypes: WeddingType[] = [
  { id: "bridesmaid-request", label: "طلب إشبينة (Proposal)", unit: 450, unitLabel: "للإشبينة" },
  { id: "wedding-day-kit", label: "كيت يوم الفرح", unit: 400, unitLabel: "للكيت" },
  { id: "bride-box", label: "بوكس العروسة", unit: 1100, unitLabel: "للبوكس" },
  { id: "favors", label: "توزيعات للمعازيم", unit: 45, unitLabel: "للقطعة" },
  { id: "signs", label: "يافطات الفرح (Welcome sign)", unit: 650, unitLabel: "لليافطة" },
];

export const WEDDING_MIN_DAYS = 14;

/** السعر المبدئي كنطاق (±15%) لأن السعر النهائي من صاحبة المتجر */
export function weddingEstimate(unit: number, count: number, discountRate: number) {
  const base = unit * count * (1 - discountRate);
  return { low: Math.round((base * 0.85) / 10) * 10, high: Math.round((base * 1.15) / 10) * 10 };
}
