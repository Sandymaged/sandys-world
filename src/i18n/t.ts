import type { Locale } from "./config";
import { ar } from "./ar";
import { en } from "./en";

export type Vars = Record<string, string | number>;
export type T = ((key: string, vars?: Vars) => string) & { locale: Locale };

const fill = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;

/**
 * الترجمة: المفتاح هو الجملة العربية القديمة المكتوبة في الكود.
 * العربي من ar.ts (النص بالفصحى البسيطة)، ولو مش موجود بيرجع المفتاح زي ما هو.
 * الإنجليزي من en.ts (ولو ناقص بيرجع العربي ويتسجل تحذير في التطوير).
 */
export function translator(locale: Locale): T {
  const t = (key: string, vars?: Vars) => {
    if (locale === "ar") return fill(ar[key] ?? key, vars);
    const hit = en[key];
    if (hit === undefined) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing en: ${key}`);
      return fill(key, vars);
    }
    return fill(hit, vars);
  };
  return Object.assign(t, { locale });
}
