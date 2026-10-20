"use client";

import { Link, useT } from "@/i18n/client";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { Icon } from "./icons";

export function CartButton() {
  const t = useT();
  const count = useCart((s) => s.gifts.length);
  const hydrated = useHydrated();
  return (
    <Link
      href="/cart"
      aria-label={hydrated && count ? t("السلة، فيها {n}", { n: count }) : t("السلة")}
      className="relative flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-surface"
    >
      <Icon name="bag" className="size-[22px]" />
      <span className="hidden md:inline">{t("السلة")}</span>
      {hydrated && count > 0 && (
        <span key={count} className="tabular absolute animate-bump top-0.5 end-1 grid size-[18px] place-items-center rounded-full bg-brand text-[10px] font-bold text-white md:static md:size-5 md:text-[11px]">
          {count}
        </span>
      )}
    </Link>
  );
}
