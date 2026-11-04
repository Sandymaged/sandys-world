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
}: {
  gifts: CartGift[];
  zones: Zone[];
  settings: StoreSettings;
  problems: string[];
  /** بعد ما العميل يدوس «كمّل»: كل الأخطاء بتبان حتى في الخانات اللي ملمسهاش */
  showErrors?: boolean;
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
        <h2 className="font-heading text-2xl">{gifts.length > 1 ? t("الهدايا رايحة لمين؟") : t("الهدية رايحة لمين؟")}</h2>
        <p className="mt-1 text-sm text-muted">
          {gifts.length > 1 ? t("كل الهدايا بتوصل مع بعض لنفس الشخص، برسوم توصيل واحدة. لو عايز تبعت لحد تاني اعمل طلب تاني.") : t("التوصيل لعنوان واحد، وبنكلمك لو احتجنا حاجة.")}
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rn">{t("اسم المستلم")}</label>
            <input id="rn" className={fieldCls(err("name"))} maxLength={60} value={delivery.recipient.name} onChange={(e) => setRecipient({ name: e.target.value })} onBlur={blur("name")} aria-invalid={!!err("name")} aria-describedby="rn-e" autoComplete="off" />
            <FieldError id="rn-e" msg={err("name")} />
          </div>
          <div>
            <label className="label" htmlFor="rp">{t("موبايل المستلم")}</label>
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
            <div className="scroll-x">
              {days.map((d) => {
                const on = delivery.date === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDelivery({ date: d, period: "" })}
                    className={`min-w-24 shrink-0 rounded-xl border px-3 py-2 text-center text-sm transition ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}
                  >
                    {d === now.date ? t("النهارده") : d === addDays(now.date, 1) ? t("بكرة") : formatDay(d, t).split(" ")[0]}
                    <span className="tabular block text-xs opacity-80">{formatDay(d, t).split(" ").slice(1).join(" ")}</span>
                  </button>
                );
              })}
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
                      className={`rounded-xl border px-2 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}
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
      </div>

      <div className="space-y-2 text-sm">
        {(
          [
            ["hidePrice", "متكتبوش السعر على أي حاجة"],
            ["surprise", "مفاجأة — متكلموش المستلم قبل التوصيل"],
            ["wantsDeliveryPhoto", "ابعتولي صورة التسليم على واتساب"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="size-5 accent-ink" checked={delivery[k]} onChange={(e) => setDelivery({ [k]: e.target.checked })} />
            {t(label)}
          </label>
        ))}
        {delivery.surprise && <p className="text-xs text-muted">{t("هنكلمك إنت لو احتجنا نتأكد من العنوان، والمندوب هيكلم المستلم وهو قدام الباب بس.")}</p>}
      </div>
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
