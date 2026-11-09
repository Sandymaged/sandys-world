// التحقق من الطلب وإعادة تسعيره على السيرفر من الكتالوج.
// المتصفح بيبعت اختيارات بس (إيه ولمين وإمتى)، والأسعار بتتحسب هنا من جديد.

import type { CartGift } from "./cart";
import { hasCustomization } from "./cart";
import { emailError, nameError, phoneError, recipientErrors } from "./validate";
import type { Storefront } from "./catalog";
import { cairoNow, earliestDeliveryDate, periodsForDate, type CairoNow } from "./delivery";
import { translator, type T } from "@/i18n/t";
import { comboKey, comboStock, describeChoices, optionsPrice, usesCombos, valueAvailable, type OptionChoice } from "./options";
import { couponDiscount, kitTotal, packagingFee, type CouponRule } from "./pricing";
import { giftCardProblems, type CartGiftCard } from "./gift-card";

export interface OrderInput {
  gifts: CartGift[];
  sender: { name: string; phone: string; email: string; isRecipient: boolean };
  couponCode: string;
  paymentMethod: "instapay" | "cod";
  /** العميل عرفنا منين (اختياري) */
  source?: string;
  /** كروت هدايا بتتدفع مع الطلب (من غير توصيل) */
  giftCards?: Omit<CartGiftCard, "id">[];
}

export interface QuotedItem {
  productId: string;
  quantity: number;
  unitPrice: number; // السعر وقت الطلب — بيتسجل في سطر الهدية
  customization: string | null;
  isAddon: boolean;
  /** اللون/المقاس/الريحة اللي اتختار، ونص مقروء للوحة */
  choices: OptionChoice[];
  optionsText: string | null;
}

export interface QuotedGift {
  source: CartGift;
  items: QuotedItem[];
  basePrice: number;
  packaging: number;
  deliveryFee: number;
  subtotal: number; // الهدية + التغليف (من غير التوصيل)
  wrapping: { id: string; name: string; price: number } | null;
}

export interface Quote {
  errors: string[];
  gifts: QuotedGift[];
  itemsTotal: number;
  packagingTotal: number;
  deliveryTotal: number;
  discount: number;
  /** كروت الهدايا (جوه total) */
  cardsTotal: number;
  total: number;
  codAllowed: boolean;
}

