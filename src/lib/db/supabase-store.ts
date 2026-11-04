import "server-only";
import { randomBytes } from "node:crypto";
import { adminClient } from "../supabase/admin";
import type { GiftCardRecord, OrderRecord, Repo } from "./types";

/*
 * نفس الـ Repo بتاع المخزن المحلي بس على Supabase (بالمفتاح السري، من السيرفر بس).
 * الأوردر بيتحفظ في جدول orders: أعمدة للبحث والدفع والإجماليات، والهدايا وسجل الحالات jsonb.
 * حجز فترات التوصيل والكوبونات ورصيد كروت الهدايا بيتعملوا جوه قاعدة البيانات في عملية واحدة.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- صفوف قاعدة البيانات */

const db = () => adminClient();
const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
const PROOFS = "payment-proofs";

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

function toOrder(r: any): OrderRecord {
  return {
    id: r.id,
    number: r.number,
    token: r.tracking_token,
    createdAt: r.created_at,
    locale: r.locale === "en" ? "en" : "ar",
    sender: { name: r.sender_name, phone: r.sender_phone, email: r.sender_email ?? "" },
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    transferReference: r.transfer_reference,
    proofFile: r.payment_proof_path,
    paymentDueAt: r.payment_due_at,
    paymentConfirmedAt: r.payment_confirmed_at,
    paymentRejectionReason: r.payment_rejection_reason,
    couponCode: r.coupon_code,
    giftCard: r.gift_card ?? null,
    giftCardUse: r.gift_card_use ?? null,
    source: r.source ?? null,
    refunds: r.refunds ?? [],
    messages: r.messages ?? [],
    storeReadAt: r.store_read_at ?? null,
    customerReadAt: r.customer_read_at ?? null,
    brandStatus: r.brand_status ?? {},
    stockTaken: r.stock_taken ?? true,
    totals: {
      items: Number(r.items_total),
      packaging: Number(r.packaging_total),
      delivery: Number(r.delivery_total),
      discount: Number(r.discount_total),
      giftCard: Number(r.gift_card_total ?? 0),
      total: Number(r.total),
    },
    gifts: r.gifts ?? [],
    history: r.history ?? [],
  };
}

/** الأعمدة اللي بتتغير من الأوردر (للإضافة والتعديل) */
function toRow(o: Partial<OrderRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (o.locale !== undefined) row.locale = o.locale;
  if (o.sender) {
    row.sender_name = o.sender.name;
    row.sender_phone = o.sender.phone;
    row.sender_email = o.sender.email || null;
  }
  if (o.status !== undefined) row.status = o.status;
  if (o.paymentMethod !== undefined) row.payment_method = o.paymentMethod;
  if (o.paymentStatus !== undefined) row.payment_status = o.paymentStatus;
  if (o.transferReference !== undefined) row.transfer_reference = o.transferReference;
  if (o.proofFile !== undefined) row.payment_proof_path = o.proofFile;
  if (o.paymentDueAt !== undefined) row.payment_due_at = o.paymentDueAt;
  if (o.paymentConfirmedAt !== undefined) row.payment_confirmed_at = o.paymentConfirmedAt;
  if (o.paymentRejectionReason !== undefined) row.payment_rejection_reason = o.paymentRejectionReason;
  if (o.couponCode !== undefined) row.coupon_code = o.couponCode;
  if (o.giftCard !== undefined) row.gift_card = o.giftCard;
  if (o.giftCardUse !== undefined) row.gift_card_use = o.giftCardUse;
  if (o.source !== undefined) row.source = o.source;
  if (o.brandStatus !== undefined) row.brand_status = o.brandStatus;
  if (o.stockTaken !== undefined) row.stock_taken = o.stockTaken;
  if (o.refunds !== undefined) row.refunds = o.refunds;
  if (o.messages !== undefined) row.messages = o.messages;
  if (o.storeReadAt !== undefined) row.store_read_at = o.storeReadAt;
  if (o.customerReadAt !== undefined) row.customer_read_at = o.customerReadAt;
  if (o.totals) {
    row.items_total = o.totals.items;
    row.packaging_total = o.totals.packaging;
    row.delivery_total = o.totals.delivery;
    row.discount_total = o.totals.discount;
    row.gift_card_total = o.totals.giftCard ?? 0;
    row.total = o.totals.total;
  }
  if (o.gifts !== undefined) row.gifts = o.gifts;
  if (o.history !== undefined) row.history = o.history;
  return row;
}

function toCard(r: any, uses: any[] = []): GiftCardRecord {
  return {
    code: r.code,
    amount: Number(r.amount),
    balance: Number(r.balance),
    orderId: r.order_id,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    uses: uses.map((u) => ({ ref: u.ref, amount: Number(u.amount), at: u.at, reversed: u.reversed })),
  };
}

// حروف وأرقام مش بتتلخبط في بعض (من غير O و0 و I و1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  const s = Array.from(randomBytes(8), (x) => ALPHABET[x % ALPHABET.length]).join("");
  return `GC-${s.slice(0, 4)}-${s.slice(4)}`;
}

