"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { useT } from "@/i18n/client";
import { addDays, cairoNow } from "@/lib/delivery";
import { dayCount, egp } from "@/lib/format";
import { weddingDiscountRate } from "@/lib/pricing";
import { useHydrated } from "@/lib/use-hydrated";
import type { StoreSettings } from "@/lib/settings";
import { submitWeddingRequest } from "@/lib/special-actions";
import { WEDDING_MIN_DAYS, weddingEstimate, weddingTypes } from "@/lib/wedding";

/** فورم طلب الأفراح: سعر مبدئي حسب النوع والعدد (FR-82) وتنبيه لو الفرح قريب (FR-83) */
export function WeddingForm({ tiers }: { tiers: StoreSettings["weddingDiscounts"] }) {
  const t = useT();
  const [type, setType] = useState<string>(weddingTypes[0].id);
  const [count, setCount] = useState(6);
  const [date, setDate] = useState("");
  const [colors, setColors] = useState("");
  const [names, setNames] = useState("");
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<string[] | null>(null);
  const [pending, start] = useTransition();

  const wt = weddingTypes.find((w) => w.id === type)!;
  const rate = weddingDiscountRate(count, tiers);
  const est = weddingEstimate(wt.unit, Math.max(1, count), rate);
  // تاريخ النهارده بيتحسب في المتصفح بس (مش وقت تجهيز الصفحة)
  const hydrated = useHydrated();
  const today = hydrated ? cairoNow().date : "";
  const soon = hydrated && date !== "" && date < addDays(today, WEDDING_MIN_DAYS);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await submitWeddingRequest({ type, count, weddingDate: date, colors, names, notes, contactName, phone }, t.locale);
      setResult(r.ok ? [] : r.errors);
    });
  }

  return (
    <form onSubmit={submit} className="relative bg-bg p-6 shadow-[0_24px_40px_-24px_rgb(60_20_25/0.6)] sm:p-10">

      <fieldset>
        <legend className="label">{t("نوع الطلب")}</legend>
        <div className="flex flex-wrap gap-2">
          {weddingTypes.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={type === w.id}
              onClick={() => setType(w.id)}
              className={`chip ${type === w.id ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand"}`}
            >
              {t(w.label)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="w-count">{t("العدد")}</label>
          <input id="w-count" type="number" min={1} max={500} inputMode="numeric" className="field tabular" value={count} onChange={(e) => setCount(Math.max(0, Number(e.target.value) || 0))} />
        </div>
        <div>
          <label className="label" htmlFor="w-date">{t("ميعاد الفرح")}</label>
          <input id="w-date" type="date" min={today ? addDays(today, 1) : undefined} className="field tabular" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <AnimatePresence>
        {soon && (
          <motion.p
            className="mt-3 rounded-xl bg-butter-soft p-3 text-sm text-butter"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {t("موعد الزفاف بعد أقل من {days}. سنحاول، لكن قد لا تكون بعض القطع الخاصة جاهزة في الوقت، وسنؤكد لك على واتساب.", { days: dayCount(WEDDING_MIN_DAYS, t) })}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="w-colors">{t("ألوان الفرح")}</label>
          <input id="w-colors" className="field" placeholder={t("مثلاً: بيبي بينك ودهبي")} value={colors} onChange={(e) => setColors(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="w-names">{t("الأسماء")} <span className="font-normal text-muted">{t("(اختياري)")}</span></label>
          <input id="w-names" className="field" placeholder={t("اسم العروسة والعريس أو الإشبينات")} value={names} onChange={(e) => setNames(e.target.value)} />
        </div>
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="w-notes">{t("تفاصيل أو فكرة في دماغك")}</label>
        <textarea id="w-notes" rows={3} className="field h-auto py-3" placeholder={t("ابعتي لينك Pinterest أو اوصفي اللي نفسك فيه")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="w-name">{t("اسمك")}</label>
          <input id="w-name" className="field" autoComplete="name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="w-phone">{t("رقم واتساب")}</label>
          <input id="w-phone" className="field tabular" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      {/* السعر المبدئي على ورقة صفرا */}
      <motion.div
        key={`${type}-${count}`}
        className="mt-7 rounded-2xl bg-blush/60 p-4 text-center"
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <p className="text-xs text-ink-2">{t("سعر مبدئي")} · {egp(wt.unit, t)} {t(wt.unitLabel)}</p>
        <p className="tabular font-heading text-3xl text-brand">
          {egp(est.low, t)} – {egp(est.high, t)}
        </p>
        {rate > 0 && <p className="text-xs font-semibold text-success">{t("شامل خصم الكمية {p}%", { p: Math.round(rate * 100) })}</p>}
        <p className="mt-1 text-[11px] text-muted">{t("السعر النهائي بيوصلك في عرض سعر على واتساب بعد ما نراجع التفاصيل.")}</p>
      </motion.div>

      {result && result.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">
          {result.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}

      <motion.button whileTap={{ scale: 0.97 }} disabled={pending} className="btn-primary mt-5 w-full">
        {pending ? t("لحظة…") : t("ابعتي الطلب")}
      </motion.button>
    </form>
  );
}
