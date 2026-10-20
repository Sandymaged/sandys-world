"use client";

import { useT } from "@/i18n/client";
import { useMemo, useState } from "react";
import { egp } from "@/lib/format";
import { packagingFee } from "@/lib/pricing";
import type { StoreSettings } from "@/lib/settings";
import type { BoxSize, Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { GiftArt } from "./gift-art";
import { BasketReveal, type BasketItem } from "./basket-reveal";
import { BoxPreviewDock } from "./box-preview";
import { Icon } from "./icons";

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
  const [sizeId, setSizeId] = useState(sizes[1]?.id ?? sizes[0]?.id);
  const [qty, setQty] = useState<Record<string, number>>(
    initialProductId ? { [initialProductId]: 1 } : {},
  );
  const [category, setCategory] = useState<string | null>(null);

  const size = sizes.find((s) => s.id === sizeId);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const full = size ? count >= size.maxItems : true;
  const overflow = size ? count > size.maxItems : false;
  const chosen = products.filter((p) => qty[p.id]);
  const itemsTotal = chosen.reduce((s, p) => s + p.price * qty[p.id], 0);
  const boxPrice = size?.price ?? 0;
  const fee = count > 0 ? packagingFee(boxPrice + itemsTotal, packaging) : 0;
  const total = count > 0 ? boxPrice + itemsTotal + fee : 0;

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const shown = category ? products.filter((p) => p.category === category) : products;

  const byId = new Map(products.map((p) => [p.id, p]));
  // للسلة: كل منتج مرة واحدة بعدده، بترتيب الاختيار
  const basket: BasketItem[] = Object.entries(qty).map(([id, n]) => {
    const p = byId.get(id);
    return { key: id, name: p?.name ?? "", brand: p?.brand, image: p?.images[0], quantity: n };
  });

  const change = (id: string, d: number) =>
    setQty((s) => {
      const n = Math.max(0, (s[id] ?? 0) + d);
      const next = { ...s };
      if (n === 0) delete next[id];
      else next[id] = n;
      return next;
    });

  function addToCart() {
    if (!size || count === 0 || overflow) return;
    addGift({
      kind: "box",
      title: t("بوكس {name}", { name: size.name }),
      refId: size.id,
      image: chosen[0]?.images[0],
      basePrice: size.price,
      lines: chosen.map((p) => ({
        productId: p.id,
        name: p.name,
        unitPrice: p.price,
        quantity: qty[p.id],
        customizable: p.isCustomizable,
        maxChars: p.customizationMaxChars,
        customization: "",
        // الاختيارات (لون/مقاس/ريحة) بتتختار في السلة
        options: p.options?.length ? p.options : undefined,
      })),
      addons: [],
      prepDays: Math.max(0, ...chosen.map((p) => p.prepDays)),
    });
    setQty({});
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
              const n = qty[p.id] ?? 0;
              return (
                <div key={p.id} className="flex flex-col">
                  <div className={`polaroid transition-transform ${n ? "-rotate-2 ring-2 ring-brand" : ""}`}><GiftArt image={p.images[0]} label={p.name} className="aspect-square" /></div>
                  <div className="flex flex-1 flex-col pt-2.5">
                    <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                    <p className="tabular text-sm text-ink-2">{egp(p.price, t)}</p>
                    <div className="mt-auto pt-2">
                      {n === 0 ? (
                        <button
                          disabled={full}
                          onClick={() => change(p.id, 1)}
                          className="btn-outline btn-sm w-full"
                        >
                          {t("ضيف")}
                        </button>
                      ) : (
                        <div className="flex h-10 items-center justify-between rounded-full bg-brand text-white">
                          <button className="grid size-10 place-items-center" onClick={() => change(p.id, -1)} aria-label={t("شيل واحد")}><Icon name="minus" className="size-4" /></button>
                          <span className="tabular font-bold">{n}</span>
                          <button className="grid size-10 place-items-center disabled:opacity-30" disabled={full} onClick={() => change(p.id, 1)} aria-label={t("زوّد واحد")}><Icon name="plus" className="size-4" /></button>
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
          {chosen.length > 0 && (
            <ul className="mb-3 space-y-1 text-sm">
              {chosen.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>
                    {p.name} <span className="tabular text-muted">× {qty[p.id]}</span>
                  </span>
                  <span className="tabular">{egp(p.price * qty[p.id], t)}</span>
                </li>
              ))}
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
      </aside>
      <BoxPreviewDock items={basket} />
    </div>
  );
}
