"use client";

import { motion } from "motion/react";
import { Link, useT } from "@/i18n/client";
import { usePathname } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { Icon, type IconName } from "./icons";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/shop", label: "الهدايا", icon: "grid" },
  { href: "/box", label: "البوكس", icon: "gift" },
  { href: "/cart", label: "السلة", icon: "bag" },
];

/** تنقل الموبايل: ثابت تحت عشان الإيد توصله بسهولة */
/** showBox: لو قسم البوكس اتقفل من اللوحة، الزرار بتاعه بيختفي */
export function BottomNav({ showBox = true }: { showBox?: boolean }) {
  const t = useT();
  const path = usePathname();
  const count = useCart((s) => s.gifts.length);
  const hydrated = useHydrated();

  return (
    <nav
      aria-label={t("التنقل الأساسي")}
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-dashed border-line bg-bg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className={`grid h-16 ${showBox ? "grid-cols-4" : "grid-cols-3"}`}>
        {items.filter((it) => showBox || it.href !== "/box").map((it) => {
          const on = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] ${on ? "font-semibold text-brand" : "text-muted"}`}
              >
                <span className="relative grid h-8 w-14 place-items-center">
                  {on && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-brand-soft"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon name={it.icon} className="relative size-6" />
                  {it.href === "/cart" && hydrated && count > 0 && (
                    <span key={count} className="tabular absolute animate-bump -top-1 end-1 grid size-[18px] place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </span>
                {t(it.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
