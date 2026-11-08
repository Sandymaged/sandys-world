"use client";

import { useT } from "@/i18n/client";
import { useState } from "react";
import { giftTotals, type CartGift } from "@/lib/cart";
import { egp, prepLabel } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";
import { describeChoices } from "@/lib/options";
import { useCart } from "@/store/cart";
import { OptionPicker } from "../option-picker";

/** اختيارات التغليف (صورة واسم وسعر لكل واحد) */
export function WrappingPicker({ settings, value, onChange }: { settings: StoreSettings; value?: string; onChange: (id: string) => void }) {
  const t = useT();
  const wraps = settings.wrappings;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {wraps.map((w) => {
        const on = (value ?? wraps[0].id) === w.id;
        return (
          <button
            key={w.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(w.id)}
            className={`flex items-center gap-3 rounded-2xl border p-2.5 text-start transition ${on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40"}`}
          >
            {w.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- صور التغليف من اللوحة (أي لينك)
              <img src={w.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-blush text-2xl" aria-hidden>🎁</span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t.locale === "en" ? w.en || w.name : w.name}</span>
              {(w.description || w.descriptionEn) && (
                <span className="block text-xs leading-5 text-muted">{t.locale === "en" ? w.descriptionEn || w.description : w.description}</span>
              )}
            </span>
            <span className="tabular shrink-0 text-sm font-semibold">{w.price ? `+${egp(w.price, t)}` : t("من غير زيادة")}</span>
          </button>
        );
      })}
    </div>
  );
}

/** هدية واحدة في السلة: التخصيص، والاختيارات، والتغليف، ورسالة الكارت. (التوصيل للطلب كله في DeliveryEditor) */
export function GiftEditor({
  gift,
  index,
  settings,
  problems,
}: {
  gift: CartGift;
  index: number;
  settings: StoreSettings;
  problems: string[];
}) {
  const t = useT();
  const { updateGift, removeGift } = useCart();
  const [open, setOpen] = useState(problems.length > 0);
  const totals = giftTotals(gift, settings);
  const customLines = gift.lines.filter((l) => l.customizable);
  const optionLines = gift.lines.filter((l) => l.options?.length);
  const wraps = settings.wrappings;
  const wrap = wraps.find((w) => w.id === gift.wrapping) ?? wraps[0];

  return (
    <article data-gift-problem={problems.length ? "" : undefined} className={`card ${problems.length && !open ? "border-brand/50" : ""}`}>
      <header className="flex items-start gap-3 p-4">
        <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{gift.title}</p>
          <p className="line-clamp-2 text-xs leading-5 text-muted">
            {[...gift.lines, ...gift.addons]
              .map((l) => {
                const picked = describeChoices(l.options, l.choices, t.locale);
                return `${l.name}${picked ? ` (${picked})` : ""}${l.quantity > 1 ? ` × ${l.quantity}` : ""}`;
              })
              .join(" · ")}
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
              : gift.kind === "product"
                ? t("بيتغلّف مع باقي المنتجات")
                : (wrap && (t.locale === "en" ? wrap.en || wrap.name : wrap.name)) || t("التغليف العادي")}
          </span>
          <span className="font-semibold underline underline-offset-4">{t("تعديل")}</span>
        </button>
      )}

      {open && (
        <div className="space-y-6 border-t border-line p-4">
          {optionLines.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">{t("اختار اللي يناسبك")}</h3>
              {optionLines.map((l) => (
                <div key={l.productId} className="space-y-2">
                  <p className="text-sm text-muted">{l.name}</p>
                  <OptionPicker
                    options={l.options!}
                    choices={l.choices ?? []}
                    showPrices={l.unitPrice > 0}
                    size="sm"
                    onChange={(next) =>
                      updateGift(gift.id, {
                        lines: gift.lines.map((x) => (x.productId === l.productId ? { ...x, choices: next } : x)),
                      })
                    }
                  />
                </div>
              ))}
            </section>
          )}

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

          {/* المنتجات المنفردة بتتغلّف مع بعض (اختيار واحد في السلة)، والباكدج والبوكس كل واحد لوحده */}
          {wraps.length > 1 && gift.kind !== "product" && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t("التغليف")}</h3>
              <WrappingPicker settings={settings} value={gift.wrapping} onChange={(id) => updateGift(gift.id, { wrapping: id })} />
            </section>
          )}

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
