"use client";

import { useEffect, useState } from "react";
import { Link, useT } from "@/i18n/client";
import { deliveryProblems, giftProblems, giftTotals, orderPrepDays } from "@/lib/cart";
import { cairoNow, earliestDeliveryDate } from "@/lib/delivery";
import { egp } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";
import type { Zone } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { DeliveryEditor } from "./delivery-editor";
import { GiftCardLines } from "./gift-card-lines";
import { GiftEditor, WrappingPicker } from "./gift-editor";

export function CartView({ zones, settings }: { zones: Zone[]; settings: StoreSettings }) {
  const t = useT();
  const hydrated = useHydrated();
  const gifts = useCart((s) => s.gifts);
  const cards = useCart((s) => s.giftCards);
  const delivery = useCart((s) => s.delivery);
  const forMe = useCart((s) => s.sender.isRecipient);
  const setSender = useCart((s) => s.setSender);
  const updateGift = useCart((s) => s.updateGift);
  const [tried, setTried] = useState(false);

  // المنتجات المنفردة بتتغلّف مع بعض: التغليف بيتسجل على أول منتج بس (فبيتحسب مرة واحدة)
  const loose = gifts.filter((g) => g.kind === "product");
  useEffect(() => {
    for (const g of loose.slice(1)) if (g.wrapping) updateGift(g.id, { wrapping: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- بس لما المنتجات تتغير
  }, [loose.map((g) => `${g.id}:${g.wrapping ?? ""}`).join("|")]);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  if (gifts.length === 0 && cards.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-xl">{t("السلة فاضية")}</p>
        <p className="mt-2 text-muted">{t("اختار باكدج جاهز أو اعمل البوكس بنفسك.")}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/shop" className="btn-primary">{t("تصفح الهدايا")}</Link>
          <Link href="/box" className="btn-outline">{t("اعمل البوكس")}</Link>
        </div>
      </div>
    );
  }

  // الطلب لشخص واحد: رسوم توصيل واحدة للطلب كله
  const zone = zones.find((z) => z.id === delivery.recipient.zoneId);
  const totals = gifts.map((g) => giftTotals(g, settings));
  const items = totals.reduce((s, t) => s + t.items, 0);
  const packaging = totals.reduce((s, t) => s + t.packaging, 0);
  // التوصيل للهدايا بس، كروت الهدايا من غير توصيل
  const hasGifts = gifts.length > 0;
  const deliveryFee = hasGifts ? (zone?.fee ?? 0) : 0;
  const cardsSum = cards.reduce((s, c) => s + c.amount, 0);
  const problems = gifts.map((g) => giftProblems(g, settings));
  const dProblems = hasGifts ? deliveryProblems(delivery, settings.maxCardMessage) : [];
  // اليوم المختار بقى بدري لو اتضافت هدية بتاخد وقت أطول
  if (hasGifts && zone && delivery.date && delivery.date < earliestDeliveryDate(orderPrepDays(gifts), zone, cairoNow(), settings)) dProblems.push("يوم التوصيل");
  const ready = problems.every((p) => p.length === 0) && dProblems.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="min-w-0 space-y-8">
        {/* الطلب لمين: بيحدد خانات التوصيل والدفع (ليا أنا: من غير كارت ولا مفاجأة، والكاش متاح) */}
        {hasGifts && (
          <section className="card p-4 sm:p-5">
            <h2 className="font-heading text-2xl">{t("الطلب ده لمين؟")}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  [true, "ليا أنا", "هيوصلك إنت على عنوانك."],
                  [false, "هدية لحد تاني", "نوصّلها له، ومعاها كارت برسالتك لو حابب."],
                ] as const
              ).map(([v, title, body]) => (
                <button
                  key={title}
                  type="button"
                  aria-pressed={forMe === v}
                  onClick={() => setSender({ isRecipient: v })}
                  className={`rounded-2xl border p-4 text-start transition ${forMe === v ? "border-ink bg-bg ring-1 ring-ink" : "border-line hover:border-ink/40"}`}
                >
                  <span className="block font-semibold">{t(title)}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-ink-2">{t(body)}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        {gifts.map((g, i) => (
          <GiftEditor key={g.id} gift={g} index={i} settings={settings} problems={problems[i]} />
        ))}
        {loose.length > 0 && settings.wrappings.length > 1 && (
          <section className="card space-y-3 p-4 sm:p-5">
            <div>
              <h2 className="font-semibold">{loose.length > 1 ? t("تغليف المنتجات") : t("تغليف المنتج")}</h2>
              {loose.length > 1 && <p className="text-xs text-muted">{t("المنتجات اللي برا البوكس بتتغلّف كلها مع بعض.")}</p>}
            </div>
            <WrappingPicker
              settings={settings}
              value={loose[0].wrapping}
              onChange={(id) => loose.forEach((g, i) => updateGift(g.id, { wrapping: i === 0 ? id : undefined }))}
            />
          </section>
        )}
        {cards.length > 0 && <GiftCardLines cards={cards} />}
        <div className="flex flex-wrap gap-2">
          <Link href="/shop" className="btn-outline">{hasGifts ? t("+ ضيف هدية تانية") : t("+ ضيف هدية")}</Link>
          <Link href="/box" className="btn-outline">{t("+ اعمل بوكس")}</Link>
        </div>
        {hasGifts && (
          <div id="delivery">
            <DeliveryEditor gifts={gifts} zones={zones} settings={settings} problems={dProblems} showErrors={tried} forMe={forMe} />
          </div>
        )}
      </div>

      <aside className="rounded-3xl border border-line bg-paper p-6 shadow-[0_18px_36px_-28px_rgb(60_30_20/0.45)] lg:sticky lg:top-36">
        <p className="mb-3 font-heading text-2xl text-brand">{t("ملخص الطلب")}</p>
        <dl className="space-y-1.5 text-sm">
          {hasGifts && <div className="flex justify-between"><dt className="text-muted">{t("الهدايا ({n})", { n: gifts.length })}</dt><dd className="tabular">{egp(items, t)}</dd></div>}
          {packaging > 0 && (
            <div className="flex justify-between"><dt className="text-muted">{t("تغليف وتنسيق")}</dt><dd className="tabular">{egp(packaging, t)}</dd></div>
          )}
          {cardsSum > 0 && <div className="flex justify-between"><dt className="text-muted">{t("كروت الهدايا ({n})", { n: cards.length })}</dt><dd className="tabular">{egp(cardsSum, t)}</dd></div>}
          {hasGifts && (
            <div className="flex justify-between">
              <dt className="text-muted">{t("التوصيل")}</dt>
              <dd className="tabular">{zone ? egp(deliveryFee, t) : t("اختار المنطقة")}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>{t("الإجمالي")}</dt>
            <dd className="tabular">{egp(items + packaging + deliveryFee + cardsSum, t)}</dd>
          </div>
        </dl>
        {!ready && (
          <p className="mt-3 rounded-xl bg-brand-soft/60 p-3 text-xs leading-6 text-brand-dark">
            {dProblems.length
              ? t("ناقص في التوصيل: {list}", { list: dProblems.map((p) => t(p)).join(t("، ")) })
              : problems.filter((p) => p.length).length === 1
                ? t("كمّل بيانات الهدية اللي عليها علامة قبل الدفع.")
                : t("كمّل بيانات الهدايا اللي عليها علامة قبل الدفع.")}
          </p>
        )}
        {ready ? (
          <Link href="/checkout" className="btn-primary mt-3 w-full">
            {t("كمّل للدفع")}
          </Link>
        ) : (
          // لسه فيه ناقص: الدوسة بتوري كل الأخطاء وبتنزل لأول مكان فيه مشكلة
          <button
            type="button"
            className="btn-primary mt-3 w-full opacity-60"
            onClick={() => {
              setTried(true);
              const first = dProblems.length ? document.getElementById("delivery") : document.querySelector("[data-gift-problem]");
              first?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {t("كمّل للدفع")}
          </button>
        )}
      </aside>
    </div>
  );
}
