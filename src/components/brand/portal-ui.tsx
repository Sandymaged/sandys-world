"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { brandLogin, brandLogout, setHandedAction } from "@/lib/brand-actions";
import { Logo } from "../logo";
import { Icon, type IconName } from "../icons";

/* بوابة البراند: الدخول، والقايمة اللي فوق، وزرار «سلّمت للمتجر» */

export function BrandLoginForm() {
  const [state, action, pending] = useActionState(brandLogin, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">الإيميل</label>
        <input id="email" name="email" type="email" dir="ltr" className="field" autoComplete="username" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="pw">كلمة السر</label>
        <input id="pw" name="password" type="password" dir="ltr" className="field" autoComplete="current-password" required />
      </div>
      {state?.error && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "لحظة…" : "دخول"}</button>
    </form>
  );
}

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/brand", label: "الرئيسية", icon: "home" },
  { href: "/brand/orders", label: "الطلبات", icon: "bag" },
  { href: "/brand/products", label: "منتجاتي", icon: "gift" },
  { href: "/brand/statement", label: "حسابي مع المتجر", icon: "wallet" },
  { href: "/brand/account", label: "كلمة السر", icon: "key" },
];

export function BrandNav({ brandName }: { brandName: string }) {
  const path = usePathname().replace(/^\/(en|ar)(?=\/)/, "");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Link href="/brand" className="text-[13px] text-ink">
          <Logo />
        </Link>
        <span className="rounded-full bg-blush px-3 py-1 text-sm font-semibold text-brand">{brandName}</span>
        <form action={brandLogout} className="ms-auto">
          <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted hover:bg-brand-soft hover:text-brand">
            <Icon name="logout" className="size-4" />
            خروج
          </button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {tabs.map((t) => {
          const on = t.href === "/brand" ? path === "/brand" : path === t.href || path.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${on ? "bg-brand font-semibold text-white" : "text-ink-2 hover:bg-brand-soft hover:text-brand"}`}
            >
              <Icon name={t.icon} className="size-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

/** «سلّمت للمتجر»: البراند بيعلّم إنه سلّم منتجاته في الطلب ده */
export function OrderActions({ orderId, handed }: { orderId: string; handed: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setHandedAction(orderId, !handed);
            setError(r.ok ? null : r.error);
            router.refresh();
          })
        }
        className={handed ? "btn-outline btn-sm" : "btn-primary btn-sm"}
      >
        <Icon name="check" className="size-4" />
        {handed ? "اتسلّم للمتجر ✓ (دوس للإلغاء)" : "سلّمت للمتجر"}
      </button>
      {error && <p className="text-sm text-brand">{error}</p>}
    </div>
  );
}
