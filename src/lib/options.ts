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

/** الاختيار متاح لو متعلّم «متاح» وعدده لسه مخلصش */
export const valueAvailable = (v: OptionValue) => v.available && (v.stock == null || v.stock > 0);

const valueOf = (o: ProductOption, choices: OptionChoice[] | undefined) => {
  const c = choices?.find((x) => x.optionId === o.id);
  return c ? o.values.find((v) => v.id === c.valueId) : undefined;
};

/** فرق السعر من الاختيارات */
export function optionsPrice(options: ProductOption[] | undefined, choices: OptionChoice[] | undefined) {
  return (options ?? []).reduce((s, o) => s + (valueOf(o, choices)?.priceDelta ?? 0), 0);
}

/** الاختيارات اللي لسه متختارتش (أو اللي اتختارت وخلصت) */
export function missingOptions(options: ProductOption[] | undefined, choices: OptionChoice[] | undefined) {
  return (options ?? []).filter((o) => {
    const v = valueOf(o, choices);
    return !v || !valueAvailable(v);
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

/** المنتج ده كله خلص؟ (لو أي اختيار كل قيمه خلصت) */
export function allOptionsSoldOut(options: ProductOption[] | undefined) {
  return (options ?? []).some((o) => o.values.length > 0 && o.values.every((v) => !valueAvailable(v)));
}

const slug = (s: string, i: number) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9ء-ي]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || `v${i + 1}`;

/** تنضيف اللي جاي من فورم اللوحة: أسامي، أرقام، ألوان، ومن غير تكرار */
export function normalizeOptions(raw: unknown): ProductOption[] {
  if (!Array.isArray(raw)) return [];
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
          const stockRaw = v?.stock;
          const stock = stockRaw === "" || stockRaw == null || Number.isNaN(Number(stockRaw)) ? null : Math.max(0, Math.round(Number(stockRaw)));
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
