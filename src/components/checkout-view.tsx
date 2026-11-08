"use client";

import { Link, useHref, useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { checkCoupon, submitOrder } from "@/lib/checkout-actions";
import { checkGiftCard } from "@/lib/gift-card-actions";
import { deliveryProblems, giftProblems, giftTotals, hasCustomization, orderSources, withDelivery } from "@/lib/cart";
import { periodLabel } from "@/lib/delivery";
import { egp, formatDay } from "@/lib/format";
import { couponDiscount, type CouponRule } from "@/lib/pricing";
import type { StoreSettings } from "@/lib/settings";
import type { Zone } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { emailError, nameError, normalizePhone, phoneError, toLatinDigits } from "@/lib/validate";

export function CheckoutView({ zones, settings }: { zones: Zone[]; settings: StoreSettings }) {
  const t = useT();
  const hydrated = useHydrated();
  const { gifts, giftCards: cards, delivery, sender, setSender, couponCode, setCoupon, clear } = useCart();
  const [source, setSource] = useState("");
  const router = useRouter();
  const href = useHref();
  const [coupon, setCouponRule] = useState<CouponRule | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  // كارت الهدية: الكود والرصيد بعد ما يتأكد منه السيرفر
  const [gcCode, setGcCode] = useState("");
  const [gcCard, setGcCard] = useState<{ code: string; balance: number } | null>(null);
  const [gcMsg, setGcMsg] = useState("");
  const [method, setMethod] = useState<"instapay" | "cod">("instapay");
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  // بياناتك: الخطأ بيبان بعد ما تسيب الخانة أو تحاول تأكد الطلب
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);

  // الطلب للعميل نفسه: اسمه وموبايله من بيانات التوصيل اللي كتبها في السلة (لو لسه فاضيين)
  useEffect(() => {
    if (!hydrated || !sender.isRecipient) return;
    const patch: Partial<typeof sender> = {};
    if (!sender.name.trim() && delivery.recipient.name.trim()) patch.name = delivery.recipient.name.trim();
    if (!sender.phone.trim() && delivery.recipient.phone.trim()) patch.phone = delivery.recipient.phone.trim();
    if (Object.keys(patch).length) setSender(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- مرة واحدة لما الصفحة تفتح
  }, [hydrated]);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  const hasGifts = gifts.length > 0;
  const empty = !hasGifts && cards.length === 0;
  if (empty || (hasGifts && (gifts.some((g) => giftProblems(g, settings).length) || deliveryProblems(delivery, settings.maxCardMessage).length))) {
    return (
      <div className="card p-8 text-center">
        <p className="font-bold">{empty ? t("السلة فاضية") : t("فيه بيانات ناقصة في السلة")}</p>
        <Link href={empty ? "/shop" : "/cart"} className="btn-primary mt-4">
          {empty ? t("تصفح الهدايا") : t("ارجع للسلة")}
        </Link>
      </div>
    );
  }

  // الطلب كله لشخص واحد: رسوم توصيل واحدة. كروت الهدايا من غير توصيل ومن غير خصم
  const zone = hasGifts ? zones.find((z) => z.id === delivery.recipient.zoneId) : undefined;
  const totals = gifts.map((g) => giftTotals(g, settings));
  const items = totals.reduce((s, t) => s + t.items, 0);
  const packaging = totals.reduce((s, t) => s + t.packaging, 0);
  const deliveryFee = zone?.fee ?? 0;
  const cardsSum = cards.reduce((s, c) => s + c.amount, 0);
  const discount = coupon ? couponDiscount(items + packaging, coupon) : 0;
  const beforeCard = items + packaging + deliveryFee - discount;
  const gcApplied = gcCard ? Math.min(gcCard.balance, beforeCard) : 0;
  const total = beforeCard - gcApplied + cardsSum;

  const codAllowed = hasGifts && cards.length === 0 && sender.isRecipient && gifts.every((g) => !hasCustomization(g)) && zone?.kind !== "governorate";
  const payMethod = codAllowed ? method : "instapay";

  function applyCoupon() {
    start(async () => {
      const r = await checkCoupon(couponCode, items + packaging, t.locale);
      if (r.ok) {
        setCouponRule(r.rule);
        setCouponMsg("");
      } else {
        setCouponRule(null);
        setCouponMsg(r.message);
      }
    });
  }

  function applyGiftCard() {
    start(async () => {
      const r = await checkGiftCard(gcCode, t.locale);
      if (r.ok) {
        setGcCard({ code: r.code, balance: r.balance });
        setGcMsg("");
      } else {
        setGcCard(null);
        setGcMsg(r.message);
      }
    });
  }

  const senderErr = { name: nameError(sender.name), phone: phoneError(sender.phone), email: emailError(sender.email) };
  const sErr = (k: keyof typeof senderErr) => ((tried || touched[k]) && senderErr[k] ? t(senderErr[k]!) : null);
  const touch = (k: string) => () => setTouched((x) => ({ ...x, [k]: true }));

  function submit() {
    setErrors([]);
    if (senderErr.name || senderErr.phone || senderErr.email) {
      setTried(true);
      document.getElementById("sender")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    start(async () => {
      const r = await submitOrder(
        // الطلب للعميل نفسه: مفيش كارت ولا «اخفي السعر» ولا «مفاجأة»
        { gifts: withDelivery(gifts, sender.isRecipient ? { ...delivery, cardMessage: "", hidePrice: false, surprise: false } : delivery), giftCards: cards.map(({ id: _id, ...c }) => c), sender, couponCode: coupon ? couponCode : "", paymentMethod: payMethod, giftCardCode: gcCard?.code ?? "", source },
        t.locale,
      );
      if (!r.ok) {
        setErrors(r.errors);
        return;
      }
      // الطلب اتسجل: نفضّي السلة ونروح لصفحة الطلب (الدفع والمتابعة)
      clear();
      router.push(href(`/order/${r.token}`));
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="min-w-0 space-y-8">
        <section id="sender" className="card space-y-3 p-4">
          <h2 className="font-semibold">{t("بياناتك")}</h2>
          <p className="-mt-2 text-xs text-muted">{t("مش محتاج تعمل حساب. هنبعتلك التأكيد ومتابعة الطلب على واتساب.")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="sn">{t("اسمك")}</label>
              <input id="sn" className={cls(sErr("name"))} maxLength={60} autoComplete="name" value={sender.name} onChange={(e) => setSender({ name: e.target.value })} onBlur={touch("name")} aria-invalid={!!sErr("name")} />
              <Err msg={sErr("name")} />
            </div>
            <div>
              <label className="label" htmlFor="sp">{t("رقم واتساب")}</label>
              <input
                id="sp"
                className={`${cls(sErr("phone"))} tabular`}
                dir="ltr"
                type="tel"
                inputMode="tel"
                maxLength={16}
                autoComplete="tel"
                placeholder="01xxxxxxxxx"
                value={sender.phone}
                onChange={(e) => setSender({ phone: toLatinDigits(e.target.value).replace(/[^\d+\s-]/g, "") })}
                onBlur={() => {
                  touch("phone")();
                  if (sender.phone) setSender({ phone: normalizePhone(sender.phone) });
                }}
                aria-invalid={!!sErr("phone")}
              />
              <Err msg={sErr("phone")} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="se">{t("الإيميل")} <span className="font-normal text-muted">{t("(اختياري)")}</span></label>
            <input id="se" className={cls(sErr("email"))} dir="ltr" type="email" maxLength={120} autoComplete="email" value={sender.email} onChange={(e) => setSender({ email: e.target.value.trim() })} onBlur={touch("email")} aria-invalid={!!sErr("email")} />
            <Err msg={sErr("email")} />
          </div>
          {hasGifts && (
            <p className="text-sm text-ink-2">
              {sender.isRecipient ? t("الطلب ليك إنت، وهيوصل على العنوان اللي كتبته في السلة.") : t("الطلب هدية لـ {name}.", { name: delivery.recipient.name })}{" "}
              <Link href="/cart" className="font-semibold text-brand underline underline-offset-4">{t("تغيير")}</Link>
            </p>
          )}
          <div>
            <label className="label" htmlFor="src">
              {t("عرفتنا منين؟")} <span className="font-normal text-muted">{t("(اختياري)")}</span>
            </label>
            <select id="src" className="field" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">{t("اختار")}</option>
              {orderSources.map((o) => (
                <option key={o} value={o}>
                  {t(o)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">{t("طريقة الدفع")}</h2>
          <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${payMethod === "instapay" ? "border-ink ring-1 ring-ink" : "border-line"}`}>
            <input type="radio" name="pay" className="mt-1 size-5 accent-ink" checked={payMethod === "instapay"} onChange={() => setMethod("instapay")} />
            <span>
              <span className="block font-semibold">{t("إنستاباي")}</span>
              <span className="block text-xs leading-5 text-muted">
                {t("هتحوّل المبلغ على حساب المتجر وتكتب الرقم المرجعي وترفع صورة التحويل. أول ما نتأكد هيوصلك تأكيد على واتساب.")}
              </span>
            </span>
          </label>
          <label className={`flex gap-3 rounded-xl border p-3 ${codAllowed ? "cursor-pointer" : "opacity-60"} ${payMethod === "cod" ? "border-ink ring-1 ring-ink" : "border-line"}`}>
            <input type="radio" name="pay" className="mt-1 size-5 accent-ink" disabled={!codAllowed} checked={payMethod === "cod"} onChange={() => setMethod("cod")} />
            <span>
              <span className="block font-semibold">{t("كاش عند الاستلام")}</span>
              <span className="block text-xs leading-5 text-muted">
                {codAllowed
                  ? t("تدفع للمندوب وإنت بتستلم.")
                  : cards.length
                    ? t("كروت الهدايا لازم تتدفع الأول بإنستاباي.")
                    : t("متاح بس لو إنت نفسك المستلم، والهدية مش متخصصة، والتوصيل جوه محافظة أسيوط.")}
              </span>
            </span>
          </label>
        </section>

        {cards.length > 0 && (
          <section className="card p-4">
            <h2 className="mb-1 font-semibold">{cards.length > 1 ? t("كروت الهدايا") : t("كارت الهدية")}</h2>
            <p className="mb-3 text-xs text-muted">{t("من غير مصاريف شحن. الكود بيتبعت على واتساب أول ما الدفع يتأكد.")}</p>
            <ul className="divide-y divide-line">
              {cards.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                  <p>
                    <span className="font-semibold">{t("كارت هدية")}</span>
                    <span className="block text-xs text-muted">{c.asGift ? t("هنبعته لـ {name} على واتساب", { name: c.toName }) : t("الكود هيوصلك إنت")}</span>
                  </p>
                  <span className="tabular shrink-0">{egp(c.amount, t)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasGifts && (
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">{t("الهدايا")}</h2>
          {/* التوصيل مرة واحدة للطلب كله */}
          <p className="mb-3 rounded-xl bg-bg p-3 text-sm leading-6">
            {t("لـ {name}", { name: delivery.recipient.name })} · {zone?.name}
            <br />
            <span className="text-muted">
              {formatDay(delivery.date, t)} · {delivery.period && periodLabel(delivery.period, settings, t)}
            </span>
          </p>
          <ul className="divide-y divide-line">
            {gifts.map((g, i) => (
              <li key={g.id} className="flex justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                <p className="font-semibold">{g.title}</p>
                <span className="tabular shrink-0">{egp(totals[i].total, t)}</span>
              </li>
            ))}
          </ul>
          <Link href="/cart" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{t("تعديل السلة")}</Link>
        </section>
        )}
      </div>

      <aside className="space-y-4 rounded-3xl border border-line bg-paper p-6 shadow-[0_18px_36px_-28px_rgb(60_30_20/0.45)] lg:sticky lg:top-36">
        {!hasGifts ? (
          <p className="rounded-xl bg-bg p-3 text-xs leading-5 text-ink-2">{t("أكواد الخصم وكروت الهدايا القديمة بتتطبق على الهدايا بس، مش على شراء كروت هدايا جديدة.")}</p>
        ) : (
        <div>
          <label className="label" htmlFor="cc">{t("كود خصم")}</label>
          <div className="flex gap-2">
            <input
              id="cc"
              className="field tabular uppercase"
              dir="ltr"
              value={couponCode}
              onChange={(e) => {
                setCoupon(e.target.value);
                setCouponRule(null);
              }}
            />
            <button onClick={applyCoupon} disabled={pending || !couponCode.trim()} className="btn-outline shrink-0">{t("تطبيق")}</button>
          </div>
          {couponMsg && <p className="mt-1 text-xs text-brand">{couponMsg}</p>}
          {coupon && <p className="mt-1 text-xs text-success">{t("تم تطبيق الكود")}</p>}
          {cards.length > 0 && <p className="mt-1 text-xs text-muted">{t("الخصم على الهدايا بس، مش على كارت الهدية.")}</p>}
        </div>
        )}

        {hasGifts && (
        <div>
          <label className="label" htmlFor="gc">{t("عندك كارت هدية؟")}</label>
          <div className="flex gap-2">
            <input
              id="gc"
              className="field tabular uppercase"
              dir="ltr"
              placeholder="GC-XXXX-XXXX"
              value={gcCode}
              onChange={(e) => {
                setGcCode(e.target.value);
                setGcCard(null);
              }}
            />
            <button onClick={applyGiftCard} disabled={pending || !gcCode.trim()} className="btn-outline shrink-0">{t("استخدم")}</button>
          </div>
          {gcMsg && <p className="mt-1 text-xs text-brand">{gcMsg}</p>}
          {gcCard && <p className="mt-1 text-xs text-success">{t("رصيد الكارت {balance}", { balance: egp(gcCard.balance, t) })}</p>}
          {cards.length > 0 && <p className="mt-1 text-xs text-muted">{t("رصيد الكارت بيدفع الهدايا بس، مش كارت الهدية الجديد.")}</p>}
        </div>
        )}

        <dl className="space-y-1.5 border-t border-line pt-3 text-sm">
          {hasGifts && <div className="flex justify-between"><dt className="text-muted">{t("الهدايا")}</dt><dd className="tabular">{egp(items, t)}</dd></div>}
          {packaging > 0 && <div className="flex justify-between"><dt className="text-muted">{t("تغليف وتنسيق")}</dt><dd className="tabular">{egp(packaging, t)}</dd></div>}
          {cardsSum > 0 && <div className="flex justify-between"><dt className="text-muted">{cards.length > 1 ? t("كروت الهدايا") : t("كارت الهدية")}</dt><dd className="tabular">{egp(cardsSum, t)}</dd></div>}
          {hasGifts && <div className="flex justify-between"><dt className="text-muted">{t("التوصيل")}</dt><dd className="tabular">{egp(deliveryFee, t)}</dd></div>}
          {discount > 0 && <div className="flex justify-between text-success"><dt>{t("الخصم")}</dt><dd className="tabular">− {egp(discount, t)}</dd></div>}
          {gcApplied > 0 && <div className="flex justify-between text-success"><dt>{t("كارت هدية")}</dt><dd className="tabular">− {egp(gcApplied, t)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
            <dt>{t("الإجمالي")}</dt>
            <dd className="tabular">{egp(total, t)}</dd>
          </div>
        </dl>

        {errors.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-brand-soft/60 p-3 text-xs leading-5 text-brand-dark">
            {errors.map((e) => <li key={e}>• {e}</li>)}
          </ul>
        )}

        <button onClick={submit} disabled={pending} className="btn-primary w-full text-base">
          {pending ? t("لحظة…") : payMethod === "instapay" && total > 0 ? t("أكد الطلب وكمّل للدفع") : t("أكد الطلب")}
        </button>
        <p className="text-center text-xs text-muted">
          {t("بتأكيد الطلب إنت موافق على")}{" "}
          <Link href="/policies" target="_blank" className="text-brand underline underline-offset-4">
            {t("سياسة الإلغاء والاسترجاع والتوصيل")}
          </Link>
        </p>
      </aside>
    </div>
  );
}

const cls = (error: string | null) => `field ${error ? "border-brand focus:border-brand focus:ring-brand/10" : ""}`;

function Err({ msg }: { msg: string | null }) {
  return msg ? (
    <p className="mt-1 text-xs font-medium text-brand" role="alert">
      {msg}
    </p>
  ) : null;
}
