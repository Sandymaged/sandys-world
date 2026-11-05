import { getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import { STORE_NAME } from "@/lib/settings";
import { AssistantHeaderButton } from "./assistant-promo";
import { CartButton } from "./cart-button";
import { LangSwitch } from "./lang-switch";
import { Logo } from "./logo";
import { getSiteSettings, linkVisible } from "@/lib/site-settings";
import { getLocalizedStorefront } from "@/lib/catalog";
import { Icon } from "./icons";
import { NavTabs, NavTabsView, type NavTab } from "./nav-tabs";
import { Suspense } from "react";

const nav = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "كل الهدايا" },
  { href: "/box", label: "اعمل البوكس بنفسك" },
  { href: "/gift-card", label: "كارت هدية" },
  { href: "/bride", label: "العروسة والإشبينات" },
  { href: "/kits", label: "ورشة مع الصحاب" },
  { href: "/brands", label: "البراندات المحلية" },
  { href: "/send-to-assiut", label: "ابعت لأهلك في أسيوط" },
];

async function SearchForm({ className = "" }: { className?: string }) {
  const t = await getT();
  return (
    <form action="/shop" role="search" className={`relative ${className}`}>
      <Icon name="search" className="pointer-events-none absolute top-1/2 start-3.5 size-[18px] -translate-y-1/2 text-muted" />
      <input
        name="q"
        type="search"
        enterKeyHint="search"
        aria-label={t("بحث")}
        placeholder={t("دوّر على هدية، مج، ورد، شوكولاتة…")}
        className="h-12 w-full rounded-full border border-line bg-paper ps-10 pe-4 text-[15px] outline-none transition placeholder:text-muted focus:border-brand"
      />
    </form>
  );
}

export async function SiteHeader() {
  const [t, site, sf] = await Promise.all([getT(), getSiteSettings(), getLocalizedStorefront()]);
  // المناسبات قايمة بتفتح بعد «كل الهدايا»، و«الاسترجاع والاستبدال» في الآخر
  const links: NavTab[] = nav.filter((n) => linkVisible(n.href, site)).map((n) => ({ href: n.href, label: t(n.label) }));
  const occasions = sf.occasions.map((o) => ({ href: `/occasions/${o.slug}`, label: o.name })).filter((o) => linkVisible(o.href, site));
  const tabs: NavTab[] = [
    ...links.slice(0, 2),
    ...(occasions.length ? [{ href: "/occasions", label: t("المناسبات"), children: occasions }] : []),
    ...links.slice(2),
    { href: "/policies#returns", label: t("الاسترجاع والاستبدال") },
  ];
  return (
    <header className="sticky top-0 z-30 bg-bg">
      {/* المسار بيتعرف وقت الطلب، فالشريط جوه Suspense وبيظهر من غير تاب متعلّم لحد كده */}
      <Suspense fallback={<NavTabsView tabs={tabs} />}>
        <NavTabs tabs={tabs} />
      </Suspense>
      <div className="border-b border-line">
        <div className="container-x flex h-16 items-center gap-6">
          <Link href="/" aria-label={t(STORE_NAME)} className="shrink-0 text-[15px] text-ink transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <SearchForm className="hidden flex-1 md:block md:max-w-md" />
          <div className="ms-auto flex items-center gap-2">
            <AssistantHeaderButton />
            <LangSwitch />
            <CartButton />
          </div>
        </div>
        <div className="container-x pb-3 md:hidden">
          <SearchForm />
        </div>
      </div>
    </header>
  );
}
