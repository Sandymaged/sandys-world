// اللغات: العربي الأساسي ومن غير بادئة في اللينك، والإنجليزي تحت /en
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

/** "/shop" → "/en/shop" للإنجليزي، وزي ما هو للعربي */
export function localizeHref(locale: Locale, href: string) {
  if (locale === defaultLocale || !href.startsWith("/") || href.startsWith("//")) return href;
  return href === "/" ? "/en" : `/en${href}`;
}

/** المسار نفسه في اللغة التانية (للزرار اللي بيبدّل اللغة) */
/**
 * المسار من غير اللغة: «/en/shop» و«/shop» و«/ar/shop» كلهم «/shop».
 * على Vercel السيرفر بيشوف العربي «/ar/…» (بعد الـ rewrite) والمتصفح بيشوفه «/…»،
 * فأي حاجة بتتحسب من المسار لازم تمشي من هنا وإلا الصفحة بتطلع مختلفة (hydration error)
 */
export const barePath = (pathname: string) => pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";

export function switchLocalePath(pathname: string, to: Locale) {
  return localizeHref(to, barePath(pathname));
}
