"use client";

import NextLink from "next/link";
import { createContext, useContext, useMemo } from "react";
import { dirOf, localizeHref, type Locale } from "./config";
import { translator, type T } from "./t";

const LocaleContext = createContext<Locale>("ar");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
export const useDir = () => dirOf(useLocale());

export function useT(): T {
  const l = useLocale();
  return useMemo(() => translator(l), [l]);
}

export function useHref() {
  const l = useLocale();
  return (href: string) => localizeHref(l, href);
}

/** Link بيضيف /en لوحده لو الصفحة إنجليزي */
export function Link({ href, ...rest }: React.ComponentProps<typeof NextLink> & { href: string }) {
  const l = useLocale();
  return <NextLink href={localizeHref(l, href)} {...rest} />;
}
