"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { changeBrandPassword, endBrandSession, requireBrand, signInBrand } from "./brand-auth";
import { markHanded } from "./brand-portal";
import { removeProduct, upsertProduct, type SaveResult } from "./catalog-form";

/* الأكشنز بتاعة بوابة البراند: كل واحد بيتأكد من الجلسة الأول، وبيشتغل على منتجات وطلبات البراند ده بس */

type Result = { ok: true } | { ok: false; error: string };

export async function brandLogin(_: unknown, form: FormData): Promise<{ error: string } | void> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "أدخل البريد الإلكتروني وكلمة المرور" };
  const r = await signInBrand(email, password);
  if (!r.ok) return { error: r.error };
  redirect("/brand");
}

export async function brandLogout() {
  await endBrandSession();
  redirect("/brand/login");
}

export async function saveBrandProduct(id: string | null, f: FormData): Promise<SaveResult> {
  const s = await requireBrand();
  const r = await upsertProduct(id, f, { by: "brand", partnerId: s.partnerId });
  if (r.ok) updateTag("catalog");
  return r;
}

export async function deleteBrandProduct(id: string): Promise<SaveResult> {
  const s = await requireBrand();
  const r = await removeProduct(id, { by: "brand", partnerId: s.partnerId });
  if (r.ok) updateTag("catalog");
  return r;
}

export async function setHandedAction(orderId: string, handed: boolean): Promise<Result> {
  const s = await requireBrand();
  return markHanded(orderId, s.partnerId, s.partner.name, handed);
}

export async function changePasswordAction(f: FormData): Promise<Result> {
  const s = await requireBrand();
  const current = String(f.get("current") ?? "");
  const next = String(f.get("next") ?? "");
  if (next !== String(f.get("confirm") ?? "")) return { ok: false, error: "كلمة المرور الجديدة لا تطابق التأكيد" };
  return changeBrandPassword(s, current, next);
}
