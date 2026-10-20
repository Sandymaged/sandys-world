"use client";

import { useT } from "@/i18n/client";
import { useState } from "react";
import { giftTotals, type CartGift, type GiftRecipient } from "@/lib/cart";
import { addDays, cairoNow, earliestDeliveryDate, periodLabel, periodsForDate } from "@/lib/delivery";
import { egp, formatDay, prepLabel } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";
import type { Zone } from "@/lib/types";
import { useCart } from "@/store/cart";

const DAYS_SHOWN = 14;

export function GiftEditor({
  gift,
  index,
  zones,
  settings,
  problems,
}: {
  gift: CartGift;
  index: number;
  zones: Zone[];
  settings: StoreSettings;
  problems: string[];
}) {
  const t = useT();
  const { updateGift, removeGift, gifts } = useCart();
  const [open, setOpen] = useState(problems.length > 0);
  const totals = giftTotals(gift, settings);
  const zone = zones.find((z) => z.id === gift.recipient.zoneId);
  const now = cairoNow();

  const setRecipient = (patch: Partial<GiftRecipient>) => {
    const recipient = { ...gift.recipient, ...patch };
    // تغيير المنطقة ممكن يخلّي اليوم المختار مش متاح
    const z = zones.find((x) => x.id === recipient.zoneId);
    let delivery = gift.delivery;
    if (z && delivery.date && delivery.date < earliestDeliveryDate(gift.prepDays, z, now, settings)) {
      delivery = { date: "", period: "" };
    }
    updateGift(gift.id, { recipient, delivery });
  };

  const previous = index > 0 ? gifts[index - 1] : null;
  const earliest = zone ? earliestDeliveryDate(gift.prepDays, zone, now, settings) : null;
  const days = earliest ? Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(earliest, i)) : [];
  const periods = gift.delivery.date ? periodsForDate(gift.delivery.date, now, settings) : [];
  const groups: [string, Zone[]][] = [
    ["مدينة أسيوط", zones.filter((z) => z.kind === "city")],
    ["مراكز أسيوط", zones.filter((z) => z.kind === "markaz")],
    ["محافظات تانية", zones.filter((z) => z.kind === "governorate")],
  ];
  const customLines = gift.lines.filter((l) => l.customizable);

  return (
    <article className={`card ${problems.length && !open ? "border-brand/50" : ""}`}>
      <header className="flex items-start gap-3 p-4">
        <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{gift.title}</p>
          <p className="line-clamp-2 text-xs leading-5 text-muted">
            {[...gift.lines, ...gift.addons].map((l) => (l.quantity > 1 ? `${l.name} × ${l.quantity}` : l.name)).join(" · ")}
          </p>
          <p className="mt-1 text-xs text-success">{prepLabel(gift.prepDays, t)}</p>
        </div>
        <div className="text-left">
          <p className="tabular font-semibold">{egp(totals.total, t)}</p>
          {totals.packaging > 0 && <p className="tabular text-[11px] text-muted">{t("شامل تغليف {price}", { price: egp(totals.packaging, t) })}</p>}
        </div>
      </header>

      {!open && (
        <button onClick={() => setOpen(true)} className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-sm">
          <span className={problems.length ? "font-semibold text-brand" : "text-muted"}>
            {problems.length
              ? t("ناقص: {list}", { list: problems.slice(0, 3).map((p) => t(p)).join(t("، ")) + (problems.length > 3 ? "…" : "") })
              : `${gift.recipient.name} · ${zone?.name} · ${formatDay(gift.delivery.date, t)}`}
          </span>
          <span className="font-semibold underline underline-offset-4">{t("تعديل")}</span>
        </button>
      )}

      {open && (
        <div className="space-y-6 border-t border-line p-4">
          {customLines.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t("التخصيص")}</h3>
              {customLines.map((l) => {
                const max = l.maxChars ?? 30;
                const v = l.customization ?? "";
                return (
                  <div key={l.productId}>
                    <label className="label" htmlFor={`cz-${gift.id}-${l.productId}`}>
                      {t("الاسم أو الجملة على {name}", { name: l.name })}
                    </label>
                    <input
                      id={`cz-${gift.id}-${l.productId}`}
                      className="field"
                      value={v}
                      maxLength={max}
                      onChange={(e) =>
                        updateGift(gift.id, {
                          lines: gift.lines.map((x) => (x.productId === l.productId ? { ...x, customization: e.target.value } : x)),
                        })
                      }
                    />
                    <p className="tabular mt-1 text-left text-xs text-muted">{v.length}/{max}</p>
                  </div>
                );
              })}
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("رايحة لمين؟")}</h3>
              {previous && (
                <button
                  className="text-xs font-semibold text-ink-2 underline underline-offset-4 hover:text-ink"
                  onClick={() => setRecipient({ ...previous.recipient })}
                >
                  {t("نفس مستلم الهدية {n}", { n: index })}
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor={`rn-${gift.id}`}>{t("اسم المستلم")}</label>
                <input id={`rn-${gift.id}`} className="field" value={gift.recipient.name} onChange={(e) => setRecipient({ name: e.target.value })} autoComplete="off" />
              </div>
              <div>
                <label className="label" htmlFor={`rp-${gift.id}`}>{t("موبايل المستلم")}</label>
                <input id={`rp-${gift.id}`} className="field tabular" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" value={gift.recipient.phone} onChange={(e) => setRecipient({ phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor={`rz-${gift.id}`}>{t("المنطقة")}</label>
              <select id={`rz-${gift.id}`} className="field" value={gift.recipient.zoneId} onChange={(e) => setRecipient({ zoneId: e.target.value })}>
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
              <label className="label" htmlFor={`ra-${gift.id}`}>{t("العنوان بالتفصيل")}</label>
              <textarea id={`ra-${gift.id}`} rows={2} className="field h-auto py-3" placeholder={t("الشارع، رقم العمارة، الدور، الشقة")} value={gift.recipient.address} onChange={(e) => setRecipient({ address: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor={`rl-${gift.id}`}>{t("علامة مميزة")}</label>
                <input id={`rl-${gift.id}`} className="field" placeholder={t("جنب صيدلية…")} value={gift.recipient.landmark} onChange={(e) => setRecipient({ landmark: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor={`ru-${gift.id}`}>{t("لينك اللوكيشن")} <span className="font-normal text-muted">{t("(اختياري)")}</span></label>
                <input id={`ru-${gift.id}`} className="field" dir="ltr" inputMode="url" placeholder="https://maps.app.goo.gl/…" value={gift.recipient.locationUrl} onChange={(e) => setRecipient({ locationUrl: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("توصل إمتى؟")}</h3>
            {!zone ? (
              <p className="text-sm text-muted">{t("اختار المنطقة الأول عشان نعرف أقرب يوم متاح.")}</p>
            ) : (
              <>
                {earliest !== now.date && gift.prepDays === 0 && zone.sameDay && (
                  <p className="text-xs text-muted">{t("التوصيل في نفس اليوم متاح للطلبات قبل الساعة {h} الضهر بس.", { h: settings.sameDayCutoffHour > 12 ? settings.sameDayCutoffHour - 12 : settings.sameDayCutoffHour })}</p>
                )}
                <div className="scroll-x">
                  {days.map((d) => {
                    const on = gift.delivery.date === d;
                    return (
                      <button
                        key={d}
                        onClick={() => updateGift(gift.id, { delivery: { date: d, period: "" } })}
                        className={`min-w-24 shrink-0 rounded-xl border px-3 py-2 text-center text-sm transition ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}
                      >
                        {d === now.date ? t("النهارده") : d === addDays(now.date, 1) ? t("بكرة") : formatDay(d, t).split(" ")[0]}
                        <span className="tabular block text-xs opacity-80">{formatDay(d, t).split(" ").slice(1).join(" ")}</span>
                      </button>
                    );
                  })}
                </div>
                {gift.delivery.date && (
                  <div className="grid grid-cols-3 gap-2">
                    {settings.periods.map((p) => {
                      const ok = periods.includes(p.id);
                      const on = gift.delivery.period === p.id;
                      return (
                        <button
                          key={p.id}
                          disabled={!ok}
                          onClick={() => updateGift(gift.id, { delivery: { ...gift.delivery, period: p.id } })}
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
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("رسالة الكارت")}</h3>
            <textarea
              rows={3}
              className="field h-auto py-3"
              maxLength={settings.maxCardMessage}
              placeholder={t("كل سنة وإنتي طيبة يا ماما…")}
              value={gift.cardMessage}
              onChange={(e) => updateGift(gift.id, { cardMessage: e.target.value })}
            />
            <p className="tabular -mt-2 text-left text-xs text-muted">{gift.cardMessage.length}/{settings.maxCardMessage}</p>
            <div className="space-y-2 text-sm">
              {(
                [
                  ["hidePrice", "متكتبوش السعر على أي حاجة"],
                  ["surprise", "مفاجأة — متكلموش المستلم قبل التوصيل"],
                  ["wantsDeliveryPhoto", "ابعتولي صورة التسليم على واتساب"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" className="size-5 accent-ink" checked={gift[k]} onChange={(e) => updateGift(gift.id, { [k]: e.target.checked })} />
                  {t(label)}
                </label>
              ))}
            </div>
            {gift.surprise && (
              <p className="text-xs text-muted">{t("هنكلمك إنت لو احتجنا نتأكد من العنوان، والمندوب هيكلم المستلم وهو قدام الباب بس.")}</p>
            )}
          </section>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <button onClick={() => removeGift(gift.id)} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
              {t("شيل الهدية")}
            </button>
            <button onClick={() => setOpen(false)} className="btn-outline py-2">
              {t("تمام")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
