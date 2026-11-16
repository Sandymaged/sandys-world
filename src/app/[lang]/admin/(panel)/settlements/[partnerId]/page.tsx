import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton } from "@/components/admin/action-form";
import { money } from "@/components/admin/ui";
import { MonthTierCard } from "@/components/brand/bits";
import { statusLabel } from "@/lib/admin-format";
import { requireAdmin } from "@/lib/admin-auth";
import { addPayoutAction, deletePayoutAction } from "@/lib/brand-admin-actions";
import { brandStatement, isDue } from "@/lib/brand-portal";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "كشف حساب علامة تجارية" };

const day = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Cairo" });

export default async function AdminSettlement({ params }: PageProps<"/[lang]/admin/settlements/[partnerId]">) {
  await requireAdmin();
  const { partnerId } = await params;
  const partner = (await loadCatalogData()).partners.find((p) => p.id === partnerId);
  if (!partner) notFound();
  const st = await brandStatement(partnerId);
  const rows = st.orders.filter((o) => o.status !== "cancelled");
  const card = "bg-[#fffdf8] p-4 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/settlements" className="text-sm text-muted hover:text-brand">← حسابات البراندات</Link>
        <h1 className="text-3xl text-brand">{partner.name}</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${card} !bg-blush`}>
          <p className="text-sm text-ink-2">مطلوب تحويله الآن</p>
          <p className="tabular mt-1 font-heading text-3xl text-brand">{money(st.balance)}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-ink-2">المستحق</p>
          <p className="tabular mt-1 font-heading text-3xl text-brand">{money(st.due)}</p>
          <p className="text-xs text-muted">مبيعات {money(st.sales)} · عمولتك {money(st.commission)}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-ink-2">حُوِّل له</p>
          <p className="tabular mt-1 font-heading text-3xl text-brand">{money(st.paid)}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-ink-2">يُستحق لاحقاً</p>
          <p className="tabular mt-1 font-heading text-3xl text-brand">{money(st.holding + st.pending)}</p>
          <p className="text-xs text-muted">في مدة الاسترجاع {money(st.holding)} · قيد التنفيذ {money(st.pending)}</p>
        </div>
      </div>

      <MonthTierCard p={st.progress} />

      <section className={`${card} space-y-4 !p-5`}>
        <h2 className="text-xl text-brand">تسجيل تحويل بمبلغ آخر</h2>
        <ActionForm action={addPayoutAction.bind(null, partnerId)} submitLabel="تسجيل التحويل" resetOnSuccess className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <div>
            <label className="label" htmlFor="amount">المبلغ</label>
            <input id="amount" name="amount" type="number" step="0.01" min="0" className="field" defaultValue={st.balance > 0 ? st.balance : ""} required />
          </div>
          <div>
            <label className="label" htmlFor="paidAt">التاريخ</label>
            <input id="paidAt" name="paidAt" type="date" className="field" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="label" htmlFor="method">الطريقة</label>
            <input id="method" name="method" className="field" placeholder="إنستاباي، نقداً…" />
          </div>
          <div>
            <label className="label" htmlFor="note">ملاحظة</label>
            <input id="note" name="note" className="field" />
          </div>
        </ActionForm>
        {st.payouts.length > 0 && (
          <ul className="divide-y divide-dashed divide-line border-t border-line pt-2">
            {st.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
                <span className="tabular font-semibold text-brand">{money(p.amount)}</span>
                <span>{day(p.paidAt)}</span>
                {p.method && <span className="text-ink-2">{p.method}</span>}
                {p.note && <span className="text-muted">{p.note}</span>}
                <span className="ms-auto">
                  <ConfirmButton action={deletePayoutAction.bind(null, p.id)} confirm="حذف هذا التحويل؟" label="حذف" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} !p-5`}>
        <h2 className="text-xl text-brand">الطلبات</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">لا توجد طلبات بعد.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 text-start font-medium">الطلب</th>
                  <th className="py-2 text-start font-medium">المنتجات</th>
                  <th className="py-2 text-start font-medium">الحالة</th>
                  <th className="py-2 text-end font-medium">المبيعات</th>
                  <th className="py-2 text-end font-medium">نصيبها</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-line">
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2">
                      <Link href={`/admin/orders/${o.id}`} className="tabular font-semibold text-brand hover:underline">#{o.number}</Link>
                    </td>
                    <td className="py-2 text-ink-2">{o.lines.map((l) => `${l.quantity}× ${l.name}`).join("، ")}</td>
                    <td className="py-2">
                      {o.status === "delivered" ? (isDue(o) ? "مستحق ✓" : `يستحق ${day(o.dueAt!)}`) : statusLabel[o.status]}
                      {o.open && o.handedAt && <span className="block text-xs text-success">سُلِّم للمتجر</span>}
                    </td>
                    <td className="tabular py-2 text-end">{money(o.gross)}</td>
                    <td className="tabular py-2 text-end font-semibold">{money(o.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
