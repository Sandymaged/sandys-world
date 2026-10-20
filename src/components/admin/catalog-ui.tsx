"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SaveResult } from "@/lib/admin-catalog-actions";

const tabs = [
  { href: "/admin/catalog/products", label: "المنتجات" },
  { href: "/admin/catalog/packages", label: "الباكدجات" },
  { href: "/admin/catalog/kits", label: "الكيتات والعروسة" },
  { href: "/admin/catalog/brands", label: "البراندات المحلية" },
];

export function CatalogTabs() {
  const path = usePathname().replace(/^\/(en|ar)(?=\/)/, "");
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={`chip ${path.startsWith(t.href) ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink-2"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/** مسح بعد تأكيد، ولو فيه سبب يمنع المسح بيظهر */
export function DeleteButton({ action, backTo, what }: { action: () => Promise<SaveResult>; backTo: string; what: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`متأكدة إنك عايزة تمسحي ${what}؟ مفيش رجوع.`)) return;
          start(async () => {
            const r = await action();
            if (r.ok) router.push(backTo);
            else setError(r.error);
          });
        }}
        className="text-sm text-brand underline underline-offset-4"
      >
        {pending ? "بيتمسح…" : `مسح ${what}`}
      </button>
      {error && <p className="mt-2 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
    </div>
  );
}
