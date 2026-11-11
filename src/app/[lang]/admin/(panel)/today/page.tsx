import Link from "next/link";
import { StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { getStorefront } from "@/lib/catalog";
import { expireUnpaid, repo, today, tomorrow } from "@/lib/db";
import { periodLabel } from "@/lib/delivery";
import { formatDay } from "@/lib/format";

export const instant = false;

export const metadata = { title: "شغل التجهيز والتوصيل" };

/** شاشة "شغل النهارده" (FR-102): كل اللي لازم يتجهز ويتوصل النهارده وبكرة، مرتبين بالفترة */
export default async function AdminToday() {
  await requireAdmin();
  await expireUnpaid();
  const [orders, sf] = await Promise.all([repo().list(), getStorefront()]);
  const live = orders.filter((o) => !["cancelled", "delivered"].includes(o.status));
  const days = [today(), tomorrow()];

  return (
    <div className="space-y-10">
      {days.map((d, di) => {
        const rows = live.flatMap((o) => o.gifts.filter((g) => g.deliveryDate === d).map((g) => ({ o, g })));
        return (
          <section key={d}>
            <h1 className="text-3xl text-brand">
              {di === 0 ? "النهارده" : "بكرة"} <span className="text-lg text-muted">{formatDay(d)}</span>
            </h1>
            {rows.length === 0 && <p className="mt-2 bg-[#fffdf8] p-5 text-muted">مفيش هدايا.</p>}
            {sf.settings.periods.map((p) => {
              const list = rows.filter((r) => r.g.deliveryPeriod === p.id);
              if (!list.length) return null;
              return (
                <div key={p.id} className="mt-4">
                  <h2 className="mb-2 font-heading text-xl text-lilac">
                    {periodLabel(p.id, sf.settings)} <span className="tabular text-sm text-muted">({list.length})</span>
                  </h2>
                  <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
                    {list.map(({ o, g }) => (
                      <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                        <Link href={`/admin/orders/${o.id}`} className="tabular w-14 font-heading text-lg text-brand">#{o.number}</Link>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{g.title}</span>
                          <span className="block text-xs text-muted">
                            لـ {g.recipient.name} · {g.recipient.zoneName}
                            {g.items.some((it) => it.customization || it.customImage) && " · فيه تخصيص"}
                            {g.surprise && " · مفاجأة"}
                          </span>
                        </span>
                        {o.status === "awaiting_payment" && <span className="text-xs font-semibold text-butter">الدفع لسه</span>}
                        <StatusBadge status={o.status} />
                        <Link href={`/admin/orders/${o.id}/print`} className="text-xs text-brand underline">طباعة</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
