import { Empty, OrderRow, StatCard, money } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { unreadForStore } from "@/lib/chat";
import { expireUnpaid, repo, today, tomorrow } from "@/lib/db";
import { cairoNow } from "@/lib/delivery";

export const instant = false;

export default async function AdminHome() {
  await requireAdmin();
  await expireUnpaid();
  const all = await repo().list();
  const active = all.filter((o) => o.status !== "cancelled");
  const d0 = today();
  const giftsOn = (d: string) => active.flatMap((o) => o.gifts.filter((g) => g.deliveryDate === d)).length;
  const pending = all.filter((o) => o.paymentStatus === "awaiting_confirmation" && o.status !== "cancelled");
  const fresh = all.filter((o) => o.status === "new");
  const withMessages = all.filter((o) => unreadForStore(o) > 0);
  const todaySales = active
    .filter((o) => cairoNow(new Date(o.createdAt)).date === d0 && o.status !== "awaiting_payment")
    .reduce((s, o) => s + o.totals.total, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="مدفوعات مستنية تأكيدك" value={pending.length} href="/admin/payments" tone={pending.length ? "bg-[#fff1b8]" : undefined} />
        <StatCard label="أوردرات جديدة" value={fresh.length} href="/admin/orders?status=new" />
        <StatCard label="هدايا توصل النهارده" value={giftsOn(d0)} href="/admin/today" />
        <StatCard label="هدايا توصل بكرة" value={giftsOn(tomorrow())} href="/admin/today" />
      </div>
      {withMessages.length > 0 && (
        <section className="rounded-2xl border-2 border-brand bg-brand-soft/50 p-4">
          <h2 className="font-heading text-xl text-brand">💬 رسايل جديدة من العملاء ({withMessages.length})</h2>
          <div className="mt-3 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            {withMessages.slice(0, 6).map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </div>
        </section>
      )}
      <p className="text-sm text-ink-2">
        مبيعات النهارده (المؤكدة): <b className="tabular text-brand">{money(todaySales)}</b>
      </p>

      <section>
        <h2 className="mb-3 text-2xl text-brand">آخر الأوردرات</h2>
        {all.length ? (
          <div className="shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            {all.slice(0, 8).map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </div>
        ) : (
          <Empty>لسه مفيش أوردرات. أول ما حد يطلب من الموقع هيظهر هنا.</Empty>
        )}
      </section>
    </div>
  );
}
