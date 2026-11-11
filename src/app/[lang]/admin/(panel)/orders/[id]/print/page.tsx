import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { money } from "@/components/admin/ui";
import { Bow } from "@/components/decor";
import { requireAdmin } from "@/lib/admin-auth";
import { getStorefront } from "@/lib/catalog";
import { repo } from "@/lib/db";
import { periodLabel } from "@/lib/delivery";
import { formatDay } from "@/lib/format";
import { STORE_NAME } from "@/lib/settings";

export const instant = false;

export const metadata = { title: "طباعة" };

/** طباعة كارت الرسالة وورقة التجهيز وورقة المندوب لكل هدية (FR-103) */
export default async function PrintOrder({ params }: PageProps<"/[lang]/admin/orders/[id]/print">) {
  await requireAdmin();
  const { id } = await params;
  const order = await repo().getById(id);
  if (!order) notFound();
  const settings = (await getStorefront()).settings;
  const cod = order.paymentMethod === "cod";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="text-sm text-muted hover:text-brand">← الأوردر #{order.number}</Link>
        <PrintButton />
      </div>

      {order.gifts.map((g, i) => (
        <div key={g.id} className="space-y-6 break-after-page">
          {/* كارت الرسالة */}
          {g.cardMessage && (
            <section className="mx-auto flex aspect-[3/2] max-w-md flex-col items-center justify-center border-2 border-brand bg-[#fffdf8] p-8 text-center">
              <Bow className="w-16 text-brand" />
              <p className="mt-4 font-script text-2xl leading-10 whitespace-pre-line text-ink">{g.cardMessage}</p>
            </section>
          )}

          {/* ورقة التجهيز */}
          <section className="border border-dashed border-ink/40 bg-white p-6 text-sm">
            <h2 className="text-xl">ورقة تجهيز · #{order.number} · هدية {i + 1}</h2>
            <p className="mt-1 font-semibold">{g.title}</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              {g.items.map((it) => (
                <li key={it.productId}>
                  {it.name} × <span className="tabular">{it.quantity}</span>
                  {it.optionsText && <span> ({it.optionsText})</span>}
                  {it.customization && <b> — يتكتب: «{it.customization}»</b>}
                  {it.customImage && <b> — عليه صورة العميل</b>}
                </li>
              ))}
            </ul>
            {g.people && <p className="mt-2">العدد: <b className="tabular">{g.people}</b>{g.names && <span className="block whitespace-pre-line">الأسماء على الكروت:{"\n"}{g.names}</span>}</p>}
            <p className="mt-3">{g.hidePrice ? "⚠ متحطش أي سعر في الهدية" : ""}</p>
            <p>التوصيل: <b>{formatDay(g.deliveryDate)} · {periodLabel(g.deliveryPeriod, settings)}</b></p>
          </section>

          {/* ورقة المندوب */}
          <section className="border border-dashed border-ink/40 bg-white p-6 text-sm">
            <h2 className="text-xl">ورقة توصيل · {STORE_NAME} · #{order.number}</h2>
            <p className="mt-2 text-lg font-semibold">{g.recipient.name}</p>
            <p className="tabular text-lg" dir="ltr">{g.recipient.phone}</p>
            <p>{g.recipient.zoneName} — {g.recipient.address}</p>
            {g.recipient.landmark && <p>علامة مميزة: {g.recipient.landmark}</p>}
            {g.recipient.locationUrl && <p dir="ltr" className="break-all">{g.recipient.locationUrl}</p>}
            <p className="mt-2">الفترة: <b>{formatDay(g.deliveryDate)} · {periodLabel(g.deliveryPeriod, settings)}</b></p>
            {g.surprise && <p className="font-bold">⚠ مفاجأة: متكلمش المستلم غير وإنت قدام الباب</p>}
            {g.wantsDeliveryPhoto && <p>📷 صوّر الهدية مع المستلم وقت التسليم</p>}
            <p className="mt-2 text-base font-bold">{cod ? `تحصيل كاش: ${money(order.totals.total)}` : "مدفوع، متحصّلش حاجة"}</p>
          </section>
        </div>
      ))}
    </div>
  );
}
