"use client";

import { Link, useHref, useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkCoupon, submitOrder } from "@/lib/checkout-actions";
import { checkGiftCard } from "@/lib/gift-card-actions";
import { giftProblems, giftTotals, hasCustomization } from "@/lib/cart";
import { periodLabel } from "@/lib/delivery";
import { egp, formatDay } from "@/lib/format";
import { couponDiscount, type CouponRule } from "@/lib/pricing";
import type { StoreSettings } from "@/lib/settings";
import type { Zone } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";

export function CheckoutView({ zones, settings }: { zones: Zone[]; settings: StoreSettings }) {
  const t = useT();
  const hydrated = useHydrated();
  const { gifts, sender, setSender, couponCode, setCoupon, clear } = useCart();
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

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  if (gifts.length === 0 || gifts.some((g) => giftProblems(g, settings).length)) {
    return (
      <div className="card p-8 text-center">
        <p className="font-bold">{gifts.length ? t("فيه بيانات ناقصة في السلة") : t("السلة فاضية")}</p>
        <Link href={gifts.length ? "/cart" : "/shop"} className="btn-primary mt-4">
          {gifts.length ? t("ارجع للسلة") : t("تصفح الهدايا")}
        </Link>
      </div>
    );
  }

  const zone = (id: string) => zones.find((z) => z.id === id);
  const totals = gifts.map((g) => giftTotals(g, settings));
  const items = totals.reduce((s, t) => s + t.items, 0);
  const packaging = totals.reduce((s, t) => s + t.packaging, 0);
  const delivery = gifts.reduce((s, g) => s + (zone(g.recipient.zoneId)?.fee ?? 0), 0);
  const discount = coupon ? couponDiscount(items + packaging, coupon) : 0;
  const beforeCard = items + packaging + delivery - discount;
  const gcApplied = gcCard ? Math.min(gcCard.balance, beforeCard) : 0;
  const total = beforeCard - gcApplied;

  const codAllowed =
    sender.isRecipient &&
    gifts.every((g) => !hasCustomization(g)) &&
    gifts.every((g) => zone(g.recipient.zoneId)?.kind !== "governorate");
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

  function submit() {
    setErrors([]);
    start(async () => {
      const r = await submitOrder({ gifts, sender, couponCode: coupon ? couponCode : "", paymentMethod: payMethod, giftCardCode: gcCard?.code ?? "" }, t.locale);
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
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">{t("بياناتك")}</h2>
          <p className="-mt-2 text-xs text-muted">{t("مش محتاج تعمل حساب. هنبعتلك التأكيد ومتابعة الطلب على واتساب.")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="sn">{t("اسمك")}</label>
              <input id="sn" className="field" autoComplete="name" value={sender.name} onChange={(e) => setSender({ name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="sp">{t("رقم واتساب")}</label>
              <input id="sp" className="field tabular" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+20 1xx xxx xxxx" value={sender.phone} onChange={(e) => setSender({ phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="se">{t("الإيميل")} <span className="font-normal text-muted">{t("(اختياري)")}</span></label>
            <input id="se" className="field" dir="ltr" type="email" autoComplete="email" value={sender.email} onChange={(e) => setSender({ email: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-ink" checked={sender.isRecipient} onChange={(e) => setSender({ isRecipient: e.target.checked })} />
            {t("أنا نفسي اللي هستلم الهدية")}
          </label>
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
                  : t("متاح بس لو إنت نفسك المستلم، والهدية مش متخصصة، والتوصيل جوه محافظة أسيوط.")}
              </span>
            </span>
          </label>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-semibold">{t("الهدايا")}</h2>
          <ul className="divide-y divide-line">
            {gifts.map((g, i) => (
              <li key={g.id} className="flex justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                <div>
                  <p className="font-semibold">{g.title}</p>
                  <p className="text-xs leading-5 text-muted">
                    {t("لـ {name}", { name: g.recipient.name })} · {zone(g.recipient.zoneId)?.name}
                    <br />
                    {formatDay(g.delivery.date, t)} · {g.delivery.period && periodLabel(g.delivery.period, settings, t)}
                  </p>
                </div>
                <span className="tabular shrink-0">{egp(totals[i].total, t)}</span>
              </li>
            ))}
          </ul>
          <Link href="/cart" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{t("تعديل السلة")}</Link>
        </section>
      </div>

      <aside className="space-y-4 rounded-3xl border border-line bg-paper p-6 shadow-[0_18px_36px_-28px_rgb(60_30_20/0.45)] lg:sticky lg:top-36">
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
        </div>

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
        </div>

        <dl className="space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t("الهدايا")}</dt><dd className="tabular">{egp(items, t)}</dd></div>
          {packaging > 0 && <div className="flex justify-between"><dt className="text-muted">{t("تغليف وتنسيق")}</dt><dd className="tabular">{egp(packaging, t)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">{t("التوصيل")}</dt><dd className="tabular">{egp(delivery, t)}</dd></div>
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
      </aside>
    </div>
  );
}
