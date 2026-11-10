"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminLogout } from "@/lib/admin-actions";
import { Bow } from "../decor";
import { Icon, type IconName } from "../icons";

/** التابات متقسمة مجموعات، وأي تاب جديد بيتضاف هنا بس */
const groups: { title: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    title: "الشغل اليومي",
    items: [
      { href: "/admin", label: "النهارده", icon: "home" },
      { href: "/admin/orders", label: "الأوردرات", icon: "bag" },
      { href: "/admin/payments", label: "مدفوعات مستنية", icon: "wallet" },
      { href: "/admin/today", label: "التجهيز والتوصيل", icon: "truck" },
    ],
  },
  {
    title: "الكتالوج",
    items: [
      { href: "/admin/catalog/products", label: "المنتجات", icon: "gift" },
      { href: "/admin/catalog/brands", label: "البراندات", icon: "store" },
      { href: "/admin/catalog/kits", label: "الكيتات", icon: "layers" },
      { href: "/admin/catalog/packages", label: "الباكدجات", icon: "box" },
      { href: "/admin/packaging", label: "البوكسات والتغليف", icon: "gift" },
      { href: "/admin/catalog/occasions", label: "المناسبات", icon: "calendar" },
      { href: "/admin/catalog/seasons", label: "المواسم", icon: "sparkle" },
      { href: "/admin/zones", label: "مناطق التوصيل", icon: "route" },
      { href: "/admin/coupons", label: "أكواد الخصم", icon: "tag" },
      { href: "/admin/catalog/group-discounts", label: "خصم الجروبات", icon: "users" },
    ],
  },
  {
    title: "الحسابات",
    items: [
      { href: "/admin/reports", label: "التقارير", icon: "chart" },
      { href: "/admin/settlements", label: "حسابات البراندات", icon: "handshake" },
      { href: "/admin/expenses", label: "المصاريف", icon: "receipt" },
      { href: "/admin/costs", label: "التكاليف", icon: "receipt" },
      { href: "/admin/payment", label: "الدفع والتواصل", icon: "wallet" },
    ],
  },
  {
    title: "الموقع",
    items: [
      { href: "/admin/settings", label: "إعدادات الموقع", icon: "sliders" },
      { href: "/admin/users", label: "المستخدمين", icon: "users" },
      { href: "/admin/account", label: "حسابي", icon: "key" },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname().replace(/^\/(en|ar)(?=\/)/, "");
  return (
    <nav className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 px-3 text-xs font-semibold text-muted">{g.title}</p>
          <ul className="space-y-1">
            {g.items.map((it) => {
              const on = it.href === "/admin" ? path === "/admin" : path === it.href || path.startsWith(`${it.href}/`);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${on ? "bg-brand font-semibold text-white" : "text-ink-2 hover:bg-brand-soft hover:text-brand"}`}
                  >
                    <Icon name={it.icon} className="size-5 shrink-0" />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <Bow className="w-8 text-brand" />
      <p className="font-heading text-2xl text-brand">لوحة التحكم</p>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink-2 hover:border-brand hover:text-brand"
      >
        <Icon name="external" className="size-4" />
        شوف الموقع
      </a>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <form action={adminLogout} className="border-t border-line pt-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted hover:bg-brand-soft hover:text-brand">
          <Icon name="logout" className="size-5" />
          خروج
        </button>
      </form>
    </div>
  );
}

/**
 * القايمة الجانبية للوحة: ثابتة على اليمين في الكمبيوتر،
 * وعلى الموبايل شريط فوق فيه زرار بيفتحها من الجنب.
 */
export function AdminNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* الكمبيوتر */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-e border-line bg-bg lg:block print:hidden">
        <SidebarBody />
      </aside>

      {/* الموبايل */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg px-4 lg:hidden print:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="افتح القايمة" aria-expanded={open} className="grid size-10 place-items-center rounded-xl text-ink hover:bg-brand-soft">
          <Icon name="menu" className="size-6" />
        </button>
        <Brand />
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="قايمة لوحة التحكم">
          <button type="button" aria-label="اقفل القايمة" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85%] animate-fade-up bg-bg shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} aria-label="اقفل القايمة" className="absolute top-4 end-3 grid size-9 place-items-center rounded-xl text-muted hover:bg-brand-soft">
              <Icon name="close" className="size-5" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
