"use client";

import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CartLine } from "@/lib/cart";
import { egp } from "@/lib/format";
import { missingOptions, optionsPrice, type OptionChoice } from "@/lib/options";
import type { BoxSize, PackageView, Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { GiftArt } from "./gift-art";
import { Icon } from "./icons";
import { OptionPicker } from "./option-picker";

function CustomizationInput({
  product,
  value,
  onChange,
}: {
  product: Pick<Product, "id" | "name" | "customizationMaxChars">;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const max = product.customizationMaxChars ?? 30;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="label" htmlFor={`c-${product.id}`}>
          {t("الاسم أو الجملة على {name}", { name: product.name })}
        </label>
        <span className="tabular text-xs text-muted">{value.length}/{max}</span>
      </div>
      <input
        id={`c-${product.id}`}
        className="field"
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("مثلاً: ماما حبيبتي")}
      />
    </div>
  );
}

/** بعد الإضافة: الزرار بيقلب لعلامة صح لحظة، ودرج السلة بيفتح (من الـ store) */
function useAddFeedback() {
  const [added, setAdded] = useState(false);
  const done = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };
  return { added, done };
}

function AddedLabel() {
  const t = useT();
  return (
    <span className="flex animate-pop items-center gap-2">
      <Icon name="check" className="size-5" />
      {t("اتضافت للسلة")}
    </span>
  );
}

/** زرار الشراء: ثابت فوق شريط التنقل في الموبايل، وعادي في الشاشات الكبيرة */
function BuyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-20 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
      {children}
    </div>
  );
}

