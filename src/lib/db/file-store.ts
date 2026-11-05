import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DeliveryPeriod } from "../types";
import type { GiftCardOrder, GiftCardRecord, OrderRecord, Repo } from "./types";

/*
 * مخزن محلي في ملفات JSON جوه .data — للتجربة على الجهاز قبل ربط Supabase بس.
 * مش بيتشال على الاستضافة (Vercel مبيحفظش ملفات)، والـ Repo بيتحول لـ Supabase لوحده أول ما المفاتيح تتحط.
 */

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");
const UPLOADS = path.join(DIR, "uploads");

interface Data {
  seq: number;
  orders: OrderRecord[];
  slots: Record<string, number>; // "2026-10-20|morning" → المحجوز
  coupons: Record<string, number>; // الكود → عدد مرات الاستخدام
  giftCards?: Record<string, GiftCardRecord>; // الكود → الكارت ورصيده
}

// كل الكتابات ورا بعض عشان طلبين في نفس اللحظة ميكتبوش فوق بعض
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Data> {
  try {
    const d = JSON.parse(await readFile(FILE, "utf8")) as Data;
    // الطلبات القديمة كان فيها كارت واحد (giftCard)، دلوقتي list
    for (const o of d.orders as (OrderRecord & { giftCard?: GiftCardOrder | null })[]) {
      if (o.giftCard) o.giftCards = [o.giftCard];
      delete o.giftCard;
    }
    return d;
  } catch {
    return { seq: 1000, orders: [], slots: {}, coupons: {} };
  }
}

async function save(d: Data) {
  await mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(d, null, 2), "utf8");
  await rename(tmp, FILE);
}

function tx<T>(fn: (d: Data) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const d = await load();
    const out = await fn(d);
    await save(d);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

// حروف وأرقام مش بتتلخبط في بعض (من غير O و0 و I و1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  const b = randomBytes(8);
  const s = Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
  return `GC-${s.slice(0, 4)}-${s.slice(4)}`;
}
const slotKey = (date: string, period: DeliveryPeriod) => `${date}|${period}`;

export const fileRepo: Repo = {
  kind: "file",

  createOrder: (o) =>
    tx((d) => {
      d.seq += 1;
      const rec: OrderRecord = {
        ...o,
        id: randomUUID(),
        number: d.seq,
        token: randomBytes(12).toString("hex"),
        createdAt: new Date().toISOString(),
        history: [{ at: new Date().toISOString(), status: o.status }],
      };
      d.orders.push(rec);
      return rec;
    }),

  getByToken: async (token) => (await load()).orders.find((o) => o.token === token) ?? null,
  getById: async (id) => (await load()).orders.find((o) => o.id === id) ?? null,

  findByNumberAndPhone: async (number, phone) =>
    (await load()).orders.find((o) => o.number === number && digits(o.sender.phone) === digits(phone)) ?? null,

  list: async (f = {}) => {
    const q = f.q?.trim().toLowerCase();
    return (await load()).orders
      .filter((o) => !f.status || f.status === "all" || o.status === f.status)
      .filter((o) => !f.date || o.gifts.some((g) => g.deliveryDate === f.date))
      .filter((o) => !f.zoneId || o.gifts.some((g) => g.recipient.zoneId === f.zoneId))
      .filter(
        (o) =>
          !q ||
          String(o.number).includes(q) ||
          o.sender.name.toLowerCase().includes(q) ||
          digits(o.sender.phone).includes(digits(q) || "x") ||
          o.gifts.some((g) => g.recipient.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.number - a.number);
  },

  update: (id, patch, note) =>
    tx((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (!o) return null;
      Object.assign(o, patch);
      if (note?.status || note?.note) {
        o.history.push({ at: new Date().toISOString(), status: note.status ?? o.status, note: note.note, by: note.by });
      }
      return o;
    }),

  reserveSlot: (date, period, capacity) =>
    tx((d) => {
      const k = slotKey(date, period);
      const used = d.slots[k] ?? 0;
      if (used >= capacity) return false;
      d.slots[k] = used + 1;
      return true;
    }),

  releaseSlot: (date, period) =>
    tx((d) => {
      const k = slotKey(date, period);
      d.slots[k] = Math.max(0, (d.slots[k] ?? 0) - 1);
    }),

  slotUsage: async (date) => {
    const s = (await load()).slots;
    return {
      morning: s[slotKey(date, "morning")] ?? 0,
      afternoon: s[slotKey(date, "afternoon")] ?? 0,
      evening: s[slotKey(date, "evening")] ?? 0,
    };
  },

  saveFile: async (name, data) => {
    await mkdir(UPLOADS, { recursive: true });
    const safe = `${Date.now()}-${name.replace(/[^\w.-]/g, "_")}`;
    await writeFile(path.join(UPLOADS, safe), data);
    return safe;
  },

  readFile: async (name) => {
    try {
      return await readFile(path.join(UPLOADS, path.basename(name)));
    } catch {
      return null;
    }
  },

  useCoupon: (code) =>
    tx((d) => {
      d.coupons[code] = (d.coupons[code] ?? 0) + 1;
    }),

  couponUses: async (code) => (await load()).coupons[code] ?? 0,

  issueGiftCard: (orderId, amount, expiresAt) =>
    tx((d) => {
      d.giftCards ??= {};
      let code = newCode();
      while (d.giftCards[code]) code = newCode();
      const rec: GiftCardRecord = { code, amount, balance: amount, orderId, createdAt: new Date().toISOString(), expiresAt, uses: [] };
      d.giftCards[code] = rec;
      return rec;
    }),

  getGiftCard: async (code) => (await load()).giftCards?.[code] ?? null,

  redeemGiftCard: (code, amount, ref) =>
    tx((d) => {
      const c = d.giftCards?.[code];
      if (!c || amount <= 0 || c.balance < amount || Date.parse(c.expiresAt) < Date.now()) return false;
      c.balance -= amount;
      c.uses.push({ ref, amount, at: new Date().toISOString() });
      return true;
    }),

  giftCardBalances: async () =>
    Object.values((await load()).giftCards ?? {})
      .filter((c) => Date.parse(c.expiresAt) > Date.now())
      .reduce((s, c) => s + c.balance, 0),

  restoreGiftCard: (code, ref) =>
    tx((d) => {
      const c = d.giftCards?.[code];
      const use = c?.uses.find((u) => u.ref === ref && !u.reversed);
      if (!c || !use) return;
      use.reversed = true;
      c.balance += use.amount;
    }),
};
