import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { OrderChat } from "@/components/order-chat";
import { markStoreRead, sendStoreMessage } from "@/lib/chat-actions";
import { GiftCardSendButtons, PaymentPanel, RedeliveryPanel, StatusButtons } from "@/components/admin/order-actions";
import { StatusBadge, money } from "@/components/admin/ui";
import { GiftCardArt } from "@/components/gift-card-art";
import { requireAdmin } from "@/lib/admin-auth";
import { paymentLabel, waLink, waMessages } from "@/lib/admin-format";
import { getStorefront } from "@/lib/catalog";
import { repo } from "@/lib/db";
import { addDays, cairoNow, periodLabel } from "@/lib/delivery";
import { brandOrderOf } from "@/lib/brand-portal";
import { loadCatalogData } from "@/lib/db/catalog-store";
import { addRefundAction } from "@/lib/finance-actions";
import { egp, formatDay } from "@/lib/format";
import { giftCardDesigns, giftCardShareText } from "@/lib/gift-card";
import { translator } from "@/i18n/t";
import { STORE_NAME } from "@/lib/settings";

export const instant = false;

export const metadata = { title: "تفاصيل الأوردر" };

const refundLabel = { refund: "فلوس رجعت", compensation: "تعويض", return: "مرتجع" } as const;

const when = (iso: string) =>
  new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(iso));

