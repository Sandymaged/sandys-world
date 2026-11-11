"use client";

import { useT } from "@/i18n/client";
import { useMemo, useState } from "react";
import { egp } from "@/lib/format";
import { describeChoices, missingOptions, optionsPrice, type OptionChoice } from "@/lib/options";
import { packagingFee } from "@/lib/pricing";
import type { StoreSettings } from "@/lib/settings";
import type { BoxSize, Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { GiftArt } from "./gift-art";
import { BasketReveal, type BasketItem } from "./basket-reveal";
import { BoxPreviewDock } from "./box-preview";
import { Icon } from "./icons";
import { OptionPicker } from "./option-picker";

/** سطر في البوكس: منتج بعدده، ولو ليه لون/مقاس فكل اختيار سطر لوحده */
interface BoxLine {
  key: string;
  productId: string;
  choices: OptionChoice[];
  qty: number;
}

const lineKey = (productId: string, choices: OptionChoice[]) =>
  [productId, ...[...choices].sort((a, b) => a.optionId.localeCompare(b.optionId)).map((c) => `${c.optionId}=${c.valueId}`)].join("|");

export function BoxBuilder({
  sizes,
  products,
  packaging,
  initialProductId,
}: {
  sizes: BoxSize[];
  products: Product[];
  packaging: StoreSettings["packaging"];
  initialProductId?: string;
}) {
  const t = useT();
  const addGift = useCart((s) => s.addGift);
  const byId = new Map(products.map((p) => [p.id, p]));
  const [sizeId, setSizeId] = useState(sizes[1]?.id ?? sizes[0]?.id);
  // المنتج اللي جاي من صفحته بيتحط على طول، إلا لو ليه لون/مقاس (بيتختار الأول)
  const [lines, setLines] = useState<BoxLine[]>(() => {
    const p = initialProductId ? products.find((x) => x.id === initialProductId) : undefined;
    return p && !p.options?.length ? [{ key: p.id, productId: p.id, choices: [], qty: 1 }] : [];
  });
  // المنتج اللي بيتختارله لون/مقاس دلوقتي
  const [picking, setPicking] = useState<string | null>(() => {
    const p = initialProductId ? products.find((x) => x.id === initialProductId) : undefined;
    return p?.options?.length ? p.id : null;
  });
  const [draft, setDraft] = useState<OptionChoice[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  const size = sizes.find((s) => s.id === sizeId);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const full = size ? count >= size.maxItems : true;
  const overflow = size ? count > size.maxItems : false;
  const unitOf = (l: BoxLine) => {
    const p = byId.get(l.productId);
    return p ? p.price + optionsPrice(p.options, l.choices) : 0;
  };
  const itemsTotal = lines.reduce((s, l) => s + unitOf(l) * l.qty, 0);
  const boxPrice = size?.price ?? 0;
  const fee = count > 0 ? packagingFee(boxPrice + itemsTotal, packaging) : 0;
  const total = count > 0 ? boxPrice + itemsTotal + fee : 0;

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const shown = category ? products.filter((p) => p.category === category) : products;
  const qtyOf = (productId: string) => lines.filter((l) => l.productId === productId).reduce((s, l) => s + l.qty, 0);

  const basket: BasketItem[] = lines.map((l) => {
    const p = byId.get(l.productId);
    return { key: l.key, name: p?.name ?? "", brand: p?.brand, image: p?.images[0], quantity: l.qty };
  });

  /** زوّد أو قلّل سطر (ولو وصل صفر بيتشال) */
  const change = (productId: string, choices: OptionChoice[], d: number) =>
    setLines((all) => {
      const key = lineKey(productId, choices);
      const cur = all.find((l) => l.key === key);
      if (!cur) return d > 0 ? [...all, { key, productId, choices, qty: d }] : all;
      return all.map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0);
    });

  function addToCart() {
    if (!size || count === 0 || overflow) return;
    addGift({
      kind: "box",
      title: t("بوكس {name}", { name: size.name }),
      refId: size.id,
      image: byId.get(lines[0]?.productId)?.images[0],
      basePrice: size.price,
      lines: lines.map((l) => {
        const p = byId.get(l.productId)!;
        return {
          productId: p.id,
          name: p.name,
          unitPrice: p.price,
          quantity: l.qty,
          customizable: p.isCustomizable,
          maxChars: p.customizationMaxChars,
          customKind: p.customizationKind,
          customization: "",
          options: p.options?.length ? p.options : undefined,
          choices: l.choices,
        };
      }),
      addons: [],
      prepDays: Math.max(0, ...lines.map((l) => byId.get(l.productId)?.prepDays ?? 0)),
    });
    setLines([]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="min-w-0 space-y-10">
        <section>
          <h2 className="mb-4 text-3xl text-brand"><span className="tabular text-candy">1.</span> {t("اختار حجم البوكس")}</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSizeId(s.id)}
                aria-pressed={s.id === sizeId}
                className={`relative rounded-2xl border-2 bg-paper p-3 text-center transition ${s.id === sizeId ? "-rotate-2 border-brand bg-brand-soft" : "border-line hover:border-brand"}`}
              >
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- صورة شكل البوكس من اللوحة (أي لينك)
                  <img src={s.image} alt="" className="mx-auto mb-2 aspect-square w-full max-w-24 rounded-xl object-cover" />
                )}
                <span className="block font-heading text-xl text-brand">{s.name}</span>
                <span className="tabular block text-sm">{egp(s.price, t)}</span>
                <span className="tabular block text-xs text-muted">{t("لحد {n} حاجات", { n: s.maxItems })}</span>
                {s.description && <span className="mt-1 block text-[11px] leading-4 text-muted">{s.description}</span>}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-3xl text-brand"><span className="tabular text-candy">2.</span> {t("املاه باللي يعجبك")}</h2>
          <div className="scroll-x mb-5">
            <button
              onClick={() => setCategory(null)}
              className={`chip ${!category ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2"}`}
            >
              {t("الكل")}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`chip ${category === c ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
            {shown.map((p) => {
              const n = qtyOf(p.id);
              const hasOptions = Boolean(p.options?.length);
              const open = picking === p.id;
              const draftMissing = open ? missingOptions(p.options, draft) : [];
              return (
                <div key={p.id} className={`flex flex-col ${open ? "col-span-2 sm:col-span-3" : ""}`}>
                  <div className={open ? "grid gap-4 rounded-2xl border border-ink p-3 sm:grid-cols-[10rem_1fr]" : ""}>
                    <div className={`polaroid transition-transform ${n ? "-rotate-2 ring-2 ring-brand" : ""}`}><GiftArt image={p.images[0]} label={p.name} className="aspect-square" /></div>
                    <div className="flex flex-1 flex-col pt-2.5">
                      <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                      <p className="tabular text-sm text-ink-2">
                        {egp(p.price + (open ? optionsPrice(p.options, draft) : 0), t)}
                        {n > 0 && hasOptions && <span className="text-xs text-brand"> · {t("في البوكس {n}", { n })}</span>}
                      </p>
                      {open ? (
                        // اللون/المقاس بيتختار هنا قبل ما المنتج يدخل البوكس، وفرق السعر بيبان على طول
                        <div className="mt-3 space-y-3">
                          <OptionPicker options={p.options!} choices={draft} onChange={setDraft} size="sm" />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={draftMissing.length > 0 || full}
                              onClick={() => {
                                change(p.id, draft, 1);
                                setPicking(null);
                                setDraft([]);
                              }}
                              className="btn-primary btn-sm flex-1"
                            >
                              {draftMissing.length
                                ? t("اختار {name} الأول", { name: t.locale === "en" ? draftMissing[0].en || draftMissing[0].name : draftMissing[0].name })
                                : t("حطه في البوكس")}
                            </button>
                            <button type="button" onClick={() => setPicking(null)} className="btn-outline btn-sm">
                              {t("إلغاء")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto pt-2">
                          {hasOptions ? (
                            <button
                              disabled={full}
                              onClick={() => {
                                setPicking(p.id);
                                setDraft([]);
                              }}
                              className="btn-outline btn-sm w-full"
                            >
                              {n ? t("ضيف لون أو مقاس تاني") : t("اختار وضيف")}
                            </button>
                          ) : n === 0 ? (
                            <button disabled={full} onClick={() => change(p.id, [], 1)} className="btn-outline btn-sm w-full">
                              {t("ضيف")}
                            </button>
                          ) : (
                            <div className="flex h-10 items-center justify-between rounded-full bg-brand text-white">
                              <button className="grid size-10 place-items-center" onClick={() => change(p.id, [], -1)} aria-label={t("شيل واحد")}><Icon name="minus" className="size-4" /></button>
                              <span className="tabular font-bold">{n}</span>
                              <button className="grid size-10 place-items-center disabled:opacity-30" disabled={full} onClick={() => change(p.id, [], 1)} aria-label={t("زوّد واحد")}><Icon name="plus" className="size-4" /></button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* الموبايل: شريط صغير فوق التنقل. الشاشات الكبيرة: ملخص كامل جنب المنتجات */}
      <aside className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-10 -mx-4 border-t border-line bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:top-36 lg:bottom-auto lg:mx-0 lg:rounded-2xl lg:border lg:p-5">
        <div className="hidden lg:block">
          <BasketReveal className="mb-4" title={t("استني… إيه اللي جوه بوكسك؟")} subtitle={t("بصي من قريب")} items={basket}>
            {basket.length === 0 && <p className="font-script text-lg">{t("اختاري أول حاجة وشوفيها بتقع هنا")}</p>}
          </BasketReveal>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">{t("البوكس بتاعك")}</p>
            <p className={`tabular text-sm ${overflow ? "font-semibold text-brand" : "text-muted"}`}>
              {count}/{size?.maxItems ?? 0}
            </p>
          </div>
          {lines.length > 0 && (
            <ul className="mb-3 space-y-1.5 text-sm">
              {lines.map((l) => {
                const p = byId.get(l.productId);
                const picked = describeChoices(p?.options, l.choices, t.locale);
                return (
                  <li key={l.key} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      {p?.name} <span className="tabular text-muted">× {l.qty}</span>
                      {picked && <span className="block text-xs text-ink-2">{picked}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular">{egp(unitOf(l) * l.qty, t)}</span>
                      <button type="button" onClick={() => change(l.productId, l.choices, -1)} aria-label={t("شيل واحد")} className="text-muted hover:text-brand">
                        <Icon name="minus" className="size-4" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <dl className="mb-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{t("المنتجات")}</dt><dd className="tabular">{egp(itemsTotal, t)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{t("البوكس ({name})", { name: size?.name ?? "" })}</dt><dd className="tabular">{egp(boxPrice, t)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{t("تغليف وتنسيق")}</dt><dd className="tabular">{egp(fee, t)}</dd></div>
          </dl>
        </div>
        <div className="flex items-center gap-4 lg:block">
          <div className="min-w-0 flex-1 lg:mb-3 lg:flex lg:justify-between">
            <p className="tabular text-lg leading-tight font-semibold lg:order-2">{egp(total, t)}</p>
            <p className={`tabular text-xs lg:text-base lg:font-semibold lg:text-ink ${overflow ? "font-semibold text-brand" : "text-muted"}`}>
              <span className="lg:hidden">{t("{n} من {max} · شامل التغليف", { n: count, max: size?.maxItems ?? 0 })}</span>
              <span className="hidden lg:inline">{t("الإجمالي")}</span>
            </p>
          </div>
          <button onClick={addToCart} disabled={count === 0 || overflow} className="btn-primary shrink-0 lg:w-full">
            {t("ضيف للسلة")}
          </button>
        </div>
        {overflow && <p className="mt-2 text-xs text-brand">{t("المنتجات أكتر من سعة البوكس. كبّر الحجم أو شيل حاجة.")}</p>}
        {lines.some((l) => byId.get(l.productId)?.isCustomizable) && (
          <p className="mt-2 text-xs leading-5 text-muted">{t("الكلام والصور للمنتجات المخصصة بتتكتب وتترفع في صفحة الدفع.")}</p>
        )}
      </aside>
      <BoxPreviewDock items={basket} />
    </div>
  );
}
