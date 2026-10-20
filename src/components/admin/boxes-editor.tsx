"use client";

import { useState } from "react";
import type { WrappingOption } from "@/lib/settings";
import type { BoxSize } from "@/lib/types";

interface DraftBox {
  id: string;
  name: string;
  nameEn: string;
  price: string;
  maxItems: string;
  description: string;
  image: string;
  isActive: boolean;
}
interface DraftWrap {
  id: string;
  name: string;
  en: string;
  price: string;
  description: string;
  descriptionEn: string;
  image: string;
}

function Thumb({ src }: { src: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- معاينة صورة من اللوحة (أي لينك)
    <img src={src} alt="" className="size-16 shrink-0 rounded-xl border border-line object-cover" />
  ) : (
    <span className="grid size-16 shrink-0 place-items-center rounded-xl border border-dashed border-line text-2xl text-muted" aria-hidden>
      🎁
    </span>
  );
}

/** مقاسات البوكسات واختيارات التغليف: صف لكل واحد، وكل صف ليه صورة (لينك أو رفع) */
export function BoxesEditor({ boxes, wrappings }: { boxes: BoxSize[]; wrappings: WrappingOption[] }) {
  const [bs, setBs] = useState<DraftBox[]>(() =>
    boxes.map((b) => ({
      id: b.id,
      name: b.name,
      nameEn: b.en?.name ?? "",
      price: String(b.price),
      maxItems: String(b.maxItems),
      description: b.description ?? "",
      image: b.image ?? "",
      isActive: b.isActive !== false,
    })),
  );
  const [ws, setWs] = useState<DraftWrap[]>(() =>
    wrappings.map((w) => ({ id: w.id, name: w.name, en: w.en ?? "", price: String(w.price || ""), description: w.description ?? "", descriptionEn: w.descriptionEn ?? "", image: w.image ?? "" })),
  );
  const setB = (i: number, p: Partial<DraftBox>) => setBs((all) => all.map((b, k) => (k === i ? { ...b, ...p } : b)));
  const setW = (i: number, p: Partial<DraftWrap>) => setWs((all) => all.map((w, k) => (k === i ? { ...w, ...p } : w)));

  return (
    <div className="space-y-8">
      <input type="hidden" name="boxes" value={JSON.stringify(bs)} />
      <input type="hidden" name="wrappings" value={JSON.stringify(ws)} />

      <div className="space-y-3">
        <h3 className="font-semibold">مقاسات البوكسات</h3>
        {bs.map((b, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-line bg-bg p-4 sm:grid-cols-[auto_1fr]">
            <Thumb src={b.image} />
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="block sm:col-span-2">
                  <span className="label">الاسم</span>
                  <input className="field" value={b.name} onChange={(e) => setB(i, { name: e.target.value })} placeholder="وسط" />
                </label>
                <label className="block">
                  <span className="label">السعر (ج.م)</span>
                  <input className="field tabular" inputMode="numeric" value={b.price} onChange={(e) => setB(i, { price: e.target.value.replace(/\D/g, "") })} />
                </label>
                <label className="block">
                  <span className="label">بيساع كام حاجة</span>
                  <input className="field tabular" inputMode="numeric" value={b.maxItems} onChange={(e) => setB(i, { maxItems: e.target.value.replace(/\D/g, "") })} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">الاسم بالإنجليزي</span>
                  <input className="field" dir="ltr" value={b.nameEn} onChange={(e) => setB(i, { nameEn: e.target.value })} placeholder="Medium" />
                </label>
                <label className="block">
                  <span className="label">وصف قصير (الشكل والمقاس)</span>
                  <input className="field" value={b.description} onChange={(e) => setB(i, { description: e.target.value })} placeholder="علبة كرتون مقوى ٢٥×٢٠ سم" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">لينك صورة الشكل</span>
                  <input className="field" dir="ltr" value={b.image} onChange={(e) => setB(i, { image: e.target.value })} placeholder="https://…" />
                </label>
                <label className="block">
                  <span className="label">أو ارفعي صورة</span>
                  <input type="file" name={`bimg_${i}`} accept="image/jpeg,image/png,image/webp" className="field py-2" />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="size-5 accent-brand" checked={b.isActive} onChange={(e) => setB(i, { isActive: e.target.checked })} />
                  مفتوح للعملاء
                </label>
                <button type="button" onClick={() => setBs((all) => all.filter((_, k) => k !== i))} className="text-muted underline-offset-4 hover:text-brand hover:underline">
                  مسح البوكس
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setBs((all) => [...all, { id: "", name: "", nameEn: "", price: "", maxItems: "4", description: "", image: "", isActive: true }])}
          className="btn-outline btn-sm"
        >
          + بوكس جديد
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">اختيارات التغليف للعميل</h3>
        <p className="text-sm text-muted">العميل بيختار واحد منهم لكل هدية في السلة. خلي أول واحد هو العادي (من غير زيادة).</p>
        {ws.map((w, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-line bg-bg p-4 sm:grid-cols-[auto_1fr]">
            <Thumb src={w.image} />
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="label">الاسم</span>
                  <input className="field" value={w.name} onChange={(e) => setW(i, { name: e.target.value })} placeholder="علبة فاخرة" />
                </label>
                <label className="block">
                  <span className="label">بالإنجليزي</span>
                  <input className="field" dir="ltr" value={w.en} onChange={(e) => setW(i, { en: e.target.value })} placeholder="Luxury box" />
                </label>
                <label className="block">
                  <span className="label">زيادة على الهدية (ج.م)</span>
                  <input className="field tabular" inputMode="numeric" value={w.price} onChange={(e) => setW(i, { price: e.target.value.replace(/\D/g, "") })} placeholder="0" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">وصف قصير</span>
                  <input className="field" value={w.description} onChange={(e) => setW(i, { description: e.target.value })} placeholder="علبة بغطا مغناطيس وشريطة ستان" />
                </label>
                <label className="block">
                  <span className="label">الوصف بالإنجليزي</span>
                  <input className="field" dir="ltr" value={w.descriptionEn} onChange={(e) => setW(i, { descriptionEn: e.target.value })} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">لينك الصورة</span>
                  <input className="field" dir="ltr" value={w.image} onChange={(e) => setW(i, { image: e.target.value })} placeholder="https://…" />
                </label>
                <label className="block">
                  <span className="label">أو ارفعي صورة</span>
                  <input type="file" name={`wimg_${i}`} accept="image/jpeg,image/png,image/webp" className="field py-2" />
                </label>
              </div>
              {ws.length > 1 && (
                <button type="button" onClick={() => setWs((all) => all.filter((_, k) => k !== i))} className="text-sm text-muted underline-offset-4 hover:text-brand hover:underline">
                  مسح الاختيار
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setWs((all) => [...all, { id: "", name: "", en: "", price: "", description: "", descriptionEn: "", image: "" }])}
          className="btn-outline btn-sm"
        >
          + اختيار تغليف جديد
        </button>
      </div>
    </div>
  );
}
