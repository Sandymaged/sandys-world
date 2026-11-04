import Link from "next/link";
import { Empty, OrderRow, StatCard, money } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { brandOrderOf } from "@/lib/brand-portal";
import { unreadForStore } from "@/lib/chat";
import { formatDay } from "@/lib/format";
import { loadCatalogData } from "@/lib/db/catalog-store";
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
  const catalog = await loadCatalogData();
  const toReview = catalog.products.filter((p) => p.reviewStatus === "pending");
  // البراندات اللي عدّى آخر يوم يسلّموا فيه ولسه مسلّموش
  const late = active.flatMap((o) =>
    catalog.partners.flatMap((p) => {
      const bo = brandOrderOf(o, p.id, catalog);
      return bo?.late ? [{ order: o, brand: p.name, handBy: bo.handBy }] : [];
    }),
  );
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
      {late.length > 0 && (
        <section className="rounded-2xl border border-brand/40 bg-brand-soft/60 p-4 text-sm">
          <p className="font-semibold text-brand-dark">⏰ براندات متأخرة في التسليم</p>
          <ul className="mt-2 space-y-1">
            {late.map((l) => (
              <li key={`${l.order.id}-${l.brand}`}>
                <Link href={`/admin/orders/${l.order.id}`} className="hover:text-brand">
                  <b>{l.brand}</b> · أوردر <span className="tabular">#{l.order.number}</span> · كان آخره {formatDay(l.handBy)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {toReview.length > 0 && (
        <Link href="/admin/catalog/products" className="block rounded-2xl border border-line bg-[#fffdf8] p-4 text-sm hover:bg-brand-soft/40">
          🛍️ فيه <b className="tabular">{toReview.length}</b> منتج جديد من البراندات مستني موافقتك
        </Link>
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
