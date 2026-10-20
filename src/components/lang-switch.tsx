"use client";

import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLocale } from "@/i18n/client";
import { switchLocalePath } from "@/i18n/config";

function Switch() {
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const to = locale === "ar" ? "en" : "ar";
  const href = switchLocalePath(pathname, to) + (search ? `?${search}` : "");
  return (
    <NextLink
      href={href}
      hrefLang={to}
      lang={to}
      className="grid h-9 min-w-9 place-items-center rounded-full border-2 border-brand px-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-bg"
    >
      {to === "en" ? "EN" : "ع"}
    </NextLink>
  );
}

/** زرار بيفتح نفس الصفحة باللغة التانية */
export function LangSwitch() {
  return (
    <Suspense fallback={<span className="h-9 w-9" />}>
      <Switch />
    </Suspense>
  );
}