export default async function AdminOrder({ params }: PageProps<"/[lang]/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await repo().getById(id);
  if (!order) notFound();
  const storefront = await getStorefront();
  const settings = storefront.settings;
  const zone = storefront.zones.find((z) => z.id === order.gifts[0]?.recipient.zoneId);
  const catalog = await loadCatalogData();
  // كل براند منتجاته في الطلب ده: سلّم ولا لأ
  const brands = catalog.partners.map((p) => ({ p, bo: brandOrderOf(order, p.id, catalog) })).filter((x) => x.bo);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const orderUrl = `${origin}${order.locale === "en" ? "/en" : ""}/order/${order.token}`;
  const msgs = waMessages(order, orderUrl);
  // كروت الهدايا اللي في الطلب، ورصيد كل واحد بعد ما اتعمل
  const siteUrl = `${origin}${order.locale === "en" ? "/en" : ""}`;
  const cards = await Promise.all(
    (order.giftCards ?? []).map(async (gc) => ({
      gc,
      record: gc.code ? await repo().getGiftCard(gc.code) : null,
      cardUrl: gc.code ? `${siteUrl}/card/${gc.code}` : "",
      message: gc.code
        ? giftCardShareText(translator(order.locale), {
            ...gc,
            amountLabel: egp(gc.amount, translator(order.locale)),
            store: translator(order.locale)(STORE_NAME),
            link: `${siteUrl}/card/${gc.code}`,
            expires: gc.expiresAt ? new Intl.DateTimeFormat(order.locale === "en" ? "en-GB" : "ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" }).format(new Date(gc.expiresAt)) : null,
          })
        : "",
    })),
  );

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
          {cards.map(({ gc, record: card, message: gcMessage, cardUrl }) => (
            <section key={gc.code ?? `${gc.design}-${gc.amount}-${gc.toPhone}`} className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
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
                    <p className="text-muted">الكود للمشتري، وهو هيبعته بنفسه</p>
                  )}
                  {gc.code ? (
                    <>
                      <p className="pt-2">الكود: <b className="tabular tracking-wider" dir="ltr">{gc.code}</b></p>
                      {card && <p>الرصيد الباقي: <b className="tabular">{money(card.balance)}</b> من {money(card.amount)}</p>}
                      <GiftCardSendButtons
                        id={order.id}
                        code={gc.code}
                        waHref={waLink(gc.asGift && gc.toPhone ? gc.toPhone : order.sender.phone, gcMessage)}
                        label={gc.asGift ? `ابعت الكارت لـ ${gc.toName} على واتساب` : "ابعت الكارت للمشتري على واتساب"}
                        sentAt={gc.sentAt ?? null}
                        sentLabel={gc.sentAt ? `اتبعت ${when(gc.sentAt)}` : null}
                      />
                      <a href={cardUrl} target="_blank" rel="noreferrer" className="chip border-line bg-white text-ink-2 hover:border-brand hover:text-brand">
                        صفحة الكارت (صور)
                      </a>
                      <p className="text-xs text-muted">
                        الرسالة فيها لينك صفحة الكارت. من الموبايل تقدري تفتحي الصفحة وتبعتي الكارت صورتين (الوش والضهر).
                        {gc.asGift && " المشتري مش بيشوف الكود، بيشوف بس إنه اتبعت."}
                      </p>
                    </>
                  ) : (
                    <p className="pt-2 text-butter">الكود هيتعمل أول ما تأكدي الدفع.</p>
                  )}
                </div>
              </div>
            </section>
          ))}
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
                      {it.optionsText && <span className="mt-0.5 block text-xs font-semibold text-lilac">{it.optionsText}</span>}
                      {it.isAddon && <span className="text-xs text-lilac"> (إضافة)</span>}
                      {it.customization && <span className="mt-0.5 block rounded bg-butter-soft px-2 text-butter">✎ {it.customization}</span>}
                      {it.customImage && (
                        <a href={`/admin/files/${it.customImage}`} target="_blank" rel="noreferrer" className="mt-1 flex w-fit items-center gap-2 rounded bg-butter-soft p-1 pe-2 text-xs text-butter hover:underline">
                          {/* eslint-disable-next-line @next/next/no-img-element -- صورة العميل من التخزين الخاص */}
                          <img src={`/admin/files/${it.customImage}`} alt="" className="size-12 rounded object-cover" />
                          صورة العميل للطباعة (افتحيها)
                        </a>
                      )}
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
          <OrderChat
            messages={order.messages ?? []}
            side="store"
            send={sendStoreMessage.bind(null, order.id)}
            markRead={markStoreRead.bind(null, order.id)}
            title="الشات مع العميل"
            whatsapp={{ phone: order.sender.phone, footer: order.locale === "en" ? `Reply here: ${orderUrl}` : `تقدر ترد علينا من هنا: ${orderUrl}` }}
            placeholder="اكتبي للعميل (مثلاً: تحبي الكارت بخط عربي ولا إنجليزي؟)"
          />
          {brands.length > 0 && (
            <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
              <h2 className="text-xl text-brand">البراندات</h2>
              <ul className="mt-3 space-y-3">
                {brands.map(({ p, bo }) => (
                  <li key={p.id} className="space-y-1.5 text-sm">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/settlements/${p.id}`} className="font-semibold hover:text-brand">{p.name}</Link>
                      {bo!.handedAt ? (
                        <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">سلّم · {when(bo!.handedAt)}</span>
                      ) : (
                        bo!.open &&
                        (bo!.late ? (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">متأخر · كان آخره {formatDay(bo!.handBy)}</span>
                        ) : (
                          <span className="rounded-full bg-butter-soft px-2 py-0.5 text-xs text-butter">لسه مسلّمش · آخره {formatDay(bo!.handBy)}</span>
                        ))
                      )}
                    </p>
                    <p className="text-xs text-ink-2">{bo!.lines.map((l) => `${l.quantity}× ${l.name}`).join("، ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            <h2 className="text-xl text-brand">الحالة</h2>
            <StatusButtons id={order.id} status={order.status} />
          </section>
          <RedeliveryPanel
            id={order.id}
            status={order.status}
            defaultFee={zone?.fee ?? order.gifts[0]?.deliveryFee ?? 0}
            minDate={addDays(cairoNow().date, 1)}
            periods={settings.periods.map((p) => ({ id: p.id, label: periodLabel(p.id, settings) }))}
            redeliveries={order.gifts[0]?.redeliveries ?? []}
          />

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
            <h2 className="text-xl text-brand">مرتجع أو تعويض</h2>
            <p className="mt-1 text-xs text-muted">لو فلوس رجعت للعميل، أو اتعوّض عن حاجة، أو هدية رجعت. بيتخصم من المكسب في التقارير.</p>
            {(order.refunds ?? []).length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {order.refunds!.map((r, i) => (
                  <li key={i} className="flex justify-between gap-3 rounded-lg bg-brand-soft/50 px-3 py-2">
                    <span>
                      <b>{refundLabel[r.kind]}</b>: {r.reason}
                    </span>
                    <span className="tabular shrink-0 font-semibold text-brand">− {money(r.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm action={addRefundAction.bind(null, order.id)} submitLabel="سجّلي" doneLabel="اتسجل ✓" resetOnSuccess className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select name="kind" className="field" defaultValue="refund" aria-label="النوع">
                  <option value="refund">فلوس رجعت للعميل</option>
                  <option value="compensation">تعويض</option>
                  <option value="return">مرتجع</option>
                </select>
                <input name="amount" inputMode="numeric" placeholder="المبلغ" className="field tabular" aria-label="المبلغ" />
              </div>
              <input name="reason" placeholder="السبب (مثلاً: الورد وصل دبلان)" className="field" aria-label="السبب" />
            </ActionForm>
          </section>

          <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            <h2 className="text-xl text-brand">المرسل</h2>
            {order.source && <p className="mt-1 text-xs text-muted">عرفنا من: {order.source}</p>}
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