export function AddPackage({ pkg, addons, boxes = [] }: { pkg: PackageView; addons: Product[]; boxes?: BoxSize[] }) {
  const t = useT();
  const { added, done } = useAddFeedback();
  const addGift = useCart((s) => s.addGift);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [choices, setChoices] = useState<Record<string, OptionChoice[]>>({});
  // البوكس اختياري: المقاسات اللي المتجر حددها للباكدج ده، وفاضي = من غير بوكس
  const [boxId, setBoxId] = useState("");
  const box = boxes.find((b) => b.id === boxId);

  const customizable = pkg.products.filter((p) => p.isCustomizable);
  const withOptions = pkg.products.filter((p) => p.options?.length);
  const addonTotal = addons.reduce((s, a) => s + (picked[a.id] ?? 0) * a.price, 0);
  // مينفعش يتضاف للسلة قبل ما كل لون/مقاس جوه الباكدج يتختار
  const missing = withOptions.flatMap((p) => missingOptions(p.options, choices[p.id]));

  function add() {
    if (missing.length) return;
    const lines: CartLine[] = pkg.products.map((p) => ({
      productId: p.id,
      name: p.name,
      unitPrice: 0,
      quantity: p.quantity,
      customizable: p.isCustomizable,
      maxChars: p.customizationMaxChars,
      customization: custom[p.id] ?? "",
      options: p.options?.length ? p.options : undefined,
      choices: choices[p.id] ?? [],
    }));
    const addonLines: CartLine[] = addons
      .filter((a) => picked[a.id])
      .map((a) => ({ productId: a.id, name: a.name, unitPrice: a.price, quantity: picked[a.id] }));
    addGift({
      kind: "package",
      title: box ? `${pkg.name} + ${t("بوكس {name}", { name: t.locale === "en" ? box.en?.name || box.name : box.name })}` : pkg.name,
      slug: pkg.slug,
      refId: pkg.id,
      image: pkg.images[0],
      basePrice: pkg.price + (box?.price ?? 0),
      boxSizeId: box?.id,
      lines,
      addons: addonLines,
      prepDays: Math.max(pkg.prepDays, ...addons.filter((a) => picked[a.id]).map((a) => a.prepDays)),
    });
    done();
  }

  return (
    <div className="space-y-7">
      {withOptions.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-sm font-semibold">{t("اختار اللي يناسبك")}</h2>
          {withOptions.map((p) => (
            <div key={p.id} className="space-y-2">
              {withOptions.length > 1 && <p className="text-sm text-muted">{p.name}</p>}
              <OptionPicker
                options={p.options!}
                choices={choices[p.id] ?? []}
                onChange={(next) => setChoices((c) => ({ ...c, [p.id]: next }))}
                showPrices={false}
                size="sm"
              />
            </div>
          ))}
        </section>
      )}

      {customizable.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">{t("التخصيص")}</h2>
          {customizable.map((p) => (
            <CustomizationInput
              key={p.id}
              product={p}
              value={custom[p.id] ?? ""}
              onChange={(v) => setCustom((c) => ({ ...c, [p.id]: v }))}
            />
          ))}
          <p className="text-xs leading-5 text-muted">{t("ممكن تكتبه بعدين من السلة. هنبعتلك شكل التصميم توافق عليه قبل التنفيذ.")}</p>
        </section>
      )}

      {boxes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t("عايز الباكدج في بوكس؟")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {[{ id: "", name: t("من غير بوكس"), price: 0, image: null as string | null, description: t("بيتغلّف عادي.") }, ...boxes.map((b) => ({ id: b.id, name: t("بوكس {name}", { name: t.locale === "en" ? b.en?.name || b.name : b.name }), price: b.price, image: b.image ?? null, description: b.description ?? "" }))].map((b) => {
              const on = boxId === b.id;
              return (
                <button
                  key={b.id || "none"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setBoxId(b.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 text-start transition ${on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40"}`}
                >
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- صور البوكسات من اللوحة
                    <img src={b.image} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blush text-xl" aria-hidden>{b.id ? "📦" : "🎀"}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{b.name}</span>
                    {b.description && <span className="block text-xs leading-5 text-muted">{b.description}</span>}
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold">{b.price ? `+${egp(b.price, t)}` : t("من غير زيادة")}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {addons.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">{t("ضيف على الباكدج")}</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {addons.map((a) => {
              const on = Boolean(picked[a.id]);
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((s) => {
                      const next = { ...s };
                      if (on) delete next[a.id];
                      else next[a.id] = 1;
                      return next;
                    })
                  }
                  className={`relative overflow-hidden rounded-xl border text-start transition ${on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40"}`}
                >
                  <GiftArt image={a.images[0]} label={a.name} className="aspect-square" sizes="120px" />
                  {on && (
                    <span className="absolute top-2 left-2 grid size-6 place-items-center rounded-full bg-ink text-white">
                      <Icon name="check" className="size-4" />
                    </span>
                  )}
                  <span className="block p-2">
                    <span className="block truncate text-xs font-medium">{a.name}</span>
                    <span className="tabular block text-xs text-muted">+{egp(a.price, t)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <BuyBar>
        <button onClick={add} disabled={added || missing.length > 0} className={`btn-primary w-full ${added ? "!bg-success !opacity-100" : ""}`}>
          {added ? (
            <AddedLabel />
          ) : missing.length ? (
            t("اختار {name} الأول", { name: t.locale === "en" ? missing[0].en || missing[0].name : missing[0].name })
          ) : (
            <>
              {t("ضيف للسلة")}
              <span className="tabular opacity-90">· {egp(pkg.price + (box?.price ?? 0) + addonTotal, t)}</span>
            </>
          )}
        </button>
      </BuyBar>
    </div>
  );
}

export function AddProduct({ product }: { product: Product }) {
  const t = useT();
  const router = useRouter();
  const { added, done } = useAddFeedback();
  const addGift = useCart((s) => s.addGift);
  const [custom, setCustom] = useState("");
  const [qty, setQty] = useState(1);
  const [choices, setChoices] = useState<OptionChoice[]>([]);
  const missing = missingOptions(product.options, choices);
  const unit = product.price + optionsPrice(product.options, choices);

  function add() {
    if (missing.length) return;
    addGift({
      kind: "product",
      title: product.name,
      slug: product.slug,
      refId: product.id,
      image: product.images[0],
      basePrice: 0,
      lines: [
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: qty,
          customizable: product.isCustomizable,
          maxChars: product.customizationMaxChars,
          customization: custom,
          options: product.options?.length ? product.options : undefined,
          choices,
        },
      ],
      addons: [],
      prepDays: product.prepDays,
    });
    done();
  }

  return (
    <div className="space-y-6">
      {product.options?.length ? <OptionPicker options={product.options} choices={choices} onChange={setChoices} /> : null}
      {product.isCustomizable && <CustomizationInput product={product} value={custom} onChange={setCustom} />}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{t("الكمية")}</span>
        <div className="flex items-center rounded-full border border-line">
          <button className="grid size-10 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("قلّل الكمية")}>
            <Icon name="minus" className="size-4" />
          </button>
          <span className="tabular w-8 text-center font-semibold">{qty}</span>
          <button className="grid size-10 place-items-center" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label={t("زوّد الكمية")}>
            <Icon name="plus" className="size-4" />
          </button>
        </div>
      </div>
      <BuyBar>
        <div className="grid gap-2">
          <button onClick={add} disabled={added || missing.length > 0} className={`btn-primary w-full ${added ? "!bg-success !opacity-100" : ""}`}>
            {added ? (
              <AddedLabel />
            ) : missing.length ? (
              t("اختار {name} الأول", { name: t.locale === "en" ? missing[0].en || missing[0].name : missing[0].name })
            ) : (
              <>
                {t("ضيف للسلة")}
                <span className="tabular opacity-90">· {egp(unit * qty, t)}</span>
              </>
            )}
          </button>
          {product.boxEligible && (
            <button onClick={() => router.push(`/box?add=${product.slug}`)} className="btn-outline w-full">
              {t("حطه في بوكس مع حاجات تانية")}
            </button>
          )}
        </div>
      </BuyBar>
    </div>
  );
}
