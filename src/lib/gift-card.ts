// كارت الهدية: الأشكال والمبالغ والقواعد (مشتركة بين المتصفح والسيرفر)

export const giftCardDesigns = [
  { id: "classic", label: "عام" },
  { id: "birthday", label: "عيد ميلاد" },
  { id: "bridal", label: "عروسة" },
  { id: "graduation", label: "نجاح وتخرج" },
] as const;

export type GiftCardDesign = (typeof giftCardDesigns)[number]["id"];

export const giftCardAmounts = [300, 500, 750, 1000, 1500, 2000];
export const GIFT_CARD_MIN = 200;
export const GIFT_CARD_MAX = 10000;
/** صالح لمدة سنة من يوم ما الدفع يتأكد */
export const GIFT_CARD_VALID_MONTHS = 12;
export const GIFT_CARD_MAX_MESSAGE = 160;

export const isGiftCardDesign = (v: string): v is GiftCardDesign => giftCardDesigns.some((d) => d.id === v);

/** الكود بيتكتب بحروف كابيتال ومن غير مسافات: GC-7KQ2-M9XA */
export const normalizeGiftCardCode = (code: string) =>
  code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^GC/, "")
    .replace(/^(.{4})(.{4}).*$/, "GC-$1-$2");
