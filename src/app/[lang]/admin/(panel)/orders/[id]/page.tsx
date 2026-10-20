import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentPanel, StatusButtons } from "@/components/admin/order-actions";
import { StatusBadge, money } from "@/components/admin/ui";
import { GiftCardArt } from "@/components/gift-card-art";
import { requireAdmin } from "@/lib/admin-auth";
import { paymentLabel, waLink, waMessages } from "@/lib/admin-format";
import { getStorefront } from "@/lib/catalog";
import { repo } from "@/lib/db";
import { periodLabel } from "@/lib/delivery";
import { formatDay } from "@/lib/format";
import { giftCardDesigns } from "@/lib/gift-card";
import { STORE_NAME } from "@/lib/settings";

export const instant = false;

export const metadata = { title: "تفاصيل الأوردر" };

const when = (iso: string) =>
  new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(iso));

export default async function AdminOrder({ params }: PageProps<"/[lang]/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await repo().getById(id);
  if (!order) notFound();
  const settings = (await getStorefront()).settings;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const orderUrl = `${origin}${order.locale === "en" ? "/en" : ""}/order/${order.token}`;
  const msgs = waMessages(order, orderUrl);
  const gc = order.giftCard ?? null;
  const card = gc?.code ? await repo().getGiftCard(gc.code) : null;
  const siteUrl = `${origin}${order.locale === "en" ? "/en" : ""}`;
  const gcMessage = gc?.code
    ? [
        gc.asGift && gc.message ? `«${gc.message}»${gc.fromName ? ` — ${gc.fromName}` : ""}` : null,
        `كارت هدية من ${STORE_NAME} بقيمة ${money(gc.amount)}`,
        `الكود: ${gc.code}`,
        `اختار هديتك من ${siteUrl} واكتب الكود وإنت بتدفع.`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="text-sm text-muted hover:text-brand">← الأوردرات</Link>
        <h1 className="tabular text-4xl text-brand">#{order.number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">اتعمل {when(order.createdAt)}</span>
        <Link href={`/admin/orders/${order.id}/print`} className="btn-outline btn-sm ms-auto">طباعة الكروت والأوراق</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {gc && (
            <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
              <h2 className="text-2xl text-brand">كارت هدية · <span className="tabular">{money(gc.amount)}</span></h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_1.1fr] sm:items-center">
                <GiftCardArt design={gc.design} amount={gc.amount} amountLabel={money(gc.amount)} title="كارت هدية" storeName={STORE_NAME} code={gc.code} />
                <div className="space-y-1.5 text-sm">
                  <p>الشكل: <b>{giftCardDesigns.find((d) => d.id === gc.design)?.label}</b></p>
                  {gc.asGift ? (
                    <>
                      <p>هدية لـ <b>{gc.toName}</b> · <span className="tabular" dir="ltr">{gc.toPhone}</span></p>
                      {gc.fromName && <p>من: {gc.fromName}</p>}
                      {gc.message && <p className="font-script text-lg leading-7 text-lilac">«{gc.message}»</p>}
                    </>
                  ) : (
                    <p className="text-muted">للمشتري نفسه</p>
                  )}
                  {gc.code ? (
                    <>
                      <p className="pt-2">الكود: <b className="tabular tracking-wider" dir="ltr">{gc.code}</b></p>
                      {card && <p>الرصيد الباقي: <b className="tabular">{money(card.balance)}</b> من {money(card.amount)}</p>}
                      <a href={waLink(gc.asGift && gc.toPhone ? gc.toPhone : order.sender.phone, gcMessage)} target="_blank" rel="noreferrer" className="chip mt-2 border-success bg-success-soft text-success hover:bg-success hover:text-white">
                        {gc.asGift ? `ابعت الكارت لـ ${gc.toName} على واتساب` : "ابعت الكود للمشتري على واتساب"}
                      </a>
                    </>
                  ) : (
                    <p className="pt-2 text-butter">الكود هيتعمل أول ما تأكدي الدفع.</p>
                  )}
                </div>
              </div>
            </section>
          )}
          {order.gifts.map((g, i) => (
            <section key={g.id} className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl text-brand">هدية {i + 1}: {g.title}</h2>
                <span className="tabular text-sm font-semibold">{formatDay(g.deliveryDate)} · {periodLabel(g.deliveryPeriod, settings)}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {g.items.map((it) => (
                  <li key={it.productId} className="flex justify-between gap-3">
                    <span>
                      {it.name} {it.quantity > 1 && <span className="tabular text-muted">× {it.quantity}</span>}
                      {it.isAddon && <span className="text-xs text-lilac"> (إضافة)</span>}
                      {it.customization && <span className="mt-0.5 block rounded bg-butter-soft px-2 text-butter">✎ {it.customization}</span>}
                    </span>
                    {it.unitPrice > 0 && <span className="tabular text-muted">{money(it.unitPrice * it.quantity)}</span>}
                  </li>
                ))}
              </ul>
              {g.people && <p className="mt-2 text-sm">العدد: <b className="tabular">{g.people}</b>{g.names && <span className="block whitespace-pre-line text-xs text-ink-2">الأسماء: {g.names}</span>}</p>}
              <div className="mt-4 grid gap-3 border-t border-dashed border-line pt-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-semibold">المستلم: {g.recipient.name}</p>
                  <p className="tabular" dir="ltr">{g.recipient.phone}</p>
                  <p>{g.recipient.zoneName} — {g.recipient.address}</p>
                  {g.recipient.landmark && <p className="text-muted">علامة: {g.recipient.landmark}</p>}
                  {g.recipient.locationUrl && <a href={g.recipient.locationUrl} target="_blank" rel="noreferrer" className="text-brand underline">اللوكيشن</a>}
                </div>
                <div className="space-y-1">
                  {g.cardMessage && <p className="font-script text-lg leading-7 text-lilac">«{g.cardMessage}»</p>}
                  <p className="flex flex-wrap gap-1.5 text-xs">
                    {g.hidePrice && <span className="rounded-full bg-surface px-2 py-0.5">متكتبش السعر</span>}
                    {g.surprise && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">مفاجأة: متكلمش المستلم</span>}
                    {g.wantsDeliveryPhoto && <span className="rounded-full bg-success-soft px-2 py-0.5 text-success">عايز صورة التسليم</span>}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6">
          <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            <h2 className="text-xl text-brand">الحالة</h2>
            <StatusButtons id={order.id} status={order.status} />
          </section>

          <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            <h2 className="text-xl text-brand">الدفع</h2>
            <p className="mt-1 text-sm">{order.paymentMethod === "cod" ? "كاش عند الاستلام" : "إنستاباي"} · <b>{paymentLabel[order.paymentStatus]}</b></p>
            {order.paymentMethod === "instapay" && (
              <PaymentPanel
                id={order.id}
                status={order.paymentStatus}
                reference={order.transferReference}
                proofUrl={order.proofFile ? `/admin/files/${order.proofFile}` : null}
                total={order.totals.total}
              />
            )}
            <dl className="mt-4 space-y-1 border-t border-dashed border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">الهدايا</dt><dd className="tabular">{money(order.totals.items)}</dd></div>
              {order.totals.packaging > 0 && <div className="flex justify-between"><dt className="text-muted">تغليف</dt><dd className="tabular">{money(order.totals.packaging)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">التوصيل</dt><dd className="tabular">{money(order.totals.delivery)}</dd></div>
              {order.totals.discount > 0 && <div className="flex justify-between text-success"><dt>خصم {order.couponCode}</dt><dd className="tabular">− {money(order.totals.discount)}</dd></div>}
              {(order.totals.giftCard ?? 0) > 0 && <div className="flex justify-between text-success"><dt>كارت هدية {order.giftCardUse?.code}</dt><dd className="tabular">− {money(order.totals.giftCard ?? 0)}</dd></div>}
              <div className="flex justify-between font-heading text-xl text-brand"><dt>الإجمالي</dt><dd className="tabular">{money(order.totals.total)}</dd></div>
            </dl>
          </section>

          <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            <h2 className="text-xl text-brand">المرسل</h2>
            <p className="mt-1 text-sm font-semibold">{order.sender.name}</p>
            <p className="tabular text-sm" dir="ltr">{order.sender.phone}</p>
            {order.sender.email && <p className="text-sm text-muted" dir="ltr">{order.sender.email}</p>}
            <p className="mt-3 text-xs text-muted">رسايل واتساب جاهزة (بتفتح واتساب برسالة مكتوبة):</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["تأكيد الدفع", msgs.confirmed],
                ["التحويل اترفض", msgs.rejected],
                ["جاهز + صورة", msgs.ready],
                ["خرج للتوصيل", msgs.out],
                ["اتسلم + صورة", msgs.delivered],
              ].map(([label, text]) => (
                <a key={label} href={waLink(order.sender.phone, text)} target="_blank" rel="noreferrer" className="chip border-success bg-success-soft text-success hover:bg-success hover:text-white">
                  {label}
                </a>
              ))}
            </div>
          </section>

          <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            <h2 className="text-xl text-brand">السجل</h2>
            <ol className="mt-2 space-y-1.5 text-xs">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="tabular shrink-0 text-muted">{when(h.at)}</span>
                  <span>{h.note ?? ""} <StatusBadge status={h.status} /></span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
