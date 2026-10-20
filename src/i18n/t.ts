import type { Locale } from "./config";
import { en } from "./en";

export type Vars = Record<string, string | number>;
export type T = ((key: string, vars?: Vars) => string) & { locale: Locale };

const fill = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;

/**
 * الترجمة: المفتاح هو الجملة العربية نفسها. العربي بيرجع زي ما هو،
 * والإنجليزي من القاموس (ولو ناقص بيرجع العربي ويتسجل تحذير في التطوير).
 */
export function translator(locale: Locale): T {
  const t = (key: string, vars?: Vars) => {
    if (locale === "ar") return fill(key, vars);
    const hit = en[key];
    if (hit === undefined) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing en: ${key}`);
      return fill(key, vars);
    }
    return fill(hit, vars);
  };
  return Object.assign(t, { locale });
}
