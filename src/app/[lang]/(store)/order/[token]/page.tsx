import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { GiftCardArt } from "@/components/gift-card-art";
import { CopyButton, ProofForm } from "@/components/order-client";
import { OrderChat } from "@/components/order-chat";
import { markCustomerRead, sendCustomerMessage } from "@/lib/chat-actions";
import { PageHeader, StickyNote } from "@/components/scrapbook";
import { getLocale, getT } from "@/i18n/server";
import { getStorefront } from "@/lib/catalog";
import { repo } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/types";
import { periodLabel } from "@/lib/delivery";
import { waLink } from "@/lib/admin-format";
import { egp, formatDay } from "@/lib/format";
import { GIFT_CARD_VALID_DAYS, giftCardShareText } from "@/lib/gift-card";
import { STORE_NAME } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("طلبك"), robots: { index: false } };
}

// مراحل الطلب زي ما العميل بيشوفها (FR-101)
const steps: { status: OrderStatus; label: string }[] = [
  { status: "new", label: "اتأكد" },
  { status: "preparing", label: "بيتجهز" },
  { status: "ready", label: "جاهز" },
  { status: "out_for_delivery", label: "خرج للتوصيل" },
  { status: "delivered", label: "اتسلم" },
];
const rank: Record<OrderStatus, number> = {
  awaiting_payment: -1,
  new: 0,
  awaiting_design_approval: 0,
  preparing: 1,
  ready: 2,
  out_for_delivery: 3,
  delivery_failed: 3,
  delivered: 4,
  cancelled: -2,
};

