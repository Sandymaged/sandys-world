// كارت الهدية: الأشكال والمبالغ والقواعد (مشتركة بين المتصفح والسيرفر)

import { isValidPhone, nameError } from "./validate";

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

/**
 * كارت هدية في السلة: بيتدفع مع باقي الطلب ومن غير توصيل.
 * asGift = إحنا نبعته على واتساب للي هيوصله، غير كده الكود بيوصل للمشتري وهو يبعته بنفسه.
 */
export interface CartGiftCard {
  id: string;
  design: GiftCardDesign;
  amount: number;
  asGift: boolean;
  toName: string;
  toPhone: string;
  fromName: string;
  message: string;
}

/** مجموع كروت الهدايا في طلب (جوه totals.items مع الهدايا) */
export const cardsTotal = (o: { giftCards?: { amount: number }[] }) => (o.giftCards ?? []).reduce((s, c) => s + c.amount, 0);

/** المشاكل في كارت (بالعربي، والترجمة وقت العرض). نفس القواعد في المتصفح والسيرفر */
export function giftCardProblems(c: Omit<CartGiftCard, "id">): string[] {
  const p: string[] = [];
  if (!isGiftCardDesign(c.design)) p.push("اختار شكل الكارت");
  if (!Number.isInteger(c.amount) || c.amount < GIFT_CARD_MIN || c.amount > GIFT_CARD_MAX) p.push("المبلغ مش مظبوط");
  if (c.asGift) {
    if (nameError(c.toName)) p.push("اكتب اسم اللي هيوصله الكارت");
    if (!isValidPhone(c.toPhone)) p.push("رقم اللي هيوصله الكارت مش مظبوط");
  }
  if (c.message.length > GIFT_CARD_MAX_MESSAGE) p.push("الرسالة طويلة");
  return p;
}

/** الكود بيتكتب بحروف كابيتال ومن غير مسافات: GC-7KQ2-M9XA */
type Tr = (key: string, vars?: Record<string, string | number>) => string;

/**
 * رسالة واتساب اللي بتتبعت مع الكارت: بتفرّح وفيها لينك صفحة الكارت
 * (الصفحة فيها الكارت صورة بوشّين، والكود، وإزاي يستخدمه)
 */
export function giftCardShareText(
  t: Tr,
  c: { asGift: boolean; toName: string; fromName: string; message: string; amountLabel: string; store: string; link: string },
) {
  const to = c.asGift && c.toName ? c.toName : "";
  const lines = [
    to ? t("🎁 {name}، ليك هدية!", { name: to }) : t("🎁 ليك هدية!"),
    c.asGift && c.fromName
      ? t("{from} بعتلك كارت هدية من {store} بقيمة {amount}", { from: c.fromName, store: c.store, amount: c.amountLabel })
      : t("وصلك كارت هدية من {store} بقيمة {amount}", { store: c.store, amount: c.amountLabel }),
  ];
  if (c.asGift && c.message) lines.push("", `«${c.message}»`);
  lines.push("", t("افتح الكارت من هنا 👇"), c.link, "", t("اختار اللي يفرّحك من الموقع، وإحنا نغلّفهولك ونوصّلهولك 💝"));
  return lines.join("\n");
}

export const normalizeGiftCardCode = (code: string) =>
  code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^GC/, "")
    .replace(/^(.{4})(.{4}).*$/, "GC-$1-$2");
