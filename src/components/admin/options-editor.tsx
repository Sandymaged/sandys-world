"use client";

import { useState } from "react";
import { MAX_OPTIONS, MAX_VALUES, optionKinds, type OptionKind, type ProductOption } from "@/lib/options";

/** في الفورم: قيم الاختيارات بتتكتب كنص، وبتتحول وتتنضف على السيرفر (normalizeOptions) */
interface DraftValue {
  id?: string;
  label: string;
  en: string;
  color: string;
  priceDelta: string;
  available: boolean;
  stock: string;
}
interface DraftOption {
  id?: string;
  name: string;
  en: string;
  kind: OptionKind;
  values: DraftValue[];
}

const emptyValue = (): DraftValue => ({ label: "", en: "", color: "#d9a5ae", priceDelta: "", available: true, stock: "" });

const toDraft = (options: ProductOption[]): DraftOption[] =>
  options.map((o) => ({
    id: o.id,
    name: o.name,
    en: o.en ?? "",
    kind: o.kind,
    values: o.values.map((v) => ({
      id: v.id,
      label: v.label,
      en: v.en ?? "",
      color: v.color ?? "#d9a5ae",
      priceDelta: v.priceDelta ? String(v.priceDelta) : "",
      available: v.available,
      stock: v.stock == null ? "" : String(v.stock),
    })),
  }));

/**
 * اختيارات المنتج في اللوحة: لحد ٣ اختيارات (لون، مقاس، ريحة…)، وكل قيمة ليها:
 * متاحة ولا خلصت، العدد في المخزن (فاضي = مفتوح)، وفرق السعر.
 */
export function OptionsEditor({ initial }: { initial: ProductOption[] }) {
  const [options, setOptions] = useState<DraftOption[]>(() => toDraft(initial));

  const setOption = (i: number, patch: Partial<DraftOption>) => setOptions((all) => all.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  const setValue = (i: number, j: number, patch: Partial<DraftValue>) =>
    setOptions((all) => all.map((o, k) => (k === i ? { ...o, values: o.values.map((v, m) => (m === j ? { ...v, ...patch } : v)) } : o)));

  const json = JSON.stringify(
    options.map((o) => ({
      ...o,
      values: o.values.map((v) => ({ ...v, color: o.kind === "color" ? v.color : null })),
    })),
  );

  return (
    <div className="space-y-4">
      <input type="hidden" name="options" value={json} />
      {options.length === 0 && <p className="text-sm text-muted">مفيش اختيارات. لو المنتج ليه ألوان أو مقاسات أو ريحة، ضيفيها من الزرار تحت.</p>}

      {options.map((o, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-line bg-bg p-4">
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="label">النوع</span>
              <select
                className="field"
                value={o.kind}
                onChange={(e) => {
                  const kind = e.target.value as OptionKind;
                  const k = optionKinds.find((x) => x.id === kind)!;
                  setOption(i, { kind, name: o.name || k.label });
                }}
              >
                {optionKinds.map((k) => (
                  <option key={k.id} value={k.id}>{k.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">اسم الاختيار</span>
              <input className="field" value={o.name} onChange={(e) => setOption(i, { name: e.target.value })} placeholder="اللون" />
            </label>
            <label className="block">
              <span className="label">بالإنجليزي</span>
              <input className="field" dir="ltr" value={o.en} onChange={(e) => setOption(i, { en: e.target.value })} placeholder="Color" />
            </label>
            <button type="button" onClick={() => setOptions((all) => all.filter((_, k) => k !== i))} className="btn-outline btn-sm text-brand">
              شيل الاختيار
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="text-start text-xs text-muted">
                  <th className="pb-2 text-start font-medium">القيمة</th>
                  <th className="pb-2 text-start font-medium">بالإنجليزي</th>
                  {o.kind === "color" && <th className="pb-2 text-start font-medium">اللون</th>}
                  <th className="pb-2 text-start font-medium">العدد في المخزن</th>
                  <th className="pb-2 text-start font-medium">فرق السعر</th>
                  <th className="pb-2 text-start font-medium">متاحة</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {o.values.map((v, j) => (
                  <tr key={j} className="border-t border-dashed border-line">
                    <td className="py-2 pe-2">
                      <input className="field h-10" value={v.label} onChange={(e) => setValue(i, j, { label: e.target.value })} placeholder={optionKinds.find((k) => k.id === o.kind)?.example.split("، ")[0]} />
                    </td>
                    <td className="py-2 pe-2">
                      <input className="field h-10" dir="ltr" value={v.en} onChange={(e) => setValue(i, j, { en: e.target.value })} />
                    </td>
                    {o.kind === "color" && (
                      <td className="py-2 pe-2">
                        <input type="color" aria-label="اللون" className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-paper p-1" value={v.color} onChange={(e) => setValue(i, j, { color: e.target.value })} />
                      </td>
                    )}
                    <td className="py-2 pe-2">
                      <input className="field tabular h-10 w-28" inputMode="numeric" value={v.stock} onChange={(e) => setValue(i, j, { stock: e.target.value.replace(/\D/g, "") })} placeholder="مفتوح" />
                    </td>
                    <td className="py-2 pe-2">
                      <input className="field tabular h-10 w-24" inputMode="numeric" value={v.priceDelta} onChange={(e) => setValue(i, j, { priceDelta: e.target.value.replace(/[^\d-]/g, "") })} placeholder="0" />
                    </td>
                    <td className="py-2 pe-2">
                      <input type="checkbox" aria-label="متاحة" className="size-5 accent-brand" checked={v.available} onChange={(e) => setValue(i, j, { available: e.target.checked })} />
                    </td>
                    <td className="py-2">
                      <button type="button" aria-label="شيل القيمة" onClick={() => setOption(i, { values: o.values.filter((_, m) => m !== j) })} className="text-muted hover:text-brand">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {o.values.length < MAX_VALUES && (
            <button type="button" onClick={() => setOption(i, { values: [...o.values, emptyValue()] })} className="text-sm font-semibold text-brand underline underline-offset-4">
              + قيمة جديدة
            </button>
          )}
        </div>
      ))}

      {options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={() => setOptions((all) => [...all, { name: "اللون", en: "Color", kind: "color", values: [emptyValue()] }])}
          className="btn-outline btn-sm"
        >
          + اختيار جديد (لون، مقاس، ريحة…)
        </button>
      )}
      <p className="text-xs leading-5 text-muted">
        العدد في المخزن بيقل لوحده مع كل طلب وبيرجع لو الطلب اتلغى، وأول ما يوصل صفر القيمة بتبان «خلص». سيبه فاضي من غير عدّ. فرق السعر بيتحسب على المنتج لوحده والبوكس، مش جوه الباكدج.
      </p>
    </div>
  );
}
