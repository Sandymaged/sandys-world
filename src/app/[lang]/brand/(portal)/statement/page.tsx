import { money } from "@/components/admin/ui";
import { Box, MonthTierCard, shortDate, Stat } from "@/components/brand/bits";
import { statusLabel } from "@/lib/admin-format";
import { requireBrand } from "@/lib/brand-auth";
import { brandStatement, HOLD_DAYS, isDue } from "@/lib/brand-portal";

export const instant = false;

export const metadata = { title: "حسابي مع المتجر" };

/** كشف حساب البراند: نصيبه من كل طلب، والتحويلات اللي وصلته، والباقي */
export default async function BrandStatementPage() {
  const s = await requireBrand();
  const st = await brandStatement(s.partnerId);
  const rows = st.orders.filter((o) => o.status !== "cancelled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-brand">حسابي مع المتجر</h1>
        <p className="mt-1 text-sm leading-6 text-ink-2">
          نصيبك = سعر منتجاتك ناقص عمولة المتجر، والعمولة بالشرايح تحت. الفلوس بتستحق بعد ما الطلب يتسلم للعميل بـ {HOLD_DAYS} أيام، والمتجر بيحوّلها بشكل دوري.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="مستحق ليك دلوقتي" value={money(st.balance)} tone="bg-blush" />
        <Stat label="في مدة الاسترجاع" value={money(st.holding)} hint={`بيستحق بعد التسليم بـ ${HOLD_DAYS} أيام`} />
        <Stat label="وصلك من المتجر" value={money(st.paid)} />
        <Stat label="لسه في الشغل" value={money(st.pending)} hint={`مبيعات اتسلمت ${money(st.sales)} · عمولة ${money(st.commission)}`} />
      </div>

      <MonthTierCard p={st.progress} />

      <Box>
        <h2 className="text-xl text-ink">التحويلات اللي وصلتك</h2>
        {st.payouts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">لسه مفيش تحويلات.</p>
        ) : (
          <ul className="mt-3 divide-y divide-dashed divide-line">
            {st.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className="tabular font-semibold text-brand">{money(p.amount)}</span>
                <span className="text-ink-2">{shortDate(p.paidAt)}</span>
                {p.method && <span className="text-ink-2">{p.method}</span>}
                {p.note && <span className="text-muted">{p.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </Box>

      <Box>
        <h2 className="text-xl text-ink">الطلبات</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">لسه مفيش طلبات.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 text-start font-medium">الطلب</th>
                  <th className="py-2 text-start font-medium">الحالة</th>
                  <th className="py-2 text-start font-medium">التاريخ</th>
                  <th className="py-2 text-end font-medium">المبيعات</th>
                  <th className="py-2 text-end font-medium">نصيبك</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-line">
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="tabular py-2 font-semibold">#{o.number}</td>
                    <td className="py-2">{o.status === "delivered" ? (isDue(o) ? "مستحق ✓" : `يستحق ${shortDate(o.dueAt!)}`) : statusLabel[o.status]}</td>
                    <td className="py-2 text-ink-2">{shortDate(o.deliveredAt ?? o.deliveryDate)}</td>
                    <td className="tabular py-2 text-end">{money(o.gross)}</td>
                    <td className="tabular py-2 text-end font-semibold text-brand">{money(o.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Box>
    </div>
  );
}
