"use client";

import { useT } from "@/i18n/client";
import { orderPrepDays, type CartGift, type GiftRecipient, type OrderDelivery } from "@/lib/cart";
import { addDays, cairoNow, earliestDeliveryDate, periodLabel, periodsForDate } from "@/lib/delivery";
import { egp, formatDay } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";
import type { Zone } from "@/lib/types";
import { useCart } from "@/store/cart";

const DAYS_SHOWN = 14;

/**
 * التوصيل للطلب كله: الهدايا كلها رايحة لشخص واحد في ميعاد واحد، برسوم توصيل واحدة.
 * أقرب يوم بيتحسب من أطول مدة تجهيز في الهدايا.
 */
export function DeliveryEditor({ gifts, zones, settings, problems }: { gifts: CartGift[]; zones: Zone[]; settings: StoreSettings; problems: string[] }) {
  const t = useT();
  const delivery = useCart((s) => s.delivery);
  const setDelivery = useCart((s) => s.setDelivery);
  const now = cairoNow();
  const prepDays = orderPrepDays(gifts);
  const zone = zones.find((z) => z.id === delivery.recipient.zoneId);

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
            <input id="rn" className="field" value={delivery.recipient.name} onChange={(e) => setRecipient({ name: e.target.value })} autoComplete="off" />
          </div>
          <div>
            <label className="label" htmlFor="rp">{t("موبايل المستلم")}</label>
            <input id="rp" className="field tabular" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" value={delivery.recipient.phone} onChange={(e) => setRecipient({ phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="rz">{t("المنطقة")}</label>
          <select id="rz" className="field" value={delivery.recipient.zoneId} onChange={(e) => setRecipient({ zoneId: e.target.value })}>
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
        </div>
        <div>
          <label className="label" htmlFor="ra">{t("العنوان بالتفصيل")}</label>
          <textarea id="ra" rows={2} className="field h-auto py-3" placeholder={t("الشارع، رقم العمارة، الدور، الشقة")} value={delivery.recipient.address} onChange={(e) => setRecipient({ address: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rl">{t("علامة مميزة")}</label>
            <input id="rl" className="field" placeholder={t("جنب صيدلية…")} value={delivery.recipient.landmark} onChange={(e) => setRecipient({ landmark: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ru">
              {t("لينك اللوكيشن")} <span className="font-normal text-muted">{t("(اختياري)")}</span>
            </label>
            <input id="ru" className="field" dir="ltr" inputMode="url" placeholder="https://maps.app.goo.gl/…" value={delivery.recipient.locationUrl} onChange={(e) => setRecipient({ locationUrl: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">{t("توصل إمتى؟")}</h3>
        {!zone ? (
          <p className="text-sm text-muted">{t("اختار المنطقة الأول عشان نعرف أقرب يوم متاح.")}</p>
        ) : (
          <>
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
