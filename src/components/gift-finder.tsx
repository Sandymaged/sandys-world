"use client";

import { useState } from "react";
import { Link, useT } from "@/i18n/client";
import { priceBands, recipientOrder } from "@/lib/browse";
import { recipientLabels } from "@/lib/seed-data";
import type { RecipientTag } from "@/lib/types";

/**
 * «يلا نختار الهدية سوا»: ٣ أسئلة بسيطة كلها قدامك مرة واحدة (أسهل من خطوات ورا بعض)،
 * وكل اختيار ممكن تسيبه فاضي. الزرار بيوديكي للهدايا متفلترة بالاختيارات.
 */
export function GiftFinder({ occasions }: { occasions: { slug: string; name: string }[] }) {
  const t = useT();
  const [who, setWho] = useState<RecipientTag | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);

  const query = new URLSearchParams();
  if (who) query.set("for", who);
  if (occasion) query.set("occasion", occasion);
  if (price) query.set("price", price);
  const href = `/shop${query.size ? `?${query}` : ""}`;

  const steps = [
    {
      title: t("الهدية لمين؟"),
      options: recipientOrder.map((r) => ({ id: r, label: t(recipientLabels[r]) })),
      value: who,
      set: (v: string | null) => setWho(v as RecipientTag | null),
    },
    {
      title: t("بمناسبة إيه؟"),
      options: occasions.map((o) => ({ id: o.slug, label: o.name })),
      value: occasion,
      set: setOccasion,
    },
    {
      title: t("ميزانيتك قد إيه؟"),
      options: priceBands.map((b) => ({ id: b.id, label: t(b.label) })),
      value: price,
      set: setPrice,
    },
  ];

  return (
    <div className="space-y-7">
      {steps.map((s, i) => (
        <fieldset key={s.title}>
          <legend className="mb-3 flex items-center gap-3 font-heading text-xl text-ink">
            <span className="tabular grid size-9 place-items-center rounded-full bg-brand text-base text-white">{i + 1}</span>
            {s.title}
          </legend>
          <div className="flex flex-wrap gap-2">
            {s.options.map((o) => {
              const on = s.value === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => s.set(on ? null : o.id)}
                  className={`tabular h-11 rounded-full border px-5 text-[15px] font-medium transition-colors ${on ? "border-brand bg-brand text-white" : "border-line bg-paper text-ink-2 hover:border-brand hover:text-brand"}`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Link href={href} className="btn-primary px-9">
          {t("وريني الهدايا")}
        </Link>
        <p className="text-sm text-muted">{t("مش لازم تختار كل حاجة، اختار اللي تعرفه بس.")}</p>
      </div>
    </div>
  );
}
