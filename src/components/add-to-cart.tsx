"use client";

import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CartLine } from "@/lib/cart";
import { egp } from "@/lib/format";
import type { PackageView, Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { GiftArt } from "./gift-art";
import { Icon } from "./icons";

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

export function AddPackage({ pkg, addons }: { pkg: PackageView; addons: Product[] }) {
  const t = useT();
  const { added, done } = useAddFeedback();
  const addGift = useCart((s) => s.addGift);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});

  const customizable = pkg.products.filter((p) => p.isCustomizable);
  const addonTotal = addons.reduce((s, a) => s + (picked[a.id] ?? 0) * a.price, 0);

  function add() {
    const lines: CartLine[] = pkg.products.map((p) => ({
      productId: p.id,
      name: p.name,
      unitPrice: 0,
      quantity: p.quantity,
      customizable: p.isCustomizable,
      maxChars: p.customizationMaxChars,
      customization: custom[p.id] ?? "",
    }));
    const addonLines: CartLine[] = addons
      .filter((a) => picked[a.id])
      .map((a) => ({ productId: a.id, name: a.name, unitPrice: a.price, quantity: picked[a.id] }));
    addGift({
      kind: "package",
      title: pkg.name,
      slug: pkg.slug,
      refId: pkg.id,
      image: pkg.images[0],
      basePrice: pkg.price,
      lines,
      addons: addonLines,
      prepDays: Math.max(pkg.prepDays, ...addons.filter((a) => picked[a.id]).map((a) => a.prepDays)),
    });
    done();
  }

  return (
    <div className="space-y-7">
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
        <button onClick={add} disabled={added} className={`btn-primary w-full ${added ? "!bg-success !opacity-100" : ""}`}>
          {added ? (
            <AddedLabel />
          ) : (
            <>
              {t("ضيف للسلة")}
              <span className="tabular opacity-90">· {egp(pkg.price + addonTotal, t)}</span>
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

  function add() {
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
        },
      ],
      addons: [],
      prepDays: product.prepDays,
    });
    done();
  }

  return (
    <div className="space-y-6">
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
          <button onClick={add} disabled={added} className={`btn-primary w-full ${added ? "!bg-success !opacity-100" : ""}`}>
            {added ? (
              <AddedLabel />
            ) : (
              <>
                {t("ابعته هدية")}
                <span className="tabular opacity-90">· {egp(product.price * qty, t)}</span>
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
