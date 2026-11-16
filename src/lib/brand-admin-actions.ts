"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { createBrandAccount, deleteBrandAccount, resetBrandPassword } from "./brand-auth";
import { addPayout, brandStatement, deletePayout } from "./brand-portal";
import { loadCatalogData } from "./db/catalog-store";

/* حسابات البراندات من لوحة المتجر: عمل الحساب، وكلمة سر جديدة، والمسح، وتسجيل التحويلات */

type Result = { ok: true } | { ok: false; error: string };
type PasswordResult = { ok: true; email: string; password: string } | { ok: false; error: string };

const refresh = () => revalidatePath("/[lang]/admin", "layout");

export async function createBrandAccountAction(_: unknown, f: FormData): Promise<PasswordResult> {
  await requireAdmin();
  const partnerId = String(f.get("partnerId") ?? "");
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  if (!(await loadCatalogData()).partners.some((p) => p.id === partnerId)) return { ok: false, error: "اختر العلامة التجارية" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "الإيميل مش مظبوط" };
  const r = await createBrandAccount(partnerId, email);
  if (!r.ok) return r;
  refresh();
  return { ok: true, email, password: r.password };
}

export async function resetBrandPasswordAction(userId: string, email: string): Promise<PasswordResult> {
  await requireAdmin();
  const r = await resetBrandPassword(userId);
  return r.ok ? { ok: true, email, password: r.password } : r;
}

export async function deleteBrandAccountAction(userId: string): Promise<Result> {
  await requireAdmin();
  const r = await deleteBrandAccount(userId);
  if (r.ok) refresh();
  return r;
}

export async function addPayoutAction(partnerId: string, f: FormData): Promise<Result> {
  await requireAdmin();
  const amount = Number(String(f.get("amount") ?? "").replace(/,/g, ""));
  const paidAt = String(f.get("paidAt") ?? "") || new Date().toISOString().slice(0, 10);
  if (!(amount > 0)) return { ok: false, error: "أدخل المبلغ" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) return { ok: false, error: "التاريخ غير صحيح" };
  try {
    await addPayout({
      partnerId,
      amount: Math.round(amount * 100) / 100,
      paidAt,
      method: String(f.get("method") ?? "").trim().slice(0, 60),
      note: String(f.get("note") ?? "").trim().slice(0, 300),
    });
  } catch (e) {
    return { ok: false, error: `تعذّر الحفظ: ${e instanceof Error ? e.message : ""}` };
  }
  refresh();
  return { ok: true };
}

/** «✓ حوّلت»: بيسجّل تحويل بالمطلوب للبراند دلوقتي بالظبط (بيتحسب على السيرفر وقت الدوس) */
export async function payBalanceAction(partnerId: string, f: FormData): Promise<Result> {
  await requireAdmin();
  const { balance } = await brandStatement(partnerId);
  if (!(balance > 0)) return { ok: false, error: "لا توجد مستحقات لهذه العلامة التجارية الآن" };
  try {
    await addPayout({
      partnerId,
      amount: balance,
      paidAt: new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }),
      method: String(f.get("method") ?? "").trim().slice(0, 60),
      note: "تصفية الحساب",
    });
  } catch (e) {
    return { ok: false, error: `تعذّر الحفظ: ${e instanceof Error ? e.message : ""}` };
  }
  refresh();
  return { ok: true };
}

export async function deletePayoutAction(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await deletePayout(id);
  } catch (e) {
    return { ok: false, error: `تعذّر الحذف: ${e instanceof Error ? e.message : ""}` };
  }
  refresh();
  return { ok: true };
}
