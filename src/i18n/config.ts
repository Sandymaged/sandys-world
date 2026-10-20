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
export function switchLocalePath(pathname: string, to: Locale) {
  const bare = pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  return localizeHref(to, bare);
}
