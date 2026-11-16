"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { SaveResult } from "@/lib/admin-catalog-actions";
import { OPTIONS_EVENT } from "./options-editor";

/** فورم بيحفظ بـ server action، وبعد الحفظ بيرجع للقايمة */
export function CatalogForm({
  action,
  backTo,
  children,
}: {
  action: (f: FormData) => Promise<SaveResult>;
  backTo: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      action={(f) =>
        start(async () => {
          setError(null);
          const r = await action(f);
          if (r.ok) router.push(backTo);
          else setError(r.error);
        })
      }
      className="space-y-6"
    >
      {children}
      {error && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
      <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t border-dashed border-line bg-[#fbf7f2]/95 px-4 py-3 backdrop-blur">
        <button disabled={pending} className="btn-primary">{pending ? "جارٍ الحفظ…" : "حفظ"}</button>
        <button type="button" onClick={() => router.push(backTo)} className="btn-outline">إلغاء</button>
      </div>
    </form>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
      <h2 className="text-xl text-brand">{title}</h2>
      {children}
    </section>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  dir,
  required,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
  dir?: "ltr" | "rtl";
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        dir={dir}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className={`field ${type === "number" ? "tabular" : ""}`}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, defaultValue, rows = 3, dir, hint }: { label: string; name: string; defaultValue?: string | null; rows?: number; dir?: "ltr" | "rtl"; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={rows} dir={dir} defaultValue={defaultValue ?? ""} className="field h-auto py-3" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 accent-brand" />
      {label}
    </label>
  );
}

/**
 * السعر والتكلفة والبراند: التكلفة بتظهر (ولازم تتكتب) لمنتجات المتجر بس.
 * لو اخترتي براند بتختفي، لأن تكلفته نصيب البراند وبتتحسب لوحدها.
 */
export function PriceCostBrand({
  price,
  cost,
  partnerId,
  partners,
  prepDays,
}: {
  price?: number;
  cost?: number;
  partnerId?: string | null;
  partners: { id: string; name: string }[];
  prepDays: number;
}) {
  const [brand, setBrand] = useState(partnerId ?? "");
  return (
    <>
      <Row>
        <Select label="العلامة التجارية" name="partnerId" value={brand} onChange={setBrand} options={[{ value: "", label: "من المتجر نفسه" }, ...partners.map((b) => ({ value: b.id, label: b.name }))]} />
        <Field label="مدة التجهيز (أيام)" name="prepDays" type="number" defaultValue={prepDays} hint="صفر يعني إمكانية التوصيل اليوم" />
      </Row>
      <Row>
        <Field label="السعر (ج.م)" name="price" type="number" defaultValue={price} required />
        {brand ? (
          <div className="rounded-2xl bg-bg p-3 text-sm leading-6 text-ink-2">
            <p className="font-semibold text-ink">التكلفة</p>
            منتج علامة تجارية: لا حاجة لكتابة التكلفة، فهي تُحسب تلقائياً من نصيب العلامة التجارية (السعر ناقص عمولتك).
          </div>
        ) : (
          <Field label="التكلفة (ج.م)" name="cost" type="number" defaultValue={cost || ""} required placeholder="كم كلّفك المنتج؟" hint="ما كلّفك المنتج (وليس سعر البيع). لا تظهر للعميل، ويُحسب منها الربح في التقارير." />
        )}
      </Row>
    </>
  );
}

/**
 * عدد المنتج في المخزن: بيتقفل ويتفضّى لما المنتج يبقى ليه ألوان أو مقاسات
 * (العدد ساعتها بيتكتب لكل اختيار في الجدول فوق)
 */
export function StockField({ label, defaultValue, hasOptions: initial, hint }: { label: string; defaultValue: number | null | undefined; hasOptions: boolean; hint: string }) {
  const [hasOptions, setHasOptions] = useState(initial);
  useEffect(() => {
    const on = (e: Event) => setHasOptions(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(OPTIONS_EVENT, on);
    return () => window.removeEventListener(OPTIONS_EVENT, on);
  }, []);
  return (
    <div className={hasOptions ? "opacity-60" : ""}>
      <label className="label" htmlFor="stock">{label}</label>
      {hasOptions ? (
        <input id="stock" disabled value="" placeholder="يُكتب لكل لون أو مقاس بالأعلى" className="field" readOnly />
      ) : (
        <input id="stock" name="stock" type="number" min={0} defaultValue={defaultValue ?? ""} className="field tabular" />
      )}
      <p className="mt-1 text-xs leading-5 text-muted">{hasOptions ? "للمنتج ألوان أو مقاسات، لذا يُكتب العدد لكل منها في جدول الخيارات بالأعلى (أو يُترك فارغاً)." : hint}</p>
    </div>
  );
}

/**
 * المنتج المخصص: بيتكتب عليه اسم أو جملة، أو بيتطبع عليه صورة، أو الاتنين.
 * العميل بيكتب الكلام ويرفع الصورة في صفحة الدفع. خانة الحروف بتتفتح بس لو فيه كلام.
 */
export function CustomizationFields({
  defaultChecked,
  defaultMax,
  defaultKind = "text",
  hint,
}: {
  defaultChecked: boolean;
  defaultMax: number | null;
  defaultKind?: "text" | "image" | "both";
  hint: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  const [kind, setKind] = useState(defaultKind);
  const text = on && kind !== "image";
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-line p-4">
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input type="checkbox" name="isCustomizable" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-5 accent-brand" />
        المنتج يُخصَّص للعميل (اسم أو صورة)
      </label>
      <fieldset disabled={!on} className={on ? "" : "opacity-50"}>
        <legend className="label">ماذا يرسل العميل؟</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["text", "اسم أو جملة"],
              ["image", "صورة"],
              ["both", "صورة ونص"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="customizationKind" value={v} checked={kind === v} onChange={() => setKind(v)} className="peer sr-only" />
              <span className="chip border-line bg-white text-ink-2 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={text ? "" : "opacity-50"}>
        <label className="label" htmlFor="customizationMaxChars">أقصى عدد حروف للكتابة</label>
        <input id="customizationMaxChars" name="customizationMaxChars" type="number" min={1} disabled={!text} defaultValue={defaultMax ?? 25} className="field tabular max-w-40" />
      </div>
      <p className="text-xs leading-5 text-muted">{hint}</p>
    </div>
  );
}

export function ChecksGroup({ label, name, options, selected }: { label: string; name: string; options: { value: string; label: string }[]; selected: string[] }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="checkbox" name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="peer sr-only" />
            <span className="chip border-line bg-white text-ink-2 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  /** لو الاختيار بيأثر على خانات تانية في نفس الفورم */
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        {...(value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value) } : { defaultValue: defaultValue ?? "" })}
        className="field"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/** صورة: رفع ملف أو لينك، مع معاينة */
export function ImageField({ current, uploadLabel = "رفع صورة" }: { current?: string | null; uploadLabel?: string }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="polaroid w-32 shrink-0 -rotate-2">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- معاينة قبل الحفظ
          <img src={preview} alt="" className="aspect-square w-full object-cover" />
        ) : (
          <div className="grid aspect-square w-full place-items-center bg-surface text-xs text-muted">لا توجد صورة</div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <label className="label" htmlFor="imageFile">{uploadLabel}</label>
          <input
            id="imageFile"
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm file:me-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-white"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="imageUrl">أو رابط صورة</label>
          <input id="imageUrl" name="imageUrl" dir="ltr" defaultValue={current ?? ""} placeholder="https://..." className="field" onBlur={(e) => e.target.value && setPreview(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export interface PickerProduct {
  id: string;
  name: string;
  price: number;
  cost: number;
  available: boolean;
  /** اسم البراند لو المنتج بتاع براند (بياخد سعره كامل) */
  brand?: string | null;
}

/**
 * محتويات الباكدج: اختيار المنتجات والكميات، والنظام بيحسب التكلفة ويقترح سعر ويعرض الهامش (FR-111)،
 * وبينبّه لو الهامش أقل من الحد (FR-112)
 */
export function PackageItemsPicker({
  products,
  initial,
  initialPrice,
  minMargin,
}: {
  products: PickerProduct[];
  initial: { productId: string; quantity: number }[];
  initialPrice: number;
  minMargin: number;
}) {
  const [items, setItems] = useState(initial);
  const [price, setPrice] = useState(initialPrice || 0);
  const [pick, setPick] = useState("");
  const byId = new Map(products.map((p) => [p.id, p]));
  const cost = items.reduce((s, i) => s + (byId.get(i.productId)?.cost ?? 0) * i.quantity, 0);
  const retail = items.reduce((s, i) => s + (byId.get(i.productId)?.price ?? 0) * i.quantity, 0);
  // سعر مقترح: التكلفة + هامش 45% + 40 ج.م تغليف، متقرّب لأقرب 10
  const suggested = cost ? Math.ceil((cost / (1 - 0.45) + 40) / 10) * 10 : 0;
  const margin = price > 0 ? (price - cost) / price : 0;
  const low = price > 0 && items.length > 0 && margin < minMargin;
  // نصيب البراندات: سعر منتجاتهم كامل، والفرق لو الباكدج أرخص بيتخصم من مكسبك
  const brandShare = items.reduce((s, i) => {
    const p = byId.get(i.productId);
    return p?.brand ? s + p.price * i.quantity : s;
  }, 0);
  const loss = price > 0 && items.length > 0 && price < cost;

  return (
    <div className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className="field" aria-label="اختر منتجاً">
          <option value="">اختر منتجاً لإضافته…</option>
          {products
            .filter((p) => !items.some((i) => i.productId === p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.price} ج.م {p.available ? "" : "(غير متاح)"}
              </option>
            ))}
        </select>
        <button
          type="button"
          disabled={!pick}
          onClick={() => {
            setItems((s) => [...s, { productId: pick, quantity: 1 }]);
            setPick("");
          }}
          className="btn-outline btn-sm h-12 shrink-0"
        >
          إضافة
        </button>
      </div>

      {items.length > 0 && (
        <ul className="divide-y divide-dashed divide-line border border-dashed border-line">
          {items.map((i) => {
            const p = byId.get(i.productId);
            return (
              <li key={i.productId} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{p?.name ?? "منتج محذوف"}</span>
                {p?.brand && <span className="rounded-full bg-lilac/10 px-2 py-0.5 text-[11px] text-lilac">{p.brand}</span>}
                <span className="tabular text-xs text-muted">{p?.brand ? "للعلامة التجارية" : "تكلفة"} {p?.cost ?? 0}</span>
                <input
                  type="number"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => setItems((s) => s.map((x) => (x.productId === i.productId ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x)))}
                  className="field tabular h-9 w-16 px-2"
                  aria-label="الكمية"
                />
                <button type="button" onClick={() => setItems((s) => s.filter((x) => x.productId !== i.productId))} className="text-xs text-brand underline">
                  إزالة
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-3 rounded-xl bg-surface p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted">التكلفة</p>
          <p className="tabular font-semibold">{cost} ج.م</p>
        </div>
        <div>
          <p className="text-muted">عند بيعها منفردة</p>
          <p className="tabular font-semibold">{retail} ج.م</p>
        </div>
        <div>
          <p className="text-muted">سعر مقترح</p>
          <button type="button" onClick={() => setPrice(suggested)} className="tabular font-semibold text-brand underline" disabled={!suggested}>
            {suggested} ج.م
          </button>
        </div>
        <div>
          <p className="text-muted">الهامش</p>
          <p className={`tabular font-semibold ${low ? "text-brand" : "text-success"}`}>{price ? `${Math.round(margin * 100)}%` : "—"}</p>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="price">سعر الباقة (شامل التغليف)</label>
        <input id="price" name="price" type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} className="field tabular" required />
        {loss ? (
          <p className="mt-2 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">
            تخسر {cost - price} ج.م في كل باقة: السعر أقل من التكلفة
            {brandShare > 0 && <> (منها {brandShare} ج.م للعلامات التجارية، إذ تحصل على سعر منتجاتها كاملاً حتى داخل الباقة)</>}.
          </p>
        ) : (
          low && (
            <p className="mt-2 rounded-xl bg-butter-soft p-3 text-sm text-butter">
              الهامش أقل من {Math.round(minMargin * 100)}%. راجع السعر أو المحتويات.
              {brandShare > 0 && <> منتجات العلامات التجارية ({brandShare} ج.م) تُحسب بسعرها كاملاً، لأن العلامة التجارية تحصل عليه كله.</>}
            </p>
          )
        )}
        {!loss && !low && brandShare > 0 && price > 0 && (
          <p className="mt-2 text-xs text-muted">من سعر الباقة: {brandShare} ج.م للعلامات التجارية، والباقي {price - brandShare} ج.م لك (التغليف ومنتجاتك وربحك).</p>
        )}
      </div>
    </div>
  );
}
