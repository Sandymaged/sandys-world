"use client";

import { Link, useT } from "@/i18n/client";
import { giftProblems, giftTotals } from "@/lib/cart";
import { egp } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";
import type { Zone } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { GiftEditor } from "./gift-editor";

export function CartView({ zones, settings }: { zones: Zone[]; settings: StoreSettings }) {
  const t = useT();
  const hydrated = useHydrated();
  const gifts = useCart((s) => s.gifts);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  if (gifts.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-xl">{t("السلة فاضية")}</p>
        <p className="mt-2 text-muted">{t("اختار باكدج جاهز أو اعمل البوكس بنفسك.")}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/shop" className="btn-primary">{t("تصفح الهدايا")}</Link>
          <Link href="/box" className="btn-outline">{t("اعمل البوكس")}</Link>
        </div>
      </div>
    );
  }

  const zoneFee = (id: string) => zones.find((z) => z.id === id)?.fee ?? 0;
  const totals = gifts.map((g) => giftTotals(g, settings));
  const items = totals.reduce((s, t) => s + t.items, 0);
  const packaging = totals.reduce((s, t) => s + t.packaging, 0);
  const delivery = gifts.reduce((s, g) => s + zoneFee(g.recipient.zoneId), 0);
  const missingZone = gifts.some((g) => !g.recipient.zoneId);
  const problems = gifts.map((g) => giftProblems(g, settings));
  const ready = problems.every((p) => p.length === 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="min-w-0 space-y-8">
        {gifts.map((g, i) => (
          <GiftEditor key={g.id} gift={g} index={i} zones={zones} settings={settings} problems={problems[i]} />
        ))}
        <div className="flex flex-wrap gap-2">
          <Link href="/shop" className="btn-outline">{t("+ ضيف هدية تانية")}</Link>
          <Link href="/box" className="btn-outline">{t("+ اعمل بوكس")}</Link>
        </div>
      </div>

      <aside className="rounded-3xl border border-line bg-paper p-6 shadow-[0_18px_36px_-28px_rgb(60_30_20/0.45)] lg:sticky lg:top-36">
        <p className="mb-3 font-heading text-2xl text-brand">{t("ملخص الطلب")}</p>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t("الهدايا ({n})", { n: gifts.length })}</dt><dd className="tabular">{egp(items, t)}</dd></div>
          {packaging > 0 && (
            <div className="flex justify-between"><dt className="text-muted">{t("تغليف وتنسيق")}</dt><dd className="tabular">{egp(packaging, t)}</dd></div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">{t("التوصيل")}</dt>
            <dd className="tabular">{missingZone ? t("اختار المنطقة") : egp(delivery, t)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>{t("الإجمالي")}</dt>
            <dd className="tabular">{egp(items + packaging + delivery, t)}</dd>
          </div>
        </dl>
        {!ready && (
          <p className="mt-3 rounded-xl bg-brand-soft/60 p-3 text-xs leading-6 text-brand-dark">
            {problems.filter((p) => p.length).length === 1 ? t("كمّل بيانات الهدية اللي عليها علامة قبل الدفع.") : t("كمّل بيانات الهدايا اللي عليها علامة قبل الدفع.")}
          </p>
        )}
        <Link
          href={ready ? "/checkout" : "#"}
          aria-disabled={!ready}
          className={`btn-primary mt-3 w-full ${ready ? "" : "pointer-events-none opacity-50"}`}
        >
          {t("كمّل للدفع")}
        </Link>
      </aside>
    </div>
  );
}
