"use client";

import { useT } from "@/i18n/client";
import { egp } from "@/lib/format";
import { canPick, pickChoice, type OptionChoice, type ProductOption } from "@/lib/options";

/**
 * اختيار اللون/المقاس/الريحة: زراير، والألوان دواير بلونها.
 * اللي خلص بيبان مشطوب ومينفعش يتختار، وفرق السعر مكتوب جنب القيمة.
 * لو المنتج ليه أكتر من اختيار، «خلص» بيتحسب مع اللي اتختار (yara 100ml ممكن تخلص و50ml لأ).
 */
export function OptionPicker({
  options,
  choices,
  onChange,
  showPrices = true,
  size = "md",
}: {
  options: ProductOption[];
  choices: OptionChoice[];
  onChange: (next: OptionChoice[]) => void;
  /** في الباكدج فرق السعر مش بيتحسب، فمش بنكتبه */
  showPrices?: boolean;
  size?: "md" | "sm";
}) {
  const t = useT();
  const en = t.locale === "en";
  const pick = (optionId: string, valueId: string) => onChange(pickChoice(options, choices, optionId, valueId));

  return (
    <div className="space-y-4">
      {options.map((o) => {
        const chosen = o.values.find((v) => v.id === choices.find((c) => c.optionId === o.id)?.valueId);
        return (
          <fieldset key={o.id}>
            <legend className={`mb-2 font-semibold ${size === "sm" ? "text-sm" : ""}`}>
              {en ? o.en || o.name : o.name}
              {chosen ? <span className="font-normal text-ink-2">: {en ? chosen.en || chosen.label : chosen.label}</span> : <span className="font-normal text-brand"> · {t("اختار")}</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {o.values.map((v) => {
                const ok = canPick(options, choices, o.id, v.id);
                const on = chosen?.id === v.id;
                const label = en ? v.en || v.label : v.label;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!ok}
                    onClick={() => pick(o.id, v.id)}
                    aria-pressed={on}
                    title={ok ? undefined : t("خلص")}
                    className={`flex items-center gap-2 rounded-full border px-4 transition-colors disabled:cursor-not-allowed ${size === "sm" ? "h-9 text-sm" : "h-11 text-[15px]"} ${
                      on ? "border-ink bg-ink text-white" : ok ? "border-line bg-paper hover:border-ink" : "border-line bg-surface text-muted line-through opacity-60"
                    }`}
                  >
                    {o.kind === "color" && v.color && <span className="size-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: v.color }} aria-hidden />}
                    {label}
                    {showPrices && v.priceDelta !== 0 && ok && (
                      <span className={`tabular text-xs ${on ? "text-white/80" : "text-muted"}`}>
                        {v.priceDelta > 0 ? "+" : "−"}
                        {egp(Math.abs(v.priceDelta), t)}
                      </span>
                    )}
                    {!ok && <span className="text-xs no-underline">({t("خلص")})</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