export const supabaseRepo: Repo = {
  kind: "supabase",

  async createOrder(o) {
    const history = [{ at: new Date().toISOString(), status: o.status }];
    let r = await db().from("orders").insert(toRow({ ...o, history })).select("*").single();
    // لو migration البراندات لسه متشغلش (مفيش عمود stock_taken): نحفظ من غيره،
    // والطلب بيرجع stockTaken = true فالمخزون بيتخصم وقت الطلب زي الأول
    if (r.error && /stock_taken|brand_status/.test(r.error.message)) {
      const row = toRow({ ...o, history });
      delete row.stock_taken;
      delete row.brand_status;
      r = await db().from("orders").insert(row).select("*").single();
    }
    return toOrder(check(r));
  },

  async getByToken(token) {
    const r = await db().from("orders").select("*").eq("tracking_token", token).maybeSingle();
    const row = check(r);
    return row ? toOrder(row) : null;
  },

  async getById(id) {
    const r = await db().from("orders").select("*").eq("id", id).maybeSingle();
    const row = check(r);
    return row ? toOrder(row) : null;
  },

  async findByNumberAndPhone(number, phone) {
    const r = await db().from("orders").select("*").eq("number", number).maybeSingle();
    const row = check(r);
    return row && digits(row.sender_phone) === digits(phone) ? toOrder(row) : null;
  },

  async list(f = {}) {
    let q = db().from("orders").select("*").order("number", { ascending: false }).limit(500);
    if (f.status && f.status !== "all") q = q.eq("status", f.status);
    const rows = check(await q) ?? [];
    const term = f.q?.trim().toLowerCase();
    // فلترة اليوم والمنطقة والبحث على الهدايا (jsonb) هنا زي المخزن المحلي
    return rows
      .map(toOrder)
      .filter((o) => !f.date || o.gifts.some((g) => g.deliveryDate === f.date))
      .filter((o) => !f.zoneId || o.gifts.some((g) => g.recipient.zoneId === f.zoneId))
      .filter(
        (o) =>
          !term ||
          String(o.number).includes(term) ||
          o.sender.name.toLowerCase().includes(term) ||
          digits(o.sender.phone).includes(digits(term) || "x") ||
          o.gifts.some((g) => g.recipient.name.toLowerCase().includes(term)),
      );
  },

  async update(id, patch, note) {
    const current = await supabaseRepo.getById(id);
    if (!current) return null;
    const history =
      note?.status || note?.note
        ? [...current.history, { at: new Date().toISOString(), status: note.status ?? patch.status ?? current.status, note: note.note, by: note.by }]
        : undefined;
    const r = await db()
      .from("orders")
      .update(toRow({ ...patch, ...(history ? { history } : {}) }))
      .eq("id", id)
      .select("*")
      .single();
    return toOrder(check(r));
  },

  // السعة بتتاخد من إعدادات قاعدة البيانات (defaultSlotCapacity) جوه الفانكشن
  async reserveSlot(date, period) {
    const r = await db().rpc("reserve_delivery_slot", { p_date: date, p_period: period });
    return Boolean(check(r));
  },

  async releaseSlot(date, period) {
    check(await db().rpc("release_delivery_slot", { p_date: date, p_period: period }));
  },

  async slotUsage(date) {
    const rows = check(await db().from("delivery_slots").select("period, booked").eq("date", date)) ?? [];
    const used = (p: string) => Number(rows.find((r: any) => r.period === p)?.booked ?? 0);
    return { morning: used("morning"), afternoon: used("afternoon"), evening: used("evening") };
  },

  // صور إثبات التحويل في bucket خاص (مش عام)
  async saveFile(name, data) {
    const safe = `${Date.now()}-${name.replace(/[^\w.-]/g, "_")}`;
    const ext = safe.split(".").pop()?.toLowerCase();
    const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    check(await db().storage.from(PROOFS).upload(safe, data, { contentType, upsert: false }));
    return safe;
  },

  async readFile(name) {
    const r = await db().storage.from(PROOFS).download(name);
    if (r.error || !r.data) return null;
    return Buffer.from(await r.data.arrayBuffer());
  },

  async useCoupon(code) {
    check(await db().rpc("use_coupon", { p_code: code }));
  },

  async couponUses(code) {
    const r = await db().from("coupons").select("used_count").eq("code", code).maybeSingle();
    return Number(check(r)?.used_count ?? 0);
  },

  async issueGiftCard(orderId, amount, expiresAt) {
    // لو الكود اتكرر (احتمال ضعيف جداً) بنجرب كود تاني
    for (let i = 0; i < 5; i++) {
      const r = await db()
        .from("gift_cards")
        .insert({ code: newCode(), order_id: orderId, amount, balance: amount, expires_at: expiresAt })
        .select("*")
        .single();
      if (!r.error) return toCard(r.data);
      if (!/duplicate key/i.test(r.error.message)) throw new Error(r.error.message);
    }
    throw new Error("Couldn't create a unique gift card code");
  },

  async getGiftCard(code) {
    const r = await db().from("gift_cards").select("*").eq("code", code).maybeSingle();
    const row = check(r);
    if (!row) return null;
    const uses = check(await db().from("gift_card_uses").select("*").eq("code", code).order("at")) ?? [];
    return toCard(row, uses);
  },

  async redeemGiftCard(code, amount, ref) {
    const r = await db().rpc("redeem_gift_card", { p_code: code, p_amount: amount, p_ref: ref });
    return Boolean(check(r));
  },

  async giftCardBalances() {
    const r = await db().from("gift_cards").select("balance").gt("expires_at", new Date().toISOString()).gt("balance", 0);
    return (check(r) ?? []).reduce((s: number, c: any) => s + Number(c.balance), 0);
  },

  async restoreGiftCard(code, ref) {
    check(await db().rpc("restore_gift_card", { p_code: code, p_ref: ref }));
  },
};
