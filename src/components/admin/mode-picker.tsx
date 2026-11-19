"use client";

import { useState } from "react";
import { modes, type ModeId, type ModeSettings } from "@/lib/modes";

/**
 * اختيار مود المناسبة في «إعدادات الموقع»: كروت فيها ألوان كل مود،
 * وتحتها جملة الشريط للمود المختار (جمل المودات التانية بتتحفظ برضه، بس مستخبية).
 */
export function ModePicker({ value }: { value: ModeSettings }) {
  const [id, setId] = useState<ModeId>(value.id);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((m) => (
          <label
            key={m.id}
            className={`cursor-pointer rounded-2xl border-2 p-3 transition-colors ${id === m.id ? "border-brand bg-brand-soft" : "border-line bg-paper hover:border-brand/40"}`}
          >
            <input type="radio" name="mode_id" value={m.id} checked={id === m.id} onChange={() => setId(m.id)} className="sr-only" />
            <span className="flex h-10 overflow-hidden rounded-xl" aria-hidden>
              {m.swatches.map((c) => (
                <span key={c} className="flex-1" style={{ background: c }} />
              ))}
            </span>
            <span className="mt-2 flex items-center gap-2 font-semibold">
              <span className={`grid size-4 place-items-center rounded-full border-2 ${id === m.id ? "border-brand" : "border-line"}`}>
                {id === m.id && <span className="size-2 rounded-full bg-brand" />}
              </span>
              {m.label}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-muted">{m.hint}</span>
          </label>
        ))}
      </div>

      {modes
        .filter((m) => m.id !== "off")
        .map((m) => (
          <div key={m.id} hidden={m.id !== id} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`mb_${m.id}_ar`}>جملة الشريط أعلى الموقع ({m.label})</label>
              <input id={`mb_${m.id}_ar`} name={`mode_banner_${m.id}_ar`} defaultValue={value.banners[m.id]?.ar ?? ""} placeholder={m.banner.ar} className="field" maxLength={140} />
            </div>
            <div>
              <label className="label" htmlFor={`mb_${m.id}_en`}>الجملة بالإنجليزية</label>
              <input id={`mb_${m.id}_en`} name={`mode_banner_${m.id}_en`} defaultValue={value.banners[m.id]?.en ?? ""} placeholder={m.banner.en} dir="ltr" className="field" maxLength={140} />
            </div>
            <p className="-mt-2 text-xs text-muted sm:col-span-2">إن تركتها فارغة تظهر الجملة المكتوبة باللون الفاتح.</p>
          </div>
        ))}

      <div hidden={id === "off"} className="flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" name="mode_showBanner" defaultChecked={value.showBanner} className="size-5 accent-brand" />
          إظهار الشريط أعلى الموقع
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" name="mode_effects" defaultChecked={value.effects} className="size-5 accent-brand" />
          تأثير متحرك خفيف في الخلفية (ثلج، قلوب، نجوم)
        </label>
      </div>
    </div>
  );
}