export default function OrderPage({ params }: PageProps<"/[lang]/order/[token]">) {
  return (
    <Suspense fallback={<div className="container-x py-20"><div className="mx-auto h-64 max-w-xl animate-pulse bg-surface" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getT();
  const locale = await getLocale();
  const order = await repo().getByToken(token);
  if (!order) notFound();
  const settings = (await getStorefront()).settings;

  const ip = {
    address: process.env.INSTAPAY_ADDRESS || settings.instapay.address,
    link: process.env.INSTAPAY_LINK || settings.instapay.link,
    name: process.env.INSTAPAY_NAME || settings.instapay.holderName,
  };
  const waitingProof = order.paymentMethod === "instapay" && ["awaiting_proof", "rejected"].includes(order.paymentStatus) && order.status !== "cancelled";
  const qr = waitingProof && ip.link ? await QRCode.toDataURL(ip.link, { margin: 1, width: 220, color: { dark: "#6e1423", light: "#fffdf8" } }) : null;
  const due = order.paymentDueAt
    ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG-u-nu-latn", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(order.paymentDueAt))
    : null;
  const current = rank[order.status];
  const cards = order.giftCards ?? [];
  const cardsSum = cards.reduce((x, c) => x + c.amount, 0);
  // طلب كروت هدايا بس (من غير هدايا بتتوصل)
  const cardOnly = order.gifts.length === 0 && cards.length > 0;
  const redeliveryFees = (order.gifts[0]?.redeliveries ?? []).reduce((s, r) => s + r.fee, 0);
  const h = await headers();
  const site = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}${locale === "en" ? "/en" : ""}`;
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" });
  const sentFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" });
  // رسالة الكارت اللي المشتري يبعتها بنفسه. لو إحنا اللي بنبعته، الكود مش بيظهر للمشتري خالص
  // (عشان يوصل للي جاتله الهدية بس، ومحدش يستخدمه قبله)
  const shared = cards.map((gc) => {
    const expires = gc.expiresAt ? dateFmt.format(new Date(gc.expiresAt)) : null;
    const cardUrl = gc.code && !gc.asGift ? `${site}/card/${gc.code}` : "";
    const text = cardUrl ? giftCardShareText(t, { ...gc, amountLabel: egp(gc.amount, t), store: t(STORE_NAME), link: cardUrl, expires }) : "";
    return { gc, expires, text, cardUrl, sent: gc.sentAt ? sentFmt.format(new Date(gc.sentAt)) : null };
  });
  const cardsSection =
    cards.length > 0 ? (
      <section className="card p-5 sm:p-6">
        <h2 className="text-2xl">{cards.every((c) => c.code) ? (cards.length > 1 ? t("كروت الهدايا جاهزة!") : t("كارت الهدية جاهز!")) : cards.length > 1 ? t("كروت الهدايا") : t("كارت الهدية")}</h2>
        {cards.some((c) => !c.code && !c.asGift) && (
          <p className="mt-3 rounded-xl bg-butter-soft p-3 text-sm text-butter">
            {order.paymentStatus === "awaiting_confirmation"
              ? t("استلمنا صورة التحويل وبنراجعها. أول ما نتأكد هيظهر الكود هنا ويتبعت على واتساب.")
              : t("أول ما الدفع يتأكد هيظهر الكود هنا ويتبعت على واتساب.")}
          </p>
        )}
        <ul className="mt-4 divide-y divide-dashed divide-line">
          {shared.map(({ gc, expires, text, cardUrl, sent }, i) => (
            <li key={gc.code ?? i} className="space-y-2 py-4 first:pt-0 last:pb-0">
              <p className="text-sm text-ink-2">
                <b className="tabular text-ink">{egp(gc.amount, t)}</b> ·{" "}
                {gc.asGift ? t("هيتبعت لـ {name} على واتساب", { name: gc.toName }) : t("الكود ليك تبعته بنفسك")}
              </p>
              {gc.asGift && (
                <>
                  {/* مراحل الكارت: الدفع يتأكد ← بنجهّزه ← اتبعت */}
                  <p className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${sent ? "bg-success-soft text-success" : "bg-butter-soft text-butter"}`}>
                    {sent ? <Icon name="check" className="size-5 shrink-0" /> : <Icon name="clock" className="size-5 shrink-0" />}
                    {sent
                      ? t("اتبعت على واتساب لـ {name} {when}", { name: gc.toName, when: sent })
                      : gc.code
                        ? t("بنجهّزه ونبعته لـ {name} على واتساب.", { name: gc.toName })
                        : t("هيتبعت لـ {name} على واتساب أول ما الدفع يتأكد.", { name: gc.toName })}
                  </p>
                  <p className="text-xs leading-5 text-muted">
                    {t("الكود بيوصل لـ {name} بس، عشان يفضل مفاجأة ومحدش غيره يستخدمه.", { name: gc.toName })}{" "}
                    {t("الكارت صالح {days} أيام بس من يوم ما يتبعت، فقول لـ {name} يستخدمه بسرعة.", { days: GIFT_CARD_VALID_DAYS, name: gc.toName })}
                  </p>
                </>
              )}
              {!gc.asGift && sent && (
                <p className="flex items-center gap-2 text-sm font-semibold text-success">
                  <Icon name="check" className="size-5" />
                  {t("اتبعتلك على واتساب {when}", { when: sent })}
                </p>
              )}
              {!gc.asGift && !gc.code && <p className="text-xs leading-5 text-muted">{t("الكارت صالح {days} أيام بس من يوم ما يتبعت، ابعته واستخدمه بسرعة.", { days: GIFT_CARD_VALID_DAYS })}</p>}
              {gc.code && !gc.asGift && (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="tabular font-heading text-2xl tracking-[0.12em] text-brand select-all" dir="ltr">{gc.code}</p>
                    <CopyButton value={gc.code} />
                  </div>
                  {expires && <p className="text-sm font-semibold text-brand">{t("صالح {days} أيام بس، لحد {date}", { days: GIFT_CARD_VALID_DAYS, date: expires })}</p>}
                  <a href={cardUrl} className="btn btn-sm me-2 border border-ink/15 bg-bg text-ink hover:border-brand hover:text-brand">
                    {t("شوف الكارت")}
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="btn btn-sm bg-success text-white hover:opacity-90">
                    {t("ابعته على واتساب")}
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div>
      <PageHeader
        tone={order.status === "cancelled" ? "grid" : "pink"}
        kicker={t("شكراً يا {name}!", { name: order.sender.name.split(" ")[0] })}
        title={t("طلب رقم #{n}", { n: order.number })}
        subtitle={t("احفظ اللينك ده عشان تتابع طلبك، أو تابعه برقم الطلب وموبايلك.")}
      />

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="space-y-8">
          {/* الحالة */}
          {order.status === "cancelled" ? (
            <StickyNote tone="pink" rotate={-1}>
              <p className="font-heading text-2xl text-brand">{t("الطلب ده اتلغى")}</p>
              <p className="mt-1 text-sm text-ink-2">{order.history.at(-1)?.note ?? t("لو ده غلط كلمنا على واتساب.")}</p>
            </StickyNote>
          ) : order.status === "delivery_failed" ? (
            <StickyNote tone="butter" rotate={-1}>
              <p className="font-heading text-2xl text-brand">{t("مقدرناش نوصّل الهدية")}</p>
              <p className="mt-1 text-sm text-ink-2">{t("هنكلمك نحدد ميعاد تاني. المحاولة التانية في نفس اليوم ببلاش، ولو في يوم تاني بتبقى برسوم توصيل جديدة.")}</p>
            </StickyNote>
          ) : cardOnly ? (
            cardsSection
          ) : (
            <section className="card p-5 pt-6">
              <h2 className="text-2xl text-ink">{t("حالة الطلب")}</h2>
              <ol className="mt-5 grid grid-cols-5 gap-1 text-center">
                {steps.map((s, i) => {
                  const done = current >= i;
                  return (
                    <li key={s.status} className="relative">
                      {i > 0 && <span className={`absolute top-4 h-0.5 w-full -translate-x-1/2 rtl:translate-x-1/2 ${current >= i ? "bg-brand" : "bg-line"}`} style={{ insetInlineStart: 0 }} />}
                      <span className={`relative mx-auto grid size-8 place-items-center rounded-full border-2 ${done ? "border-brand bg-brand text-white" : "border-line bg-bg text-muted"}`}>
                        {done ? <Icon name="check" className="size-4" /> : <span className="tabular text-xs">{i + 1}</span>}
                      </span>
                      <span className={`mt-1.5 block text-[11px] leading-4 ${done ? "font-semibold text-brand" : "text-muted"}`}>{t(s.label)}</span>
                    </li>
                  );
                })}
              </ol>
              {order.status === "awaiting_payment" && (
                <p className="mt-4 rounded-xl bg-butter-soft p-3 text-sm text-butter">
                  {order.paymentStatus === "awaiting_confirmation"
                    ? t("استلمنا صورة التحويل وبنراجعها. أول ما نتأكد هيوصلك تأكيد على واتساب والطلب يدخل التجهيز.")
                    : t("الطلب محجوز ومستني الدفع.")}
                </p>
              )}
            </section>
          )}

          {!cardOnly && order.status !== "cancelled" && cardsSection}

          {/* الدفع بإنستاباي */}
          {waitingProof && (
            <section className="rounded-3xl border border-line bg-paper p-6 shadow-[0_18px_36px_-28px_rgb(60_30_20/0.45)]">
              <h2 className="text-3xl text-ink">{t("ادفع بإنستاباي")}</h2>
              {order.paymentStatus === "rejected" && (
                <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">
                  {t("التحويل اللي فات ماتأكدش: {reason}", { reason: order.paymentRejectionReason ?? "" })}
                </p>
              )}
              <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted">{t("المبلغ المطلوب بالظبط")}</p>
                    <div className="flex items-center gap-3">
                      <p className="tabular font-heading text-4xl text-brand">{egp(order.totals.total, t)}</p>
                      <CopyButton value={String(order.totals.total)} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted">{t("عنوان إنستاباي (IPA)")}</p>
                    {ip.address ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="tabular text-lg font-semibold select-all" dir="ltr">{ip.address}</p>
                        <CopyButton value={ip.address} />
                      </div>
                    ) : (
                      <p className="text-sm text-butter">{t("عنوان إنستاباي لسه متحطش في الإعدادات.")}</p>
                    )}
                    {ip.name && <p className="text-xs text-ink-2">{t("باسم: {name}", { name: ip.name })}</p>}
                  </div>
                  {ip.link && (
                    <a href={ip.link} target="_blank" rel="noreferrer" className="btn border-2 border-brand bg-bg text-brand hover:bg-brand-soft">
                      {t("افتح لينك الدفع")}
                    </a>
                  )}
                </div>
                {qr && (
                  <div className="polaroid mx-auto w-44 rotate-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- QR متولد كـ data URL */}
                    <img src={qr} alt={t("كود QR للدفع")} className="aspect-square w-full" />
                    <p className="mt-1 text-center font-script text-sm text-ink-2">{t("امسح الكود")}</p>
                  </div>
                )}
              </div>
              {due && <p className="mt-5 text-sm text-ink-2">{t("لازم الدفع يتأكد قبل {time}، وإلا الطلب بيتلغي والميعاد بيتفك.", { time: due })}</p>}
              <hr className="my-6 border-dashed border-line" />
              <h3 className="font-semibold">{t("بعد ما تحوّل")}</h3>
              <div className="mt-3">
                <ProofForm token={order.token} />
              </div>
            </section>
          )}
          {/* الشات مع المتجر */}
          <OrderChat
            messages={order.messages ?? []}
            side="customer"
            send={sendCustomerMessage.bind(null, order.token, locale)}
            markRead={markCustomerRead.bind(null, order.token)}
            title={t("كلمنا عن طلبك")}
            placeholder={t("اكتب سؤالك أو أي حاجة عايز تغيّرها…")}
          />
        </div>

        {/* الهدايا والإجمالي */}
        <aside className="space-y-6 lg:sticky lg:top-36">
          {cards.map((gc, i) => (
            <div key={gc.code ?? i} className="space-y-3">
              <GiftCardArt
                design={gc.design}
                amount={gc.amount}
                amountLabel={egp(gc.amount, t)}
                title={t("كارت هدية")}
                storeName={t(STORE_NAME)}
                toName={gc.asGift && gc.toName ? t("لـ {name}", { name: gc.toName }) : undefined}
                code={gc.asGift ? null : gc.code}
                className={i % 2 ? "rotate-1" : "-rotate-1"}
              />
              {gc.asGift && gc.message && <p className="px-2 font-script text-xl leading-8 text-ink-2">«{gc.message}»{gc.fromName && ` — ${gc.fromName}`}</p>}
            </div>
          ))}
          {order.gifts.map((g) => (
            <div key={g.id} className={`card p-4 pt-5`}>
              <p className="font-heading text-xl text-brand">{g.title}</p>
              <p className="text-xs text-muted">{g.items.map((it) => `${it.name}${it.optionsText ? ` (${it.optionsText})` : ""}${it.quantity > 1 ? ` × ${it.quantity}` : ""}`).join(" · ")}</p>
              <p className="mt-2 text-sm">
                {t("لـ {name}", { name: g.recipient.name })} · {g.recipient.zoneName}
              </p>
              <p className="text-sm text-ink-2">
                {formatDay(g.deliveryDate, t)} · {periodLabel(g.deliveryPeriod, settings, t)}
              </p>
            </div>
          ))}
          <div className="rounded-3xl border border-line bg-paper p-6 shadow-[0_18px_36px_-28px_rgb(60_30_20/0.45)]">
            <dl className="space-y-1.5 text-sm">
              {order.gifts.length > 0 && <div className="flex justify-between"><dt className="text-ink-2">{t("الهدايا")}</dt><dd className="tabular">{egp(order.totals.items - cardsSum, t)}</dd></div>}
              {cardsSum > 0 && <div className="flex justify-between"><dt className="text-ink-2">{cards.length > 1 ? t("كروت الهدايا") : t("كارت الهدية")}</dt><dd className="tabular">{egp(cardsSum, t)}</dd></div>}
              {order.totals.packaging > 0 && <div className="flex justify-between"><dt className="text-ink-2">{t("تغليف وتنسيق")}</dt><dd className="tabular">{egp(order.totals.packaging, t)}</dd></div>}
              {order.gifts.length > 0 && <div className="flex justify-between"><dt className="text-ink-2">{t("التوصيل")}</dt><dd className="tabular">{egp(order.totals.delivery - redeliveryFees, t)}</dd></div>}
              {redeliveryFees > 0 && <div className="flex justify-between"><dt className="text-ink-2">{t("توصيل تاني في يوم تاني")}</dt><dd className="tabular">{egp(redeliveryFees, t)}</dd></div>}
              {order.totals.discount > 0 && <div className="flex justify-between text-success"><dt>{t("الخصم")}</dt><dd className="tabular">− {egp(order.totals.discount, t)}</dd></div>}
              {(order.totals.giftCard ?? 0) > 0 && <div className="flex justify-between text-success"><dt>{t("كارت هدية")}</dt><dd className="tabular">− {egp(order.totals.giftCard ?? 0, t)}</dd></div>}
              <div className="flex justify-between border-t border-dashed border-butter/40 pt-2 font-heading text-xl text-brand"><dt>{t("الإجمالي")}</dt><dd className="tabular">{egp(order.totals.total, t)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-ink-2">{order.totals.total === 0 ? t("اتدفع بكارت هدية") : order.paymentMethod === "cod" ? t("الدفع كاش عند الاستلام") : t("الدفع بإنستاباي")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
