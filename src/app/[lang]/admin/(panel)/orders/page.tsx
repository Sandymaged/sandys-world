import Link from "next/link";
import { Empty, OrderRow } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { proofWaiting, statusLabel } from "@/lib/admin-format";
import { getStorefront } from "@/lib/catalog";
import { expireUnpaid, repo } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/types";

export const instant = false;

export const metadata = { title: "الطلبات" };

const statuses = Object.keys(statusLabel) as OrderStatus[];

/** قائمة الأوردرات بفلترة بالحالة ويوم التوصيل والمنطقة (FR-100) */
export default async function AdminOrders({ searchParams }: PageProps<"/[lang]/admin/orders">) {
  await requireAdmin();
  await expireUnpaid();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  const rawStatus = one(sp.status);
  // «proof»: طلبات رفعت صورة التحويل ومستنية مراجعتك (جوه «بانتظار الدفع»)
  const proofOnly = rawStatus === "proof";
  const nopayOnly = rawStatus === "nopay";
  const status = proofOnly || nopayOnly ? "awaiting_payment" : ((rawStatus as OrderStatus | undefined) ?? undefined);
  const date = one(sp.date);
  const zoneId = one(sp.zone);
  const q = one(sp.q);
  const [listed, sf, waiting] = await Promise.all([
    repo().list({ status: status ?? "all", date, zoneId, q }),
    getStorefront(),
    repo().list({ status: "awaiting_payment" }),
  ]);
  // صور التحويل اللي مستنية مراجعة بتطلع فوق، والفلتر بيفصل النوعين
  const orders = (proofOnly ? listed.filter(proofWaiting) : nopayOnly ? listed.filter((o) => !proofWaiting(o)) : listed)
    .map((o, i) => ({ o, i }))
    .sort((a, b) => Number(proofWaiting(b.o)) - Number(proofWaiting(a.o)) || a.i - b.i)
    .map((x) => x.o);
  const proofCount = waiting.filter(proofWaiting).length;

  return (
    <div className="space-y-5">
      {proofCount > 0 && !proofOnly && (
        <Link href="/admin/orders?status=proof" className="flex items-center justify-between gap-3 bg-brand p-4 text-white shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)] hover:opacity-90">
          <span className="font-semibold">
            <span className="tabular">{proofCount}</span> {proofCount === 1 ? "طلب رفع صورة التحويل وينتظر مراجعتك" : "طلبات رفعت صورة التحويل وتنتظر مراجعتك"}
          </span>
          <span className="text-sm underline underline-offset-4">اعرضها ←</span>
        </Link>
      )}
      <form className="grid gap-3 bg-[#fffdf8] p-4 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)] sm:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="رقم الطلب، الاسم، الهاتف" className="field sm:col-span-2" />
        <select name="status" defaultValue={rawStatus ?? ""} className="field">
          <option value="">كل الحالات</option>
          <option value="proof">صورة التحويل وصلت، راجعها</option>
          <option value="nopay">بانتظار الدفع (دون صورة تحويل)</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
        <input type="date" name="date" defaultValue={date} className="field tabular" aria-label="يوم التوصيل" />
        <select name="zone" defaultValue={zoneId ?? ""} className="field">
          <option value="">كل المناطق</option>
          {sf.zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <div className="flex gap-2 sm:col-span-5">
          <button className="btn-primary btn-sm">تصفية</button>
          <Link href="/admin/orders" className="btn-outline btn-sm">مسح الفلاتر</Link>
          <span className="ms-auto self-center text-sm text-muted">{orders.length} طلب</span>
        </div>
      </form>

      {orders.length ? (
        <div className="shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {orders.map((o) => (
            <OrderRow key={o.id} o={o} />
          ))}
        </div>
      ) : (
        <Empty>لا توجد طلبات مطابقة لهذا الفلتر.</Empty>
      )}
    </div>
  );
}
