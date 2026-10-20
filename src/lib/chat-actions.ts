"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { requireAdmin } from "./admin-auth";
import { MAX_MESSAGE, MAX_MESSAGES_PER_ORDER } from "./chat";
import { repo } from "./db";
import type { OrderMessage } from "./db/types";

export type ChatResult = { ok: true } | { ok: false; error: string };

async function append(orderId: string, from: OrderMessage["from"], body: string, extra: { storeReadAt?: string; customerReadAt?: string }) {
  const db = repo();
  const order = await db.getById(orderId);
  if (!order) return false;
  const messages = order.messages ?? [];
  if (messages.length >= MAX_MESSAGES_PER_ORDER) return false;
  const msg: OrderMessage = { id: randomUUID(), at: new Date().toISOString(), from, body };
  await db.update(orderId, { messages: [...messages, msg], ...extra });
  return true;
}

/** العميل بيكتب من صفحة طلبه (اللينك السري بتاع الطلب هو اللي بيثبت إنه صاحبه) */
export async function sendCustomerMessage(token: string, locale: string, body: string): Promise<ChatResult> {
  const t = translator(isLocale(locale) ? locale : "ar");
  const text = body.trim().slice(0, MAX_MESSAGE);
  if (!text) return { ok: false, error: t("اكتب رسالتك") };
  const order = await repo().getByToken(token);
  if (!order) return { ok: false, error: t("الطلب ده مش موجود") };
  const ok = await append(order.id, "customer", text, { customerReadAt: new Date().toISOString() });
  if (!ok) return { ok: false, error: t("مقدرناش نبعت الرسالة، كلمنا على واتساب") };
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

/** العميل فتح الشات: رسايل المتجر بقت مقروءة */
export async function markCustomerRead(token: string) {
  const db = repo();
  const order = await db.getByToken(token);
  if (order && (order.messages ?? []).some((m) => m.from === "store")) await db.update(order.id, { customerReadAt: new Date().toISOString() });
}

/** صاحبة المتجر بترد من اللوحة */
export async function sendStoreMessage(orderId: string, body: string): Promise<ChatResult> {
  await requireAdmin();
  const text = body.trim().slice(0, MAX_MESSAGE);
  if (!text) return { ok: false, error: "اكتبي الرسالة" };
  const ok = await append(orderId, "store", text, { storeReadAt: new Date().toISOString() });
  if (!ok) return { ok: false, error: "الرسالة ماتبعتتش" };
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

/** صاحبة المتجر فتحت الأوردر: رسايل العميل بقت مقروءة */
export async function markStoreRead(orderId: string) {
  await requireAdmin();
  const db = repo();
  const order = await db.getById(orderId);
  if (order && (order.messages ?? []).some((m) => m.from === "customer")) await db.update(orderId, { storeReadAt: new Date().toISOString() });
}
