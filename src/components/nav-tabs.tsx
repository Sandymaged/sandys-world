"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/client";
import { Icon } from "./icons";

export interface NavTab {
  href: string;
  label: string;
  /** قايمة بتفتح تحت التاب (زي المناسبات) */
  children?: { href: string; label: string }[];
}

/**
 * شريط التابات الأحمر فوق خالص: التاب اللي إنت فيه أبيض، و«المناسبات» قايمة بتفتح.
 * على الموبايل صف واحد بيتسحب يمين وشمال، والمناسبات بتبان تابات عادية.
 */
export function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const path = usePathname().replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  return <NavTabsView tabs={tabs} path={path} />;
}

/** نفس الشريط من غير ما يعرف إنت في أنهي صفحة (بيظهر لحظة لحد ما المسار يبقى معروف) */
export function NavTabsView({ tabs, path = null }: { tabs: NavTab[]; path?: string | null }) {
  const isOn = (href: string) => {
    if (path === null) return false;
    const base = href.split("#")[0];
    return base === "/" ? path === "/" : path === base || path.startsWith(`${base}/`);
  };
  const tab = (on: boolean) =>
    `flex items-center gap-1 rounded-full px-3.5 py-1.5 whitespace-nowrap transition-colors ${on ? "bg-white text-brand shadow-sm" : "text-white/90 hover:bg-white/15 hover:text-white"}`;
  const flat = tabs.flatMap((n) => n.children ?? [n]);

  return (
    <div className="bg-brand text-[15px] font-medium">
      {/* الكمبيوتر */}
      <nav className="container-x hidden h-12 items-center gap-1 md:flex">
        {tabs.map((n) =>
          n.children ? (
            <div key={n.href} className="group relative">
              <button type="button" className={tab(n.children.some((c) => isOn(c.href)))} aria-haspopup="true">
                {n.label}
                <Icon name="chevron" className="size-3.5 -rotate-90 transition-transform group-focus-within:rotate-90 group-hover:rotate-90" />
              </button>
              <div className="invisible absolute start-0 top-full z-40 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul className="min-w-48 rounded-2xl border border-line bg-paper p-2 text-ink shadow-[0_18px_30px_-18px_rgb(60_20_25/0.5)]">
                  {n.children.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} className={`block rounded-xl px-3 py-2 hover:bg-brand-soft hover:text-brand ${isOn(c.href) ? "text-brand" : ""}`}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Link key={n.href} href={n.href} className={tab(isOn(n.href))} aria-current={isOn(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ),
        )}
      </nav>
      {/* الموبايل */}
      <nav className="flex h-12 items-center gap-1 overflow-x-auto px-3 [scrollbar-width:none] md:hidden">
        {flat.map((n) => (
          <Link key={n.href} href={n.href} className={tab(isOn(n.href))} aria-current={isOn(n.href) ? "page" : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
