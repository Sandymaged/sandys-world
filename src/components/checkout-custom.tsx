"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { customLines, type CartGift } from "@/lib/cart";
import { uploadCustomImage } from "@/lib/custom-image-actions";
import { describeChoices } from "@/lib/options";
import { shrinkImage } from "@/lib/shrink-image";
import { needsImage, needsText } from "@/lib/types";
import { useCart } from "@/store/cart";
import { Icon } from "./icons";

/**
 * صفحة الدفع: الكلام اللي هيتكتب والصور اللي هتتطبع على المنتجات المخصصة.
 * الصورة بتتصغّر وتترفع على طول (قبل تأكيد الطلب)، وبنحفظ اسمها في السلة.
 */
export function CheckoutCustomizations({ gifts, showErrors }: { gifts: CartGift[]; showErrors: boolean }) {
  const t = useT();
  const updateGift = useCart((s) => s.updateGift);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // معاينة الصورة اللي اترفعت في الجلسة دي (اللي اترفعت قبل كده بيبان إنها اترفعت بس)
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const items = customLines(gifts);
  if (!items.length) return null;

  const setLine = (gift: CartGift, index: number, patch: Partial<CartGift["lines"][number]>) =>
    updateGift(gift.id, { lines: gift.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) });

  async function upload(gift: CartGift, index: number, key: string, file: File | undefined) {
    if (!file) return;
    setBusy(key);
    setErrors((e) => ({ ...e, [key]: "" }));
    try {
      const small = await shrinkImage(file, 2000);
      const f = new FormData();
      f.set("image", small);
      const r = await uploadCustomImage(t.locale, f);
      if (!r.ok) throw new Error(r.error);
      setLine(gift, index, { customImage: r.file });
      setPreviews((p) => ({ ...p, [key]: URL.createObjectURL(small) }));
    } catch (e) {
      setErrors((x) => ({ ...x, [key]: e instanceof Error && e.message !== "shrink failed" ? e.message : t("الصورة دي مش مدعومة. جرب JPG أو PNG.") }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="customizations" className="card space-y-5 p-4">
      <div>
        <h2 className="font-semibold">{t("الكلام والصور على الهدايا")}</h2>
        <p className="mt-0.5 text-xs text-muted">{t("هنبعتلك شكل التصميم على واتساب توافق عليه قبل التنفيذ.")}</p>
      </div>
      {items.map(({ gift, line, index, missingText, missingImage }) => {
        const key = `${gift.id}-${index}`;
        const max = line.maxChars ?? 30;
        const picked = describeChoices(line.options, line.choices, t.locale);
        return (
          <div key={key} className="space-y-3 rounded-2xl border border-line p-3.5">
            <p className="text-sm font-semibold">
              {line.name}
              {picked && <span className="font-normal text-ink-2"> ({picked})</span>}
              {gift.kind !== "product" && <span className="font-normal text-muted"> · {gift.title}</span>}
            </p>
            {needsText(line.customKind) && (
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="label" htmlFor={`ct-${key}`}>{t("الاسم أو الجملة اللي هتتكتب")}</label>
                  <span className="tabular text-xs text-muted">{(line.customization ?? "").length}/{max}</span>
                </div>
                <input
                  id={`ct-${key}`}
                  className={`field ${showErrors && missingText ? "border-brand" : ""}`}
                  value={line.customization ?? ""}
                  maxLength={max}
                  placeholder={t("مثلاً: ماما حبيبتي")}
                  onChange={(e) => setLine(gift, index, { customization: e.target.value })}
                />
                {showErrors && missingText && <p className="mt-1 text-xs font-medium text-brand">{t("اكتب الكلام اللي هيتكتب")}</p>}
              </div>
            )}
            {needsImage(line.customKind) && (
              <div>
                <p className="label">{t("الصورة اللي هتتطبع")}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {previews[key] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- معاينة الصورة اللي العميل رفعها
                    <img src={previews[key]} alt="" className="size-16 rounded-xl object-cover" />
                  ) : line.customImage ? (
                    <span className="grid size-16 place-items-center rounded-xl bg-success-soft text-success"><Icon name="check" className="size-6" /></span>
                  ) : null}
                  <label className={`btn-outline btn-sm cursor-pointer ${busy === key ? "pointer-events-none opacity-60" : ""} ${showErrors && missingImage ? "border-brand text-brand" : ""}`}>
                    <Icon name="camera" className="size-4" />
                    {busy === key ? t("بنرفع الصورة…") : line.customImage ? t("غيّر الصورة") : t("ارفع الصورة")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        upload(gift, index, key, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {line.customImage && !busy && <span className="text-xs text-success">{t("الصورة اترفعت ✓")}</span>}
                </div>
                {errors[key] && <p className="mt-1 text-xs font-medium text-brand">{errors[key]}</p>}
                {showErrors && missingImage && !errors[key] && <p className="mt-1 text-xs font-medium text-brand">{t("ارفع الصورة اللي هتتطبع")}</p>}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
