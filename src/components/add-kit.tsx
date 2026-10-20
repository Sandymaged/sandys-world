"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { egp } from "@/lib/format";
import { kitTotal } from "@/lib/pricing";
import type { StoreSettings } from "@/lib/settings";
import type { Kit } from "@/lib/types";
import { useCart } from "@/store/cart";
import { Icon } from "./icons";

/** اختيار عدد الصحاب والأسماء، والسعر بخصم الكمية بيتحسب قدامك */
export function AddKit({ kit, tiers }: { kit: Kit; tiers: StoreSettings["weddingDiscounts"] }) {
  const t = useT();
  const addGift = useCart((s) => s.addGift);
  const single = kit.minPeople === kit.maxPeople;
  const bridal = kit.category === "bridal";
  const [people, setPeople] = useState(single ? kit.minPeople : Math.max(kit.minPeople, bridal ? 4 : 5));
  const [names, setNames] = useState("");
  const price = kitTotal(kit.pricePerPerson, people, tiers);
  const nextTier = [...tiers].sort((a, b) => a.minQty - b.minQty).find((t) => t.minQty > people);
  const set = (n: number) => setPeople(Math.min(kit.maxPeople, Math.max(kit.minPeople, n)));

  function add() {
    addGift({
      kind: "kit",
      title: single ? kit.name : t("{name} · {n} أفراد", { name: kit.name, n: people }),
      slug: kit.slug,
      refId: kit.id,
      image: kit.images[0],
      basePrice: price.total,
      lines: [],
      addons: [],
      people,
      names: names.trim(),
      prepDays: kit.prepDays,
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] rounded-2xl border border-line bg-bg p-5">
        {!single && (<>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{kit.role === "bridesmaid" ? t("كام إشبينة؟") : bridal ? t("كام واحدة؟") : t("كام واحدة هتحضر؟")}</span>
          <div className="flex items-center gap-1 rounded-full border-2 border-brand bg-bg">
            <button className="grid size-10 place-items-center text-brand" onClick={() => set(people - 1)} aria-label={t("أقل")}>
              <Icon name="minus" className="size-4" />
            </button>
            <span className="tabular relative w-10 overflow-hidden text-center font-heading text-2xl text-brand">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={people}
                  className="block"
                  initial={{ y: -18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 18, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {people}
                </motion.span>
              </AnimatePresence>
            </span>
            <button className="grid size-10 place-items-center text-brand" onClick={() => set(people + 1)} aria-label={t("أكتر")}>
              <Icon name="plus" className="size-4" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          {t("من {min} لـ {max} · {price} للفرد", { min: kit.minPeople, max: kit.maxPeople, price: egp(kit.pricePerPerson, t) })}
        </p>
        </>)}

        <dl className="mt-4 space-y-1.5 border-t border-dashed border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{people} × {egp(kit.pricePerPerson, t)}</dt>
            <dd className="tabular">{egp(price.gross, t)}</dd>
          </div>
          {price.discount > 0 && (
            <motion.div className="flex justify-between text-success" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <dt>{t("خصم الكمية {p}%", { p: Math.round(price.rate * 100) })}</dt>
              <dd className="tabular">− {egp(price.discount, t)}</dd>
            </motion.div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold text-brand">
            <dt>{t("الإجمالي")}</dt>
            <dd className="tabular">{egp(price.total, t)}</dd>
          </div>
        </dl>
        {nextTier && (
          <p className="mt-3 rounded-full bg-butter-soft px-3 py-1.5 text-center text-xs font-semibold text-butter">
            {t("زوّدي {n} وخدي خصم {p}% على الكل", { n: nextTier.minQty - people, p: Math.round(nextTier.rate * 100) })}
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="kit-names">
          {single ? t("الاسم على البوكس") : t("الأسماء على الكروت")} <span className="font-normal text-muted">{single ? t("(اختياري)") : t("(اختياري، كل اسم في سطر)")}</span>
        </label>
        <textarea
          id="kit-names"
          rows={single ? 1 : 4}
          className="field h-auto py-3"
          placeholder={t("سارة\nمريم\nنور")}
          value={names}
          onChange={(e) => setNames(e.target.value)}
        />
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-20 -mx-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <motion.button whileTap={{ scale: 0.97 }} onClick={add} className="btn-primary w-full">
          {t("ضيفي الكيتات للسلة")}
          <span className="tabular opacity-90">· {egp(price.total, t)}</span>
        </motion.button>
      </div>
    </div>
  );
}
