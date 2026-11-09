// اختيارات المنتج (لون، مقاس، ريحة…): الشكل والحسابات، مشتركة بين المتصفح والسيرفر
/* eslint-disable @typescript-eslint/no-explicit-any -- normalizeOptions بيقرا JSON جاي من الفورم */

export type OptionKind = "color" | "size" | "scent" | "other";

export interface OptionValue {
  id: string;
  label: string;
  en?: string;
  /** للألوان بس: لون الدايرة اللي بتظهر (#hex) */
  color?: string | null;
  /** فرق السعر (مثلاً المقاس الكبير +50). بيتحسب على المنتج المنفرد والبوكس، مش على الباكدج */
  priceDelta: number;
  available: boolean;
  /** العدد في المخزن؛ فاضي = مفتوح. أول ما يوصل صفر بيبان «خلص» لوحده */
  stock?: number | null;
}

export interface ProductOption {
  id: string;
  name: string;
  en?: string;
  kind: OptionKind;
  values: OptionValue[];
  /**
   * مخزون التركيبات (ريحة × حجم مثلاً)، على أول اختيار بس، ولما يبقى فيه اختيارين أو أكتر.
   * متخزن هنا عشان يمشي مع الاختيارات في كل حتة (الكروت، السلة، الطلب) من غير عمود جديد.
   */
  combos?: ComboStock[];
}

/** عدد تركيبة واحدة. key من comboKey، وstock فاضي = مفتوح */
export interface ComboStock {
  key: string;
  stock: number | null;
}

export interface OptionChoice {
  optionId: string;
  valueId: string;
}

export const optionKinds: { id: OptionKind; label: string; example: string }[] = [
  { id: "color", label: "اللون", example: "أحمر، بيج، وردي" },
  { id: "size", label: "المقاس", example: "صغير، وسط، كبير" },
  { id: "scent", label: "الريحة", example: "فانيليا، لافندر، ورد" },
  { id: "other", label: "اختيار تاني", example: "الشكل، الخامة…" },
];

export const MAX_OPTIONS = 3;
export const MAX_VALUES = 12;

/** القيمة متاحة لو متعلّمة «متاح» وعددها لسه مخلصش (العدد ده للمنتج اللي ليه اختيار واحد بس) */
export const valueAvailable = (v: OptionValue) => v.available && (v.stock == null || v.stock > 0);

/** المنتج اللي ليه اختيارين أو أكتر عدده بيتحسب لكل تركيبة (yara · 50ml)، مش لكل قيمة لوحدها */
export const usesCombos = (options: ProductOption[] | undefined) => (options?.length ?? 0) >= 2;

/** مفتاح التركيبة: ثابت مهما كان ترتيب الاختيارات */
export const comboKey = (choices: OptionChoice[]) =>
  choices
    .map((c) => `${c.optionId}=${c.valueId}`)
    .sort()
    .join("|");

/** عدد التركيبة (فاضي = مفتوح) */
export const comboStock = (options: ProductOption[] | undefined, key: string) => options?.[0]?.combos?.find((c) => c.key === key)?.stock ?? null;

/** كل التركيبات: كل قيم كل اختيار مع بعض */
export function allCombos(options: ProductOption[], pools: string[][] = options.map((o) => o.values.map((v) => v.id))): OptionChoice[][] {
  return options.reduce<OptionChoice[][]>(
    (acc, o, i) => acc.flatMap((cs) => pools[i].map((valueId) => [...cs, { optionId: o.id, valueId }])),
    [[]],
  );
}

const valueOf = (o: ProductOption, choices: OptionChoice[] | undefined) => {
  const c = choices?.find((x) => x.optionId === o.id);
  return c ? o.values.find((v) => v.id === c.valueId) : undefined;
};

/**
 * القيمة دي تنفع تتختار مع اللي اتختار في باقي الاختيارات؟
 * في التركيبات: لازم يبقى فيه تركيبة واحدة على الأقل فيها القيمة دي ولسه فيها عدد.
 */
export function canPick(options: ProductOption[] | undefined, choices: OptionChoice[] | undefined, optionId: string, valueId: string) {
  const opts = options ?? [];
  const v = opts.find((o) => o.id === optionId)?.values.find((x) => x.id === valueId);
  if (!v || !valueAvailable(v)) return false;
  if (!usesCombos(opts)) return true;
  const pools = opts.map((o) => {
    if (o.id === optionId) return [valueId];
    const cv = valueOf(o, choices);
    return cv && valueAvailable(cv) ? [cv.id] : o.values.filter(valueAvailable).map((x) => x.id);
  });
  return allCombos(opts, pools).some((cs) => {
    const s = comboStock(opts, comboKey(cs));
    return s == null || s > 0;
  });
}

/** بعد ما العميل يختار قيمة: الاختيارات التانية اللي مبقتش تنفع معاها بتتشال عشان يختار تاني */
export function pickChoice(options: ProductOption[], choices: OptionChoice[], optionId: string, valueId: string) {
  let next = [...choices.filter((c) => c.optionId !== optionId), { optionId, valueId }];
  if (usesCombos(options)) next = next.filter((c) => c.optionId === optionId || canPick(options, next, c.optionId, c.valueId));
  return next;
}

