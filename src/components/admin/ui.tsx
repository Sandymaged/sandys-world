import Link from "next/link";
import { unreadForStore } from "@/lib/chat";
import { statusLabel, statusTone } from "@/lib/admin-format";
import type { OrderRecord, OrderStatus } from "@/lib/db/types";

export const money = (n: number) => `${n.toLocaleString("en-US")} ج.م`;

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusTone[status]}`}>{statusLabel[status]}</span>;
}

export function StatCard({ label, value, href, tone = "bg-[#fffdf8]" }: { label: string; value: number | string; href?: string; tone?: string }) {
  const body = (
    <div className={`h-full p-4 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)] ${tone}`}>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="tabular mt-1 font-heading text-4xl text-brand">{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block transition-transform hover:-translate-y-0.5">{body}</Link> : body;
}

export function OrderRow({ o }: { o: OrderRecord }) {
  const dates = [...new Set(o.gifts.map((g) => g.deliveryDate))].join("، ");
  return (
    <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-dashed border-line bg-[#fffdf8] px-4 py-3 last:border-0 hover:bg-brand-soft/40">
      <span className="tabular w-14 font-heading text-xl text-brand">#{o.number}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{o.sender.name}</span>
        <span className="block truncate text-xs text-muted">
          {[
            o.gifts.length === 1 ? `لـ ${o.gifts[0].recipient.name} · ${o.gifts[0].recipient.zoneName}` : o.gifts.length > 1 ? `${o.gifts.length} هدايا` : "",
            (o.giftCards ?? []).length === 1
              ? `🎁 بطاقة هدية${o.giftCards![0].asGift && o.giftCards![0].toName ? ` لـ ${o.giftCards![0].toName}` : ""}`
              : (o.giftCards ?? []).length > 1
                ? `🎁 ${o.giftCards!.length} بطاقات هدايا`
                : "",
          ]
            .filter(Boolean)
            .join(" + ")}
          {dates && <> · <span className="tabular">{dates}</span></>}
        </span>
      </span>
      {unreadForStore(o) > 0 && (
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">💬 {unreadForStore(o)} رسالة جديدة</span>
      )}
      <span className="tabular text-sm font-semibold">{money(o.totals.total)}</span>
      <StatusBadge status={o.status} />
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="bg-[#fffdf8] p-8 text-center text-muted">{children}</p>;
}
