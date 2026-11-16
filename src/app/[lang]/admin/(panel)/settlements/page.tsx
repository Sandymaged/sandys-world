import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { Empty, money } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { payBalanceAction } from "@/lib/brand-admin-actions";
import { tierLine } from "@/components/brand/bits";
import { allStatements, HOLD_DAYS } from "@/lib/brand-portal";
import { FREE_PIECES } from "@/lib/commission";

export const instant = false;

export const metadata = { title: "حسابات البراندات" };

const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("ar-EG", { day: "numeric", month: "short", timeZone: "Africa/Cairo" });

/**
 * التحويلات للبراندات: لكل براند المطلوب تحويله دلوقتي، وجنبه «✓ حوّلت» بيسجّل التحويل بالمبلغ ده
 * فالحساب بيتصفّى أول بأول. الطلب بيستحق بعد التسليم للعميل بـ HOLD_DAYS أيام.
 */
export default async function AdminSettlements() {
  await requireAdmin();
  const rows = (await allStatements()).filter((r) => r.s.orders.length || r.s.payouts.length);
  const toPay = rows.filter((r) => r.s.balance > 0).sort((a, b) => b.s.balance - a.s.balance);
  const settled = rows.filter((r) => r.s.balance <= 0);
  const total = toPay.reduce((s, r) => s + r.s.balance, 0);
  const soon = rows.reduce((s, r) => s + r.s.holding + r.s.pending, 0);
  const card = "bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-brand">حسابات البراندات</h1>
        <p className="mt-1 text-sm leading-6 text-ink-2">
          نصيب العلامة التجارية = سعر منتجاتها ناقص عمولتك. العمولة بالشرائح كل شهر: أول (متوسط أسعارها × {FREE_PIECES}) مجاناً، وبعدها 10% ثم 15% ثم 20%. يُستحق النصيب بعد تسليم الطلب للعميل بـ {HOLD_DAYS} أيام. حوّل للعلامة التجارية واضغط «✓ تم التحويل» بجانبها، ويُصفّى الحساب تلقائياً.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-blush p-4 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          <p className="text-sm text-ink-2">مطلوب تحويله الآن</p>
          <p className="tabular mt-1 font-heading text-4xl text-brand">{money(total)}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-sm text-ink-2">يُستحق قريباً (في مدة الاسترجاع أو قيد التنفيذ)</p>
          <p className="tabular mt-1 font-heading text-4xl text-brand">{money(soon)}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl text-ink">بحاجة إلى تحويل ({toPay.length})</h2>
        {toPay.length === 0 ? (
          <Empty>حسابات كل العلامات التجارية مسوّاة ✓</Empty>
        ) : (
          <ul className={`divide-y divide-dashed divide-line ${card}`}>
            {toPay.map((r) => (
              <li key={r.partnerId} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
                <div className="min-w-40 flex-1">
                  <Link href={`/admin/settlements/${r.partnerId}`} className="font-semibold text-brand hover:underline">{r.name}</Link>
                  <p className="text-xs text-muted">
                    {tierLine(r.progress)} · آخر تحويل: {r.s.lastPaidAt ? day(r.s.lastPaidAt) : "لا يوجد"}
                    {r.s.holding + r.s.pending > 0 && <> · يُستحق لاحقاً {money(r.s.holding + r.s.pending)}</>}
                  </p>
                </div>
                <p className="tabular font-heading text-3xl text-brand">{money(r.s.balance)}</p>
                <ActionForm action={payBalanceAction.bind(null, r.partnerId)} submitLabel="✓ تم التحويل" doneLabel="تم التسجيل ✓" className="flex flex-wrap items-center gap-2">
                  <input name="method" aria-label="طريقة التحويل" placeholder="إنستاباي، نقداً…" className="field h-10 w-36 text-sm" />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      {settled.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl text-ink">حساباتها مسوّاة</h2>
          <ul className={`divide-y divide-dashed divide-line ${card}`}>
            {settled.map((r) => (
              <li key={r.partnerId} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm">
                <Link href={`/admin/settlements/${r.partnerId}`} className="min-w-40 flex-1 font-semibold hover:text-brand">{r.name}</Link>
                <span className="text-muted">حُوِّل لها {money(r.s.paid)}{r.s.lastPaidAt && <> · آخر مرة {day(r.s.lastPaidAt)}</>}</span>
                {r.s.holding + r.s.pending > 0 && <span className="text-ink-2">يُستحق لاحقاً {money(r.s.holding + r.s.pending)}</span>}
                {r.s.balance < 0 && <span className="text-success">مدفوع زيادة {money(-r.s.balance)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
