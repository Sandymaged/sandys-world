import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { adminClient } from "./supabase/admin";

/*
 * حسابات المتجر (للوحة بس، مش بتوصل للعميل أبداً):
 * - تكاليف كل طلب: التوصيل الفعلي لكل منطقة، وتكلفة التغليف للهدية، وعمولة إنستاباي
 * - المصاريف: أي مصروف بتاريخه ونوعه
 * على Supabase: جدولين finance_settings و expenses. من غيره: .data/finance.json و .data/expenses.json
 */

export interface FinanceSettings {
  /** اللي المتجر بيدفعه للمندوب/الشحن لكل منطقة (id المنطقة → جنيه) */
  zoneCosts: Record<string, number>;
  /** تكلفة الورق والعلبة والشريطة والكارت للهدية الواحدة */
  packagingCostPerGift: number;
  /** عمولة إنستاباي على التحويل اللي بيوصلك (٪) وأقصى حد ليها لكل تحويل (صفر = من غير حد) */
  instapayFeeRate: number;
  instapayFeeMax: number;
}

export const DEFAULT_FINANCE: FinanceSettings = { zoneCosts: {}, packagingCostPerGift: 0, instapayFeeRate: 0, instapayFeeMax: 0 };

export interface Expense {
  id: string;
  spentOn: string; // YYYY-MM-DD
  category: string;
  amount: number;
  note: string;
}

export const expenseCategories = ["إعلانات", "خامات تغليف", "إيجار", "رواتب", "تصوير", "مواصلات", "اشتراكات ومواقع", "صيانة", "تاني"];

const DIR = path.join(process.cwd(), ".data");
const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(DIR, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function writeJson(name: string, value: unknown) {
  await mkdir(DIR, { recursive: true });
  const file = path.join(DIR, name);
  await writeFile(`${file}.tmp`, JSON.stringify(value, null, 2), "utf8");
  await rename(`${file}.tmp`, file);
}

// ───────────── التكاليف ─────────────

export async function loadFinance(): Promise<FinanceSettings> {
  let saved: Partial<FinanceSettings> | null = null;
  if (onSupabase()) {
    const { data, error } = await adminClient().from("finance_settings").select("value").eq("key", "costs").maybeSingle();
    // الجدول لسه ما اتعملش (الـ migration): نكمل بالافتراضي
    if (!error) saved = (data?.value as Partial<FinanceSettings>) ?? null;
  } else {
    saved = await readJson<Partial<FinanceSettings> | null>("finance.json", null);
  }
  return { ...DEFAULT_FINANCE, ...saved, zoneCosts: { ...DEFAULT_FINANCE.zoneCosts, ...saved?.zoneCosts } };
}

export async function saveFinance(f: FinanceSettings) {
  if (onSupabase()) {
    const { error } = await adminClient().from("finance_settings").upsert({ key: "costs", value: f });
    if (error) throw new Error(error.message);
    return;
  }
  await writeJson("finance.json", f);
}

// ───────────── المصاريف ─────────────

export async function listExpenses(from?: string, to?: string): Promise<Expense[]> {
  if (onSupabase()) {
    let q = adminClient().from("expenses").select("*").order("spent_on", { ascending: false }).limit(2000);
    if (from) q = q.gte("spent_on", from);
    if (to) q = q.lte("spent_on", to);
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []).map((r) => ({ id: r.id, spentOn: r.spent_on, category: r.category, amount: Number(r.amount), note: r.note ?? "" }));
  }
  const all = await readJson<Expense[]>("expenses.json", []);
  return all.filter((e) => (!from || e.spentOn >= from) && (!to || e.spentOn <= to)).sort((a, b) => b.spentOn.localeCompare(a.spentOn));
}

export async function addExpense(e: Omit<Expense, "id">) {
  if (onSupabase()) {
    const { error } = await adminClient().from("expenses").insert({ spent_on: e.spentOn, category: e.category, amount: e.amount, note: e.note || null });
    if (error) throw new Error(error.message);
    return;
  }
  const all = await readJson<Expense[]>("expenses.json", []);
  all.push({ ...e, id: randomUUID() });
  await writeJson("expenses.json", all);
}

export async function deleteExpense(id: string) {
  if (onSupabase()) {
    const { error } = await adminClient().from("expenses").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const all = await readJson<Expense[]>("expenses.json", []);
  await writeJson(
    "expenses.json",
    all.filter((e) => e.id !== id),
  );
}

/** عمولة إنستاباي على مبلغ */
export const instapayFee = (amount: number, f: FinanceSettings) => {
  const fee = (amount * f.instapayFeeRate) / 100;
  return f.instapayFeeMax > 0 ? Math.min(fee, f.instapayFeeMax) : fee;
};

// ───────────── مناطق التوصيل (للوحة: كلها، حتى المقفولة) ─────────────

export interface AdminZone {
  id: string;
  name: string;
  kind: string;
  fee: number;
  isActive: boolean;
  sort: number;
}

export async function listZonesAdmin(): Promise<AdminZone[]> {
  if (onSupabase()) {
    const { data, error } = await adminClient().from("zones").select("id, name, kind, fee, is_active, sort").order("sort");
    if (error) throw new Error(error.message);
    return (data ?? []).map((z) => ({ id: z.id, name: z.name, kind: z.kind, fee: Number(z.fee), isActive: z.is_active, sort: z.sort }));
  }
  const { zones } = await import("./seed-data");
  return zones.map((z) => ({ id: z.id, name: z.name, kind: z.kind, fee: z.fee, isActive: true, sort: z.sort }));
}

/** رسوم التوصيل اللي العميل بيدفعها، والمنطقة مفتوحة ولا لأ (على Supabase بس) */
export async function updateZones(changes: { id: string; fee: number; isActive: boolean }[]) {
  if (!onSupabase()) return;
  for (const c of changes) {
    const { error } = await adminClient().from("zones").update({ fee: c.fee, is_active: c.isActive }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