/** فرق السعر من الاختيارات */
export function optionsPrice(options: ProductOption[] | undefined, choices: OptionChoice[] | undefined) {
  return (options ?? []).reduce((s, o) => s + (valueOf(o, choices)?.priceDelta ?? 0), 0);
}

/** الاختيارات اللي لسه متختارتش (أو اللي اتختارت وخلصت) */
export function missingOptions(options: ProductOption[] | undefined, choices: OptionChoice[] | undefined) {
  return (options ?? []).filter((o) => {
    const v = valueOf(o, choices);
    return !v || !canPick(options, choices, o.id, v.id);
  });
}

/** «اللون: بيج · المقاس: كبير» للسلة واللوحة */
export function describeChoices(options: ProductOption[] | undefined, choices: OptionChoice[] | undefined, locale: "ar" | "en" = "ar") {
  return (options ?? [])
    .map((o) => {
      const v = valueOf(o, choices);
      if (!v) return null;
      return locale === "en" ? `${o.en || o.name}: ${v.en || v.label}` : `${o.name}: ${v.label}`;
    })
    .filter(Boolean)
    .join(" · ");
}

/** المنتج ده كله خلص؟ (لو أي اختيار كل قيمه خلصت، أو كل التركيبات خلصت) */
export function allOptionsSoldOut(options: ProductOption[] | undefined) {
  const opts = options ?? [];
  if (opts.some((o) => o.values.length > 0 && o.values.every((v) => !valueAvailable(v)))) return true;
  return usesCombos(opts) && !opts[0].values.some((v) => canPick(opts, [], opts[0].id, v.id));
}

/** لحد كام تركيبة بنعدّ (٣ اختيارات × ١٢ قيمة كتير أوي على جدول) */
export const MAX_COMBOS = 60;

const stockNum = (raw: unknown) =>
  raw === "" || raw == null || Number.isNaN(Number(raw)) ? null : Math.max(0, Math.round(Number(raw)));

const slug = (s: string, i: number) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9ء-ي]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || `v${i + 1}`;

/** تنضيف اللي جاي من فورم اللوحة: أسامي، أرقام، ألوان، ومن غير تكرار */
export function normalizeOptions(raw: unknown): ProductOption[] {
  if (!Array.isArray(raw)) return [];
  const options = normalizeList(raw);
  if (!usesCombos(options)) {
    delete options[0]?.combos;
    return options;
  }
  // اختيارين أو أكتر: العدد على التركيبات، وعدد القيمة لوحدها بيتشال
  const sent = new Map<string, unknown>();
  for (const o of raw) for (const c of Array.isArray(o?.combos) ? o.combos : []) if (typeof c?.key === "string") sent.set(c.key, c.stock);
  for (const o of options) {
    delete o.combos;
    for (const v of o.values) v.stock = null;
  }
  options[0].combos = allCombos(options)
    .slice(0, MAX_COMBOS)
    .map((cs) => {
      const key = comboKey(cs);
      return { key, stock: stockNum(sent.get(key)) };
    });
  return options;
}

function normalizeList(raw: any[]): ProductOption[] {
  const kinds = new Set(optionKinds.map((k) => k.id));
  return raw
    .slice(0, MAX_OPTIONS)
    .map((o: any, oi): ProductOption | null => {
      const name = String(o?.name ?? "").trim().slice(0, 30);
      if (!name) return null;
      const seen = new Set<string>();
      const values = (Array.isArray(o?.values) ? o.values : [])
        .slice(0, MAX_VALUES)
        .map((v: any, vi: number): OptionValue | null => {
          const label = String(v?.label ?? "").trim().slice(0, 30);
          if (!label) return null;
          let id = String(v?.id ?? "").trim() || slug(v?.en || label, vi);
          while (seen.has(id)) id = `${id}-${vi}`;
          seen.add(id);
          const color = typeof v?.color === "string" && /^#[0-9a-f]{6}$/i.test(v.color) ? v.color : null;
          const delta = Math.round(Number(v?.priceDelta) || 0);
          const stock = stockNum(v?.stock);
          return {
            id,
            label,
            en: String(v?.en ?? "").trim().slice(0, 30) || undefined,
            color,
            priceDelta: Math.max(-100000, Math.min(100000, delta)),
            available: v?.available !== false,
            stock,
          };
        })
        .filter((v: OptionValue | null): v is OptionValue => v !== null);
      if (!values.length) return null;
      return {
        id: String(o?.id ?? "").trim() || slug(o?.en || name, oi),
        name,
        en: String(o?.en ?? "").trim().slice(0, 30) || undefined,
        kind: kinds.has(o?.kind) ? o.kind : "other",
        values,
      };
    })
    .filter((o): o is ProductOption => o !== null);
}
