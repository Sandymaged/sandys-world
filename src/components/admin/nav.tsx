"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "النهارده" },
  { href: "/admin/orders", label: "الأوردرات" },
  { href: "/admin/payments", label: "مدفوعات مستنية" },
  { href: "/admin/today", label: "شغل التجهيز والتوصيل" },
  { href: "/admin/catalog/products", label: "المنتجات والبراندات" },
];

export function AdminNav() {
  const path = usePathname().replace(/^\/(en|ar)(?=\/)/, "");
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
      {items.map((it) => {
        const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href.split("/").slice(0, 3).join("/"));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`chip shrink-0 ${on ? "border-brand bg-brand text-white" : "border-transparent text-ink-2 hover:text-brand"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