export function quoteOrder(
  sf: Storefront,
  input: OrderInput,
  coupon: CouponRule | null,
  now: CairoNow = cairoNow(),
  t: T = translator("ar"),
): Quote {
  const errors: string[] = [];
  const products = new Map(sf.products.map((p) => [p.id, p]));
  const out: QuotedGift[] = [];

  // بياناتك: الاسم والموبايل لازم يكونوا مظبوطين، والإيميل اختياري
  const senderName = nameError(input.sender.name);
  if (senderName) errors.push(t("اسمك: {e}", { e: t(senderName) }));
  const senderPhone = phoneError(input.sender.phone);
  if (senderPhone) errors.push(t("موبايلك: {e}", { e: t(senderPhone) }));
  const senderEmail = emailError(input.sender.email ?? "");
  if (senderEmail) errors.push(t(senderEmail));
  const cards = input.giftCards ?? [];
  if (input.gifts.length === 0 && cards.length === 0) errors.push(t("السلة فاضية"));
  cards.forEach((c, i) => {
    for (const e of giftCardProblems(c)) errors.push(t("كارت الهدية {n}: {e}", { n: i + 1, e: t(e) }));
  });

  input.gifts.forEach((g, gi) => {
    const tag = t("الهدية {n}", { n: gi + 1 });
    const items: QuotedItem[] = [];
    let basePrice = 0;
    let prepDays = 0;

    const takeProduct = (productId: string, qty: number, priced: boolean, isAddon: boolean, customization?: string, choices?: OptionChoice[]) => {
      const p = products.get(productId);
      if (!p) {
        errors.push(t("{tag}: فيها منتج مبقاش متاح", { tag }));
        return;
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) errors.push(t("{tag}: كمية غلط", { tag }));
      const text = p.isCustomizable ? (customization ?? "").trim() : "";
      if (p.isCustomizable && !text) errors.push(t("{tag}: ناقص نص التخصيص لـ {name}", { tag, name: p.name }));
      if (p.customizationMaxChars && text.length > p.customizationMaxChars) errors.push(t("{tag}: نص التخصيص أطول من المسموح", { tag }));
      prepDays = Math.max(prepDays, p.prepDays);
      // الاختيارات: لازم كل اختيار يكون متختار وموجود ولسه متاح (الإضافات ملهاش اختيار في الصفحة، فبتتساب)
      const opts = isAddon ? [] : (p.options ?? []);
      const picked = (choices ?? []).filter((c) => opts.some((o) => o.id === c.optionId));
      for (const o of opts) {
        const v = o.values.find((x) => x.id === picked.find((c) => c.optionId === o.id)?.valueId);
        if (!v) errors.push(t("{tag}: اختار {option} لـ {name}", { tag, option: o.name, name: p.name }));
        else if (!valueAvailable(v)) errors.push(t("{tag}: {value} من {name} خلص", { tag, value: v.label, name: p.name }));
      }
      // التركيبة نفسها (yara · 100ml) خلصت حتى لو كل قيمة لوحدها متاحة
      if (usesCombos(opts) && picked.length === opts.length) {
        const s = comboStock(opts, comboKey(picked));
        if (s != null && s <= 0) errors.push(t("{tag}: {value} من {name} خلص", { tag, value: describeChoices(opts, picked), name: p.name }));
      }
      items.push({
        productId,
        quantity: qty,
        unitPrice: priced ? p.price + optionsPrice(opts, picked) : 0,
        customization: text || null,
        isAddon,
        choices: picked,
        optionsText: describeChoices(opts, picked) || null,
      });
    };

    if (g.kind === "kit") {
      const kit = sf.kits.find((k) => k.id === g.refId);
      if (!kit) {
        errors.push(t("{tag}: الكيت \"{name}\" مبقاش متاح", { tag, name: g.title }));
        return;
      }
      const people = g.people ?? 0;
      if (!Number.isInteger(people) || people < kit.minPeople || people > kit.maxPeople) {
        errors.push(t("{tag}: عدد الأفراد لازم يكون من {min} لـ {max}", { tag, min: kit.minPeople, max: kit.maxPeople }));
      }
      basePrice = kitTotal(kit.pricePerPerson, people, sf.settings.weddingDiscounts).total;
      prepDays = kit.prepDays;
    } else if (g.kind === "package") {
      const pkg = sf.packages.find((p) => p.id === g.refId);
      if (!pkg) {
        errors.push(t("{tag}: الباكدج \"{name}\" مبقاش متاح", { tag, name: g.title }));
        return;
      }
      basePrice = pkg.price;
      // البوكس اختياري، ولازم يكون من المقاسات اللي المتجر حددها للباكدج ده
      if (g.boxSizeId) {
        const allowed = sf.settings.packageBoxes?.[pkg.id] ?? [];
        const box = sf.boxSizes.find((b) => b.id === g.boxSizeId);
        if (!box || !allowed.includes(box.id)) errors.push(t("{tag}: البوكس ده مبقاش متاح للباكدج", { tag }));
        else basePrice += box.price;
      }
      const custom = new Map(g.lines.map((l) => [l.productId, l]));
      for (const p of pkg.products) takeProduct(p.id, p.quantity, false, false, custom.get(p.id)?.customization, custom.get(p.id)?.choices);
      for (const a of g.addons) {
        if (!products.get(a.productId)?.isAddon) errors.push(t("{tag}: إضافة مش متاحة", { tag }));
        else takeProduct(a.productId, a.quantity, true, true);
      }
    } else if (g.kind === "box") {
      const size = sf.boxSizes.find((b) => b.id === g.refId);
      if (!size) {
        errors.push(t("{tag}: حجم البوكس مش موجود", { tag }));
        return;
      }
      basePrice = size.price;
      const count = g.lines.reduce((s, l) => s + l.quantity, 0);
      if (count === 0 || count > size.maxItems) errors.push(t("{tag}: عدد المنتجات مش مناسب لحجم البوكس", { tag }));
      for (const l of g.lines) {
        if (products.get(l.productId)?.boxEligible === false) errors.push(t("{tag}: {name} مينفعش يتحط في بوكس", { tag, name: l.name }));
        takeProduct(l.productId, l.quantity, true, false, l.customization, l.choices);
      }
    } else {
      const l = g.lines[0];
      if (!l || l.productId !== g.refId) {
        errors.push(t("{tag}: بيانات غلط", { tag }));
        return;
      }
      takeProduct(l.productId, l.quantity, true, false, l.customization, l.choices);
    }

    const lines = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    // اختيار التغليف (لو العميل اختار حاجة غير العادي) بيتحسب على الهدية
    const wrap = g.wrapping ? sf.settings.wrappings.find((w) => w.id === g.wrapping) : undefined;
    if (g.wrapping && !wrap) errors.push(t("{tag}: التغليف ده مبقاش متاح", { tag }));
    const packaging = (g.kind === "box" ? packagingFee(basePrice + lines, sf.settings.packaging) : 0) + (wrap?.price ?? 0);

    // المستلم والتوصيل
    const r = g.recipient;
    // الطلب لشخص واحد، فبيانات المستلم بتتراجع مرة واحدة
    if (gi === 0) {
      const re = recipientErrors(r);
      for (const k of ["name", "phone", "address", "landmark", "locationUrl"] as const) {
        if (re[k]) errors.push(t("المستلم: {e}", { e: t(re[k]!) }));
      }
    }
    if (g.cardMessage.length > sf.settings.maxCardMessage) errors.push(t("{tag}: رسالة الكارت طويلة", { tag }));
    const zone = sf.zones.find((z) => z.id === r.zoneId);
    if (!zone) {
      errors.push(t("{tag}: اختار المنطقة", { tag }));
    } else {
      const earliest = earliestDeliveryDate(prepDays, zone, now, sf.settings);
      if (!g.delivery.date || g.delivery.date < earliest) {
        errors.push(t("{tag}: يوم التوصيل مبقاش متاح، أقرب يوم {date}", { tag, date: earliest }));
      } else if (!g.delivery.period || !periodsForDate(g.delivery.date, now, sf.settings).includes(g.delivery.period)) {
        errors.push(t("{tag}: فترة التوصيل مبقتش متاحة", { tag }));
      }
    }

    out.push({
      source: g,
      items,
      basePrice,
      packaging,
      // الطلب لشخص واحد: رسوم التوصيل بتتحسب مرة واحدة (على أول هدية)
      deliveryFee: gi === 0 ? (zone?.fee ?? 0) : 0,
      subtotal: basePrice + lines + packaging,
      wrapping: wrap ? { id: wrap.id, name: wrap.name, price: wrap.price } : null,
    });
  });

  // كل الهدايا لازم تروح لنفس الشخص ونفس العنوان في نفس الميعاد
  const first = input.gifts[0];
  const sameDelivery = (g: CartGift) =>
    g.recipient.phone.trim() === first.recipient.phone.trim() &&
    g.recipient.zoneId === first.recipient.zoneId &&
    g.recipient.address.trim() === first.recipient.address.trim() &&
    g.delivery.date === first.delivery.date &&
    g.delivery.period === first.delivery.period;
  if (first && !input.gifts.every(sameDelivery)) errors.push(t("الطلب الواحد بيروح لشخص واحد في ميعاد واحد. لو عايز تبعت لحد تاني اعمل طلب تاني."));

  const itemsTotal = out.reduce((s, g) => s + g.subtotal - g.packaging, 0);
  const packagingTotal = out.reduce((s, g) => s + g.packaging, 0);
  const deliveryTotal = out.reduce((s, g) => s + g.deliveryFee, 0);
  // الخصم على الهدايا بس، مش على كروت الهدايا
  const discount = coupon ? couponDiscount(itemsTotal + packagingTotal, coupon) : 0;
  const cardsTotal = cards.reduce((s, c) => s + c.amount, 0);

  // الكاش عند الاستلام: المرسل هو المستلم، ومفيش تخصيص، وجوه محافظة أسيوط (8.3)، ومفيش كروت هدايا (لازم تتدفع الأول)
  const codAllowed =
    input.gifts.length > 0 &&
    cards.length === 0 &&
    input.sender.isRecipient &&
    input.gifts.every((g) => !hasCustomization(g)) &&
    input.gifts.every((g) => sf.zones.find((z) => z.id === g.recipient.zoneId)?.kind !== "governorate");
  if (input.paymentMethod === "cod" && !codAllowed) errors.push(t("الكاش عند الاستلام مش متاح للطلب ده"));

  return {
    errors,
    gifts: out,
    itemsTotal,
    packagingTotal,
    deliveryTotal,
    discount,
    cardsTotal,
    total: itemsTotal + packagingTotal + deliveryTotal - discount + cardsTotal,
    codAllowed,
  };
}
