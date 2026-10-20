"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useHref, useT } from "@/i18n/client";
import { submitGiftCardOrder } from "@/lib/gift-card-actions";
import { egp } from "@/lib/format";
import {
  GIFT_CARD_MAX,
  GIFT_CARD_MAX_MESSAGE,
  GIFT_CARD_MIN,
  giftCardAmounts,
  giftCardDesigns,
  type GiftCardDesign,
} from "@/lib/gift-card";
import { STORE_NAME } from "@/lib/settings";
import { GiftCardArt } from "./gift-card-art";
import { Icon } from "./icons";

/** صفحة كارت الهدية: الكارت بيتغير قدامك مع كل اختيار، وبعدين بياناتك وتكمل للدفع */
export function GiftCardForm() {
  const t = useT();
  const router = useRouter();
  const href = useHref();
  const [design, setDesign] = useState<GiftCardDesign>("classic");
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [asGift, setAsGift] = useState(false);
  const [toName, setToName] = useState("");
  const [toPhone, setToPhone] = useState("");
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const value = custom ? Number(custom) : amount;
  const storeName = t(STORE_NAME);

  function submit() {
    setErrors([]);
    start(async () => {
      const r = await submitGiftCardOrder({ design, amount: value, asGift, toName, toPhone, fromName, message, sender }, t.locale);
      if (!r.ok) {
        setErrors(r.errors);
        return;
      }
      router.push(href(`/order/${r.token}`));
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
      {/* الكارت وأشكاله */}
      <div className="lg:sticky lg:top-36">
        <div className="animate-float">
          <GiftCardArt
            design={design}
            amount={value || undefined}
            amountLabel={value ? egp(value, t) : undefined}
            title={t("كارت هدية")}
            storeName={storeName}
            toName={asGift && toName ? t("لـ {name}", { name: toName }) : undefined}
            className="mx-auto max-w-xl -rotate-2"
          />
        </div>
        <div className="mx-auto mt-8 grid max-w-xl grid-cols-4 gap-3">
          {giftCardDesigns.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDesign(d.id)}
              aria-pressed={design === d.id}
              aria-label={t(d.label)}
              className={`overflow-hidden rounded-xl transition ${design === d.id ? "ring-2 ring-ink ring-offset-2 ring-offset-bg" : "opacity-70 hover:opacity-100"}`}
            >
              <GiftCardArt design={d.id} title="" storeName="" className="pointer-events-none !rounded-xl !shadow-none" />
            </button>
          ))}
        </div>
      </div>

      {/* الاختيارات والبيانات */}
      <div className="panel space-y-7 border border-line bg-paper p-6 sm:p-9">
        <div>
          <h2 className="text-4xl leading-tight">{t("كارت الهدية")}</h2>
          <p className="tabular mt-2 font-heading text-3xl text-brand">{value ? egp(value, t) : "—"}</p>
          <p className="mt-2 leading-7 text-ink-2">{t("بيوصل على واتساب بعد ما الدفع يتأكد، وصاحبه يختار بيه اللي يعجبه من الموقع كله. صالح لمدة سنة، ولو ماصرفهوش مرة واحدة الباقي بيفضل في رصيده.")}</p>
        </div>

        <fieldset>
          <legend className="mb-3 font-semibold">
            {t("المناسبة")}: <span className="font-normal text-ink-2">{t(giftCardDesigns.find((d) => d.id === design)!.label)}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {giftCardDesigns.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDesign(d.id)}
                aria-pressed={design === d.id}
                className={`h-11 rounded-full border px-5 text-[15px] transition-colors ${design === d.id ? "border-ink bg-ink text-white" : "border-line bg-bg hover:border-ink"}`}
              >
                {t(d.label)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-semibold">
            {t("المبلغ")}: <span className="tabular font-normal text-ink-2">{value ? egp(value, t) : "—"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {giftCardAmounts.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAmount(a);
                  setCustom("");
                }}
                aria-pressed={!custom && amount === a}
                className={`tabular h-11 rounded-full border px-5 text-[15px] transition-colors ${!custom && amount === a ? "border-ink bg-ink text-white" : "border-line bg-bg hover:border-ink"}`}
              >
                {a}
              </button>
            ))}
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              placeholder={t("مبلغ تاني")}
              aria-label={t("مبلغ تاني")}
              className={`tabular h-11 w-32 rounded-full border bg-bg px-5 text-[15px] outline-none focus:border-ink ${custom ? "border-ink" : "border-line"}`}
            />
          </div>
          <p className="mt-2 text-xs text-muted">{t("من {min} لـ {max}", { min: egp(GIFT_CARD_MIN, t), max: egp(GIFT_CARD_MAX, t) })}</p>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-5 accent-ink" checked={asGift} onChange={(e) => setAsGift(e.target.checked)} />
          <Icon name="gift" className="size-5 text-brand" />
          {t("عايز أبعته هدية لحد")}
        </label>

        {asGift && (
          <div className="space-y-3 rounded-2xl bg-blush/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">{t("اسمه")}</span>
                <input className="field" value={toName} onChange={(e) => setToName(e.target.value.slice(0, 40))} />
              </label>
              <label className="block">
                <span className="label">{t("رقم واتساب بتاعه")}</span>
                <input className="field tabular" dir="ltr" inputMode="tel" placeholder="+20 1xx xxx xxxx" value={toPhone} onChange={(e) => setToPhone(e.target.value)} />
              </label>
            </div>
            <label className="block">
              <span className="label">{t("رسالتك")}</span>
              <textarea className="field h-auto py-3 leading-7" rows={3} value={message} onChange={(e) => setMessage(e.target.value.slice(0, GIFT_CARD_MAX_MESSAGE))} />
            </label>
            <label className="block">
              <span className="label">{t("من مين؟")}</span>
              <input className="field" value={fromName} onChange={(e) => setFromName(e.target.value.slice(0, 40))} />
            </label>
          </div>
        )}

        <div className="space-y-3 border-t border-line pt-6">
          <p className="font-semibold">{t("بياناتك")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{t("اسمك")}</span>
              <input className="field" autoComplete="name" value={sender.name} onChange={(e) => setSender({ ...sender, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">{t("رقم واتساب")}</span>
              <input className="field tabular" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+20 1xx xxx xxxx" value={sender.phone} onChange={(e) => setSender({ ...sender, phone: e.target.value })} />
            </label>
          </div>
        </div>

        {errors.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-brand-soft/60 p-3 text-sm leading-6 text-brand-dark">
            {errors.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>
        )}

        <button type="button" onClick={submit} disabled={pending} className="btn-dark w-full">
          {pending ? t("لحظة…") : t("كمّل للدفع")}
        </button>
        <p className="text-center text-xs text-muted">{t("الدفع بإنستاباي، وأول ما يتأكد هيوصلك الكود على واتساب.")}</p>
      </div>
    </div>
  );
}
