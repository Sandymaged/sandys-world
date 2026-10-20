"use server";

import { redirect } from "next/navigation";
import { isLocale, localizeHref } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { repo } from "./db";

const MAX_PROOF = 5 * 1024 * 1024;
const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ProofResult = { ok: true } | { ok: false; error: string };

/** العميل بيكتب الرقم المرجعي ويرفع صورة التحويل (FR-61)، والأوردر بيستنى تأكيد صاحبة المتجر (FR-62) */
export async function submitPaymentProof(token: string, locale: string, form: FormData): Promise<ProofResult> {
  const t = translator(isLocale(locale) ? locale : "ar");
  const db = repo();
  const order = await db.getByToken(token);
  if (!order) return { ok: false, error: t("الطلب ده مش موجود") };
  if (order.paymentMethod !== "instapay" || !["awaiting_proof", "rejected"].includes(order.paymentStatus) || order.status === "cancelled") {
    return { ok: false, error: t("الطلب ده مش مستني دفع") };
  }
  const reference = String(form.get("reference") ?? "").trim();
  const file = form.get("proof");
  if (reference.length < 4) return { ok: false, error: t("اكتب الرقم المرجعي للتحويل") };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: t("ارفع صورة التحويل") };
  if (!PROOF_TYPES.includes(file.type)) return { ok: false, error: t("الصورة لازم تكون JPG أو PNG") };
  if (file.size > MAX_PROOF) return { ok: false, error: t("الصورة أكبر من 5 ميجا") };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const saved = await db.saveFile(`proof-${order.number}.${ext}`, Buffer.from(await file.arrayBuffer()));
  await db.update(
    order.id,
    { paymentStatus: "awaiting_confirmation", transferReference: reference.slice(0, 64), proofFile: saved, paymentRejectionReason: null },
    { note: "العميل رفع صورة التحويل" },
  );
  return { ok: true };
}

/** متابعة الطلب برقمه وموبايل المرسل من غير حساب (FR-71) */
export async function trackOrder(locale: string, form: FormData): Promise<{ error: string } | void> {
  const lang = isLocale(locale) ? locale : "ar";
  const t = translator(lang);
  const number = Number(String(form.get("number") ?? "").replace(/\D/g, ""));
  const phone = String(form.get("phone") ?? "");
  if (!number || phone.replace(/\D/g, "").length < 8) return { error: t("اكتب رقم الطلب والموبايل اللي طلبت بيه") };
  const order = await repo().findByNumberAndPhone(number, phone);
  if (!order) return { error: t("ملقيناش طلب بالرقم والموبايل دول") };
  redirect(localizeHref(lang, `/order/${order.token}`));
}
