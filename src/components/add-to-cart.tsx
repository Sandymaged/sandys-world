"use client";

import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CartLine } from "@/lib/cart";
import { egp } from "@/lib/format";
import { missingOptions, optionsPrice, type OptionChoice } from "@/lib/options";
import { needsImage, needsText, type BoxSize, type PackageView, type Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { GiftArt } from "./gift-art";
import { Icon } from "./icons";
import { OptionPicker } from "./option-picker";

/**
 * المنتج المخصص: الكلام والصورة بيتملوا في صفحة الدفع، فهنا بنقوله ده بس قبل ما يضيف
 */
function CustomizationNote({ products, textHere = false }: { products: Pick<Product, "name" | "customizationKind">[]; textHere?: boolean }) {
  const t = useT();
  if (!products.length) return null;
  const image = products.some((p) => needsImage(p.customizationKind));
  const text = products.some((p) => needsText(p.customizationKind));
  return (
    <p className="flex gap-2.5 rounded-2xl bg-lilac-soft p-3.5 text-sm leading-6 text-ink-2">
      <Icon name={image ? "camera" : "pen"} className="mt-0.5 size-5 shrink-0 text-lilac" />
      <span>
        {/* لو خانة الكلام موجودة فوق، مش محتاجين نقول «هتكتبه في الدفع» */}
        {image && text && !textHere
          ? `${t("هتكتب الكلام وترفع الصورة اللي هتتطبع في صفحة الدفع.")} ${t("وهنبعتلك شكل التصميم توافق عليه قبل التنفيذ.")}`
          : image
            ? `${t("هترفع الصورة اللي هتتطبع في صفحة الدفع.")} ${t("وهنبعتلك شكل التصميم توافق عليه قبل التنفيذ.")}`
            : text && !textHere
              ? `${t("هتكتب الاسم أو الجملة اللي هتتكتب في صفحة الدفع.")} ${t("وهنبعتلك شكل التصميم توافق عليه قبل التنفيذ.")}`
              : t("سنرسل لك شكل التصميم لتوافق عليه قبل التنفيذ.")}
      </span>
    </p>
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
      customKind: p.customizationKind,
      customization: "",
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

      <CustomizationNote products={customizable} />

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
  const [qty, setQty] = useState(1);
  const [choices, setChoices] = useState<OptionChoice[]>([]);
  // الاسم أو الجملة: يقدر يكتبها هنا وهو شايف المنتج (اختياري)، وبتتملا لوحدها في صفحة الدفع
  const [text, setText] = useState("");
  const wantsText = product.isCustomizable && needsText(product.customizationKind);
  const maxChars = product.customizationMaxChars ?? 40;
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
          customKind: product.customizationKind,
          customization: wantsText ? text.trim().slice(0, maxChars) : "",
          options: product.options?.length ? product.options : undefined,
          choices,
        },
      ],
      addons: [],
      prepDays: product.prepDays,
    });
    setText("");
    done();
  }

  return (
    <div className="space-y-6">
      {product.options?.length ? <OptionPicker options={product.options} choices={choices} onChange={setChoices} /> : null}
      {wantsText && (
        <div className="space-y-1.5">
          <label htmlFor="custom-text" className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="pen" className="size-4 text-brand" />
            {t("الاسم أو الجملة المطلوب كتابتها")}
          </label>
          <input
            id="custom-text"
            className="field"
            value={text}
            maxLength={maxChars}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("مثلاً: سلمى")}
          />
          <p className="flex justify-between gap-3 text-[13px] text-ink-2">
            <span>{t("يمكنك كتابته الآن أو لاحقاً في صفحة الدفع.")}</span>
            <span className="tabular shrink-0">{text.length}/{maxChars}</span>
          </p>
        </div>
      )}
      {product.isCustomizable && <CustomizationNote products={[product]} textHere={wantsText} />}
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
