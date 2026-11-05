"use client";

import { Link, useT } from "@/i18n/client";
import { egp } from "@/lib/format";
import type { CartGiftCard } from "@/lib/gift-card";
import { useCart } from "@/store/cart";
import { GiftCardArt } from "../gift-card-art";
import { Icon } from "../icons";

/** كروت الهدايا في السلة: من غير توصيل، وبتتبعت على واتساب بعد الدفع */
export function GiftCardLines({ cards }: { cards: CartGiftCard[] }) {
  const t = useT();
  const remove = useCart((s) => s.removeGiftCard);
  return (
    <section className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-2xl">{cards.length > 1 ? t("كروت الهدايا") : t("كارت الهدية")}</h2>
        <p className="flex items-center gap-1.5 text-sm text-success">
          <Icon name="check" className="size-4" />
          {t("من غير مصاريف شحن، بيتبعت على واتساب")}
        </p>
      </div>
      <ul className="divide-y divide-dashed divide-line">
        {cards.map((c) => (
          <li key={c.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <GiftCardArt design={c.design} title="" storeName="" className="w-24 shrink-0 !rounded-xl !shadow-none sm:w-28" />
            <div className="min-w-0 flex-1">
              <p className="tabular font-semibold">{egp(c.amount, t)}</p>
              <p className="text-sm text-ink-2">
                {c.asGift ? t("هنبعته لـ {name} على واتساب ({phone})", { name: c.toName, phone: c.toPhone }) : t("الكود هيوصلك إنت على واتساب وتبعته بنفسك")}
              </p>
              {c.asGift && c.message && <p className="truncate font-script text-ink-2">«{c.message}»</p>}
            </div>
            <button type="button" onClick={() => remove(c.id)} className="shrink-0 text-sm text-muted underline-offset-4 hover:text-brand hover:underline">
              {t("شيل")}
            </button>
          </li>
        ))}
      </ul>
      <Link href="/gift-card" className="inline-block text-sm font-semibold underline underline-offset-4">
        {t("+ ضيف كارت تاني")}
      </Link>
    </section>
  );
}
