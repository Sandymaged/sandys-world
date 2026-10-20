// شكل الأوردر زي ما بيتخزن (مطابق لجداول orders / order_gifts / gift_items في الـ migration)

import type { GiftCardDesign } from "../gift-card";
import type { DeliveryPeriod } from "../types";

export type OrderStatus =
  | "awaiting_payment" // مستني تأكيد الدفع
  | "new" // جديد
  | "awaiting_design_approval" // مستني موافقة التصميم
  | "preparing" // بيتجهز
  | "ready" // جاهز
  | "out_for_delivery" // خرج للتوصيل
  | "delivered" // اتسلم
  | "cancelled"; // ملغي

export type PaymentStatus = "awaiting_proof" | "awaiting_confirmation" | "confirmed" | "rejected" | "cod";

export interface GiftItemRecord {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number; // السعر وقت الطلب
  isAddon: boolean;
  customization: string | null;
  partnerId: string | null;
  commissionRate: number | null;
  /** اللون/المقاس/الريحة (عشان المخزون يرجع لو الطلب اتلغى)، ونص مقروء */
  choices?: { optionId: string; valueId: string }[];
  optionsText?: string | null;
}

export interface GiftRecord {
  id: string;
  kind: "package" | "box" | "product" | "kit";
  refId: string;
  title: string;
  recipient: {
    name: string;
    phone: string;
    zoneId: string;
    zoneName: string;
    address: string;
    landmark: string;
    locationUrl: string;
  };
  deliveryDate: string;
  deliveryPeriod: DeliveryPeriod;
  deliveryFee: number;
  basePrice: number;
  packaging: number;
  cardMessage: string;
  hidePrice: boolean;
  surprise: boolean;
  wantsDeliveryPhoto: boolean;
  people: number | null;
  names: string | null;
  /** اختيار التغليف لو العميل اختار غير العادي */
  wrapping?: { id: string; name: string; price: number } | null;
  items: GiftItemRecord[];
}

export interface OrderMessage {
  id: string;
  at: string;
  from: "store" | "customer";
  body: string;
}

export interface OrderRefund {
  at: string;
  kind: "refund" | "compensation" | "return";
  amount: number;
  reason: string;
}

/** طلب شراء كارت هدية (أوردر من غير هدايا بتتوصل) */
export interface GiftCardOrder {
  design: GiftCardDesign;
  amount: number;
  asGift: boolean; // هيتبعت لحد تاني ولا للمشتري نفسه
  toName: string;
  toPhone: string;
  fromName: string;
  message: string;
  code: string | null; // بيتعمل أول ما الدفع يتأكد
  expiresAt: string | null;
}

/** الكارت نفسه ورصيده، وكل مرة اتصرف منه */
export interface GiftCardRecord {
  code: string;
  amount: number;
  balance: number;
  orderId: string;
  createdAt: string;
  expiresAt: string;
  uses: { ref: string; amount: number; at: string; reversed?: boolean }[];
}

export interface OrderRecord {
  id: string;
  number: number;
  token: string; // لينك المتابعة والدفع
  createdAt: string;
  locale: "ar" | "en";
  sender: { name: string; phone: string; email: string };
  status: OrderStatus;
  paymentMethod: "instapay" | "cod";
  paymentStatus: PaymentStatus;
  transferReference: string | null;
  proofFile: string | null;
  paymentDueAt: string | null;
  paymentConfirmedAt: string | null;
  paymentRejectionReason: string | null;
  couponCode: string | null;
  /** لو الطلب ده شراء كارت هدية */
  giftCard?: GiftCardOrder | null;
  /** لو جزء من الطلب اتدفع بكارت هدية (ref عشان نرجّع الرصيد لو الطلب اتلغى) */
  giftCardUse?: { code: string; amount: number; ref: string } | null;
  /** العميل عرفنا منين (إنستجرام، صاحب…) */
  source?: string | null;
  /** مرتجعات وتعويضات وفلوس رجعت للعميل (بتتخصم من المكسب) */
  refunds?: OrderRefund[];
  /** الشات بين المتجر والعميل، وآخر مرة كل طرف قرا */
  messages?: OrderMessage[];
  storeReadAt?: string | null;
  customerReadAt?: string | null;
  totals: { items: number; packaging: number; delivery: number; discount: number; giftCard?: number; total: number };
  gifts: GiftRecord[];
  history: { at: string; status: OrderStatus; note?: string; by?: string }[];
}

export interface OrderFilter {
  status?: OrderStatus | "all";
  date?: string;
  zoneId?: string;
  q?: string;
}

export interface Repo {
  kind: "file" | "supabase";
  createOrder(o: Omit<OrderRecord, "id" | "number" | "token" | "createdAt" | "history">): Promise<OrderRecord>;
  getByToken(token: string): Promise<OrderRecord | null>;
  getById(id: string): Promise<OrderRecord | null>;
  findByNumberAndPhone(number: number, phone: string): Promise<OrderRecord | null>;
  list(filter?: OrderFilter): Promise<OrderRecord[]>;
  update(id: string, patch: Partial<OrderRecord>, note?: { status?: OrderStatus; note?: string; by?: string }): Promise<OrderRecord | null>;
  /** بيحجز مكان في فترة التوصيل لو فيه، في عملية واحدة */
  reserveSlot(date: string, period: DeliveryPeriod, capacity: number): Promise<boolean>;
  releaseSlot(date: string, period: DeliveryPeriod): Promise<void>;
  slotUsage(date: string): Promise<Record<DeliveryPeriod, number>>;
  saveFile(name: string, data: Buffer): Promise<string>;
  readFile(name: string): Promise<Buffer | null>;
  useCoupon(code: string): Promise<void>;
  couponUses(code: string): Promise<number>;
  /** بيعمل كارت هدية جديد بكود مش متكرر */
  issueGiftCard(orderId: string, amount: number, expiresAt: string): Promise<GiftCardRecord>;
  getGiftCard(code: string): Promise<GiftCardRecord | null>;
  /** بيخصم من الرصيد في عملية واحدة؛ false لو الرصيد مش كفاية أو الكارت مش صالح */
  redeemGiftCard(code: string, amount: number, ref: string): Promise<boolean>;
  /** بيرجّع اللي اتخصم (لو الطلب اتلغى) */
  restoreGiftCard(code: string, ref: string): Promise<void>;
  /** مجموع الرصيد اللي لسه في كروت الهدايا الصالحة (فلوس على المتجر لسه) */
  giftCardBalances(): Promise<number>;
}
