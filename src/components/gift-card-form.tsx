"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { egp } from "@/lib/format";
import {
  GIFT_CARD_MAX,
  GIFT_CARD_MAX_MESSAGE,
  GIFT_CARD_MIN,
  GIFT_CARD_VALID_DAYS,
  giftCardAmounts,
  giftCardDesigns,
  giftCardProblems,
  type GiftCardDesign,
} from "@/lib/gift-card";
import { normalizePhone, toLatinDigits } from "@/lib/validate";
import { useCart } from "@/store/cart";
import { STORE_NAME } from "@/lib/settings";
import { GiftCardArt } from "./gift-card-art";
import { Icon } from "./icons";

/** صفحة كارت الهدية: الكارت بيتغير قدامك مع كل اختيار، وبيتضاف للسلة ويتدفع مع باقي الطلب (من غير شحن) */
export function GiftCardForm() {
  const t = useT();
  const addGiftCard = useCart((s) => s.addGiftCard);
  const [design, setDesign] = useState<GiftCardDesign>("classic");
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [asGift, setAsGift] = useState(true);
  const [toName, setToName] = useState("");
  const [toPhone, setToPhone] = useState("");
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const value = custom ? Number(custom) : amount;
  const storeName = t(STORE_NAME);

  function add() {
    const card = { design, amount: value, asGift, toName: toName.trim(), toPhone: normalizePhone(toPhone), fromName: fromName.trim(), message: message.trim() };
    const p = giftCardProblems(card);
    setErrors(p.map((x) => (x === "المبلغ مش مظبوط" ? t("المبلغ لازم يكون من {min} لـ {max}", { min: egp(GIFT_CARD_MIN, t), max: egp(GIFT_CARD_MAX, t) }) : t(x))));
    if (p.length) return;
    // درج السلة بيفتح لوحده؛ نفضّي الاسم والرسالة عشان لو حب يضيف كارت تاني
    addGiftCard(card);
    setToName("");
    setToPhone("");
    setMessage("");
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
          <p className="mt-2 leading-7 text-ink-2">{t("كود بيتبعت على واتساب بعد ما الدفع يتأكد، وصاحبه يختار بيه اللي يعجبه من الموقع كله. صالح {days} يوم بس من يوم ما يتبعت، ولو ماصرفهوش مرة واحدة الباقي بيفضل في رصيده لحد ما المدة تخلص.", { days: GIFT_CARD_VALID_DAYS })}</p>
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

        {/* الكارت بيتبعت إزاي: إحنا نبعته على واتساب للي هيوصله، أو الكود يوصلك وتبعته بنفسك */}
        <fieldset>
          <legend className="mb-3 font-semibold">{t("الكارت هيوصل إزاي؟")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                [true, "ابعتوه إنتوا", "إحنا نبعته على واتساب للي هيوصله، ومعاه رسالتك. الكود بيوصله هو بس، وإنت بتشوف إنه اتبعت."],
                [false, "هبعته بنفسي", "الكود يوصلك إنت على واتساب، وتبعته لمين ما تحب."],
              ] as const
            ).map(([v, title, body]) => (
              <label key={title} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${asGift === v ? "border-ink bg-bg ring-1 ring-ink" : "border-line hover:border-ink/40"}`}>
                <input type="radio" name="send" className="mt-1 size-5 accent-ink" checked={asGift === v} onChange={() => setAsGift(v)} />
                <span>
                  <span className="block font-semibold">{t(title)}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-ink-2">{t(body)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {asGift && (
          <div className="space-y-3 rounded-2xl bg-blush/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">{t("اسمه")}</span>
                <input className="field" value={toName} onChange={(e) => setToName(e.target.value.slice(0, 40))} />
              </label>
              <label className="block">
                <span className="label">{t("رقم واتساب بتاعه")}</span>
                <input
                  className="field tabular"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="01xxxxxxxxx"
                  value={toPhone}
                  onChange={(e) => setToPhone(toLatinDigits(e.target.value).replace(/[^\d+\s-]/g, ""))}
                  onBlur={() => toPhone && setToPhone(normalizePhone(toPhone))}
                />
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

        {errors.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-brand-soft/60 p-3 text-sm leading-6 text-brand-dark">
            {errors.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>
        )}

        <button type="button" onClick={add} className="btn-dark w-full">
          <Icon name="bag" className="size-5" />
          {t("ضيف للسلة")}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-ink-2">
          <Icon name="check" className="size-4 text-success" />
          {t("من غير مصاريف شحن. بيتبعت على واتساب أول ما الدفع يتأكد.")}
        </p>
        <p className="text-center text-xs leading-5 text-muted">{t("الدفع بإنستاباي. أكواد الخصم مش بتتطبق على كروت الهدايا، ومينفعش تدفع تمنها بكارت هدية تاني.")}</p>
      </div>
    </div>
  );
}
