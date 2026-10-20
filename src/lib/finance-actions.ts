"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { repo } from "./db";
import type { OrderRefund } from "./db/types";
import { addExpense, deleteExpense, listZonesAdmin, loadFinance, saveFinance, updateZones } from "./finance";

export type FinanceResult = { ok: true } | { ok: false; error: string };

const num = (f: FormData, k: string) => Number(String(f.get(k) ?? "").replace(/,/g, "").trim());
const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

/** مصروف جديد */
export async function addExpenseAction(f: FormData): Promise<FinanceResult> {
  await requireAdmin();
  const amount = num(f, "amount");
  const spentOn = str(f, "spentOn") || new Date().toISOString().slice(0, 10);
  const category = str(f, "category", 40) || "تاني";
  if (!(amount > 0)) return { ok: false, error: "اكتبي المبلغ" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) return { ok: false, error: "التاريخ مش مظبوط" };
  try {
    await addExpense({ spentOn, category, amount: Math.round(amount * 100) / 100, note: str(f, "note", 300) });
  } catch (e) {
    return { ok: false, error: `ماتحفظش: ${e instanceof Error ? e.message : ""}` };
  }
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

export async function deleteExpenseAction(id: string): Promise<FinanceResult> {
  await requireAdmin();
  try {
    await deleteExpense(id);
  } catch (e) {
    return { ok: false, error: `ماتمسحش: ${e instanceof Error ? e.message : ""}` };
  }
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

/** تكاليف التوصيل والتغليف وعمولة إنستاباي، ورسوم التوصيل للعميل وفتح/قفل المناطق */
export async function saveCostsAction(f: FormData): Promise<FinanceResult> {
  await requireAdmin();
  const [current, zones] = await Promise.all([loadFinance(), listZonesAdmin()]);
  const zoneCosts: Record<string, number> = {};
  const changes: { id: string; fee: number; isActive: boolean }[] = [];
  for (const z of zones) {
    const cost = num(f, `zc_${z.id}`);
    if (cost > 0) zoneCosts[z.id] = Math.round(cost);
    const fee = num(f, `zf_${z.id}`);
    const isActive = f.get(`za_${z.id}`) === "on";
    if ((Number.isFinite(fee) && fee >= 0 && fee !== z.fee) || isActive !== z.isActive) {
      changes.push({ id: z.id, fee: Number.isFinite(fee) && fee >= 0 ? Math.round(fee) : z.fee, isActive });
    }
  }
  try {
    await saveFinance({
      ...current,
      zoneCosts,
      packagingCostPerGift: Math.max(0, Math.round(num(f, "packagingCostPerGift") || 0)),
      instapayFeeRate: Math.max(0, Math.min(10, num(f, "instapayFeeRate") || 0)),
      instapayFeeMax: Math.max(0, Math.round(num(f, "instapayFeeMax") || 0)),
    });
    await updateZones(changes);
  } catch (e) {
    return { ok: false, error: `ماتحفظش: ${e instanceof Error ? e.message : ""}` };
  }
  if (changes.length) updateTag("catalog");
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

const refundKinds: Record<OrderRefund["kind"], string> = {
  refund: "فلوس رجعت للعميل",
  compensation: "تعويض",
  return: "مرتجع",
};

/** مرتجع أو تعويض أو فلوس رجعت للعميل على أوردر (بيتخصم من المكسب في التقارير) */
export async function addRefundAction(orderId: string, f: FormData): Promise<FinanceResult> {
  await requireAdmin();
  const amount = num(f, "amount");
  const kind = (str(f, "kind") as OrderRefund["kind"]) || "refund";
  const reason = str(f, "reason", 300);
  if (!(amount > 0)) return { ok: false, error: "اكتبي المبلغ" };
  if (!refundKinds[kind]) return { ok: false, error: "اختاري النوع" };
  if (!reason) return { ok: false, error: "اكتبي السبب" };
  const db = repo();
  const order = await db.getById(orderId);
  if (!order) return { ok: false, error: "الأوردر مش موجود" };
  const refund: OrderRefund = { at: new Date().toISOString(), kind, amount: Math.round(amount), reason };
  await db.update(orderId, { refunds: [...(order.refunds ?? []), refund] }, { note: `${refundKinds[kind]} ${refund.amount} ج.م: ${reason}`, by: "admin" });
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}
