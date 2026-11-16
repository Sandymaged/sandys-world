"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { orderPrepDays, type CartGift, type GiftRecipient, type OrderDelivery } from "@/lib/cart";
import { addDays, cairoNow, earliestDeliveryDate, periodLabel, periodsForDate } from "@/lib/delivery";
import { egp, formatDay } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";
import type { Zone } from "@/lib/types";
import { normalizePhone, recipientErrors, toLatinDigits } from "@/lib/validate";
import { useCart } from "@/store/cart";

const DAYS_SHOWN = 14;

/**
 * التوصيل للطلب كله: الهدايا كلها رايحة لشخص واحد في ميعاد واحد، برسوم توصيل واحدة.
 * أقرب يوم بيتحسب من أطول مدة تجهيز في الهدايا.
 */
export function DeliveryEditor({
  gifts,
  zones,
  settings,
  problems,
  showErrors = false,
  forMe = false,
}: {
  gifts: CartGift[];
  zones: Zone[];
  settings: StoreSettings;
  problems: string[];
  /** بعد ما العميل يدوس «كمّل»: كل الأخطاء بتبان حتى في الخانات اللي ملمسهاش */
  showErrors?: boolean;
  /** الطلب للعميل نفسه: بياناته وعنوانه، ومن غير كارت ولا «اخفي السعر» ولا «مفاجأة» */
  forMe?: boolean;
}) {
  const t = useT();
  const delivery = useCart((s) => s.delivery);
  const setDelivery = useCart((s) => s.setDelivery);
  const now = cairoNow();
  const prepDays = orderPrepDays(gifts);
  const zone = zones.find((z) => z.id === delivery.recipient.zoneId);
  // الخطأ بيبان بعد ما العميل يسيب الخانة (أو بعد ما يحاول يكمّل)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors = recipientErrors(delivery.recipient);
  const err = (k: keyof typeof errors) => ((showErrors || touched[k]) && errors[k] ? t(errors[k]!) : null);
  const blur = (k: string) => () => setTouched((x) => ({ ...x, [k]: true }));
  const onlyZone = zones.length === 1 ? zones[0] : null;

  const setRecipient = (patch: Partial<GiftRecipient>) => {
    const recipient = { ...delivery.recipient, ...patch };
    // تغيير المنطقة ممكن يخلّي اليوم المختار مش متاح
    const z = zones.find((x) => x.id === recipient.zoneId);
    const next: Partial<OrderDelivery> = { recipient };
    if (z && delivery.date && delivery.date < earliestDeliveryDate(prepDays, z, now, settings)) {
      next.date = "";
      next.period = "";
    }
    setDelivery(next);
  };

  // لو منطقة واحدة بس مفتوحة: بتتختار لوحدها. ولو المنطقة اللي كانت مختارة اتقفلت: بتتشال
  useEffect(() => {
    const id = delivery.recipient.zoneId;
    if (onlyZone && id !== onlyZone.id) setRecipient({ zoneId: onlyZone.id });
    else if (id && !zones.some((z) => z.id === id)) setRecipient({ zoneId: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- بس لما المناطق أو المنطقة المختارة تتغير
  }, [onlyZone?.id, zones.length, delivery.recipient.zoneId]);

  const earliest = zone ? earliestDeliveryDate(prepDays, zone, now, settings) : null;
  // لو هدية جديدة بتاخد وقت أطول، اليوم اللي كان مختار ممكن يبقى بدري
  const dateTooEarly = Boolean(earliest && delivery.date && delivery.date < earliest);
  const days = earliest ? Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(earliest, i)) : [];
  const periods = delivery.date ? periodsForDate(delivery.date, now, settings) : [];
  const groups: [string, Zone[]][] = [
    ["مدينة أسيوط", zones.filter((z) => z.kind === "city")],
    ["مراكز أسيوط", zones.filter((z) => z.kind === "markaz")],
    ["محافظات تانية", zones.filter((z) => z.kind === "governorate")],
  ];

  return (
    <section className={`card space-y-6 p-5 ${problems.length ? "border-brand/50" : ""}`}>
      <div>
        <h2 className="font-heading text-2xl">{forMe ? t("بياناتك وعنوانك") : gifts.length > 1 ? t("الهدايا رايحة لمين؟") : t("الهدية رايحة لمين؟")}</h2>
        <p className="mt-1 text-sm text-muted">
          {forMe
            ? t("الطلب كله بيوصلك مع بعض برسوم توصيل واحدة.")
            : gifts.length > 1
              ? t("كل الهدايا بتوصل مع بعض لنفس الشخص، برسوم توصيل واحدة. لو عايز تبعت لحد تاني اعمل طلب تاني.")
              : t("التوصيل لعنوان واحد، وبنكلمك لو احتجنا حاجة.")}
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rn">{forMe ? t("اسمك") : t("اسم المستلم")}</label>
            <input id="rn" className={fieldCls(err("name"))} maxLength={60} value={delivery.recipient.name} onChange={(e) => setRecipient({ name: e.target.value })} onBlur={blur("name")} aria-invalid={!!err("name")} aria-describedby="rn-e" autoComplete="off" />
            <FieldError id="rn-e" msg={err("name")} />
          </div>
          <div>
            <label className="label" htmlFor="rp">{forMe ? t("رقم موبايلك") : t("موبايل المستلم")}</label>
            <input
              id="rp"
              className={`${fieldCls(err("phone"))} tabular`}
              dir="ltr"
              type="tel"
              inputMode="tel"
              maxLength={16}
              placeholder="01xxxxxxxxx"
              value={delivery.recipient.phone}
              // الأرقام العربي بتتحول لإنجليزي، والحروف مش بتتكتب
              onChange={(e) => setRecipient({ phone: toLatinDigits(e.target.value).replace(/[^\d+\s-]/g, "") })}
              onBlur={() => {
                blur("phone")();
                if (delivery.recipient.phone) setRecipient({ phone: normalizePhone(delivery.recipient.phone) });
              }}
              aria-invalid={!!err("phone")}
              aria-describedby="rp-e"
            />
            <FieldError id="rp-e" msg={err("phone")} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="rz">{t("المنطقة")}</label>
          <select
            id="rz"
            className={`${fieldCls(err("zoneId"))} disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-100`}
            value={delivery.recipient.zoneId}
            disabled={!!onlyZone}
            onChange={(e) => setRecipient({ zoneId: e.target.value })}
            onBlur={blur("zoneId")}
            aria-invalid={!!err("zoneId")}
          >
            <option value="">{t("اختار المنطقة")}</option>
            {groups.map(([label, list]) =>
              list.length ? (
                <optgroup key={label} label={t(label)}>
                  {list.map((z) => (
                    <option key={z.id} value={z.id}>
                      {t("{zone} — توصيل {price}", { zone: z.name, price: egp(z.fee, t) })}
                    </option>
                  ))}
                </optgroup>
              ) : null,
            )}
          </select>
          {onlyZone ? <p className="mt-1 text-xs text-muted">{t("التوصيل متاح دلوقتي للمنطقة دي بس.")}</p> : <FieldError msg={err("zoneId")} />}
        </div>
        <div>
          <label className="label" htmlFor="ra">{t("العنوان بالتفصيل")}</label>
          <textarea id="ra" rows={2} maxLength={300} className={`${fieldCls(err("address"))} h-auto py-3`} placeholder={t("الشارع، رقم العمارة، الدور، الشقة")} value={delivery.recipient.address} onChange={(e) => setRecipient({ address: e.target.value })} onBlur={blur("address")} aria-invalid={!!err("address")} aria-describedby="ra-e" />
          <FieldError id="ra-e" msg={err("address")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rl">{t("علامة مميزة")}</label>
            <input id="rl" maxLength={120} className={fieldCls(err("landmark"))} placeholder={t("جنب صيدلية…")} value={delivery.recipient.landmark} onChange={(e) => setRecipient({ landmark: e.target.value })} onBlur={blur("landmark")} />
            <FieldError msg={err("landmark")} />
          </div>
          <div>
            <label className="label" htmlFor="ru">
              {t("لينك اللوكيشن")} <span className="font-normal text-muted">{t("(اختياري)")}</span>
            </label>
            <input id="ru" type="url" maxLength={500} className={fieldCls(err("locationUrl"))} dir="ltr" inputMode="url" placeholder="https://maps.app.goo.gl/…" value={delivery.recipient.locationUrl} onChange={(e) => setRecipient({ locationUrl: e.target.value.trim() })} onBlur={blur("locationUrl")} aria-invalid={!!err("locationUrl")} aria-describedby="ru-e" />
            <FieldError id="ru-e" msg={err("locationUrl")} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">{t("توصل إمتى؟")}</h3>
        {!zone ? (
          <p className="text-sm text-muted">{t("اختار المنطقة الأول عشان نعرف أقرب يوم متاح.")}</p>
        ) : (
          <>
            {prepDays > 0 && earliest && (
              <p className="text-sm text-ink-2">
                {t(prepDays === 1 ? "الهدايا دي بتتجهز في يوم، فأقرب يوم توصيل {date}." : "الهدايا دي بتتجهز في {n} أيام، فأقرب يوم توصيل {date}.", { n: prepDays, date: formatDay(earliest, t) })}
              </p>
            )}
            {dateTooEarly && <p className="rounded-xl bg-butter-soft p-3 text-sm text-butter">{t("اليوم اللي كان متختار بقى بدري على تجهيز الهدايا. اختار يوم من الأيام دي.")}</p>}
            {earliest !== now.date && prepDays === 0 && zone.sameDay && (
              <p className="text-xs text-muted">
                {t("التوصيل في نفس اليوم متاح للطلبات قبل الساعة {h} الضهر بس.", { h: settings.sameDayCutoffHour > 12 ? settings.sameDayCutoffHour - 12 : settings.sameDayCutoffHour })}
              </p>
            )}
            {/* الأيام: كارت صغير لكل يوم (اسم اليوم، رقمه كبير، والشهر)، والصف بيتسحب وطرفه باهت */}
            <div className="relative overflow-hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {days.map((d) => {
                  const on = delivery.date === d;
                  const date = new Date(`${d}T12:00:00Z`);
                  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(t.locale === "en" ? "en-GB" : "ar-EG-u-nu-latn", { ...o, timeZone: "UTC" }).format(date);
                  const label = d === now.date ? t("النهارده") : d === addDays(now.date, 1) ? t("بكرة") : fmt({ weekday: "long" });
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDelivery({ date: d, period: "" })}
                      className={`flex w-[4.75rem] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition ${on ? "border-brand bg-brand text-white shadow-[0_8px_18px_-10px_rgb(163_33_44/0.7)]" : "border-line bg-white hover:border-brand/50"}`}
                    >
                      <span className={`text-[11px] leading-4 font-medium ${on ? "text-white/85" : "text-muted"}`}>{label}</span>
                      <span className="tabular font-heading text-2xl leading-8">{fmt({ day: "numeric" })}</span>
                      <span className={`text-[11px] leading-4 ${on ? "text-white/85" : "text-ink-2"}`}>{fmt({ month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              <span aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-paper to-transparent rtl:bg-gradient-to-r" />
            </div>
            {delivery.date && !dateTooEarly && (
              <div className="grid grid-cols-3 gap-2">
                {settings.periods.map((p) => {
                  const ok = periods.includes(p.id);
                  const on = delivery.period === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!ok}
                      onClick={() => setDelivery({ period: p.id })}
                      className={`rounded-2xl border px-2 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? "border-brand bg-brand text-white shadow-[0_8px_18px_-10px_rgb(163_33_44/0.7)]" : "border-line bg-white hover:border-brand/50"}`}
                    >
                      {periodLabel(p.id, settings, t)}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {!forMe && (
      <>
      {/* اسمك على الهدية ولا لأ */}
      <div className="space-y-2">
        <p className="label">{t("اسمك يظهر على الهدية؟")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              [false, "أيوه، اكتبوا إنها مني", "المستلم هيعرف إن الهدية منك"],
              [true, "لأ، من غير اسمي", "توصل من غير ما يعرف مين اللي بعتها"],
            ] as const
          ).map(([v, title, sub]) => {
            const on = Boolean(delivery.hideSender) === v;
            return (
              <button
                key={String(v)}
                type="button"
                aria-pressed={on}
                onClick={() => setDelivery({ hideSender: v })}
                className={`rounded-2xl border-2 px-4 py-3 text-start transition-colors ${on ? "border-brand bg-brand-soft" : "border-line bg-bg hover:border-brand/40"}`}
              >
                <span className={`block text-sm font-semibold ${on ? "text-brand" : "text-ink"}`}>{t(title)}</span>
                <span className="block text-xs text-muted">{t(sub)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="cm">
          {t("رسالة الكارت")} <span className="font-normal text-muted">{gifts.length > 1 ? t("(كارت واحد للطلب كله، اختياري)") : t("(اختياري)")}</span>
        </label>
        <textarea
          id="cm"
          rows={3}
          className="field h-auto py-3"
          maxLength={settings.maxCardMessage}
          placeholder={t("كل سنة وإنتي طيبة يا ماما…")}
          value={delivery.cardMessage ?? ""}
          onChange={(e) => setDelivery({ cardMessage: e.target.value })}
        />
        <p className="tabular text-left text-xs text-muted">{(delivery.cardMessage ?? "").length}/{settings.maxCardMessage}</p>
        {delivery.hideSender && <p className="text-xs text-muted">{t("الكارت هيتكتب من غير اسمك، فماتكتبش اسمك في الرسالة.")}</p>}
      </div>

      <div className="space-y-2 text-sm">
        {(
          [
            ["hidePrice", "متكتبوش السعر على أي حاجة"],
            ["wantsDeliveryPhoto", "ابعتولي صورة التسليم على واتساب"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="size-5 accent-ink" checked={delivery[k]} onChange={(e) => setDelivery({ [k]: e.target.checked })} />
            {t(label)}
          </label>
        ))}
      </div>
      </>
      )}
    </section>
  );
}

const fieldCls = (error: string | null) => `field ${error ? "border-brand focus:border-brand focus:ring-brand/10" : ""}`;

function FieldError({ msg, id }: { msg: string | null; id?: string }) {
  return msg ? (
    <p id={id} className="mt-1 text-xs font-medium text-brand" role="alert">
      {msg}
    </p>
  ) : null;
}
