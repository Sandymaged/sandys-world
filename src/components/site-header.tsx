import { getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import { STORE_NAME } from "@/lib/settings";
import { AssistantHeaderButton } from "./assistant-promo";
import { CartButton } from "./cart-button";
import { LangSwitch } from "./lang-switch";
import { Logo } from "./logo";
import { Icon } from "./icons";

const nav = [
  { href: "/shop", label: "كل الهدايا" },
  { href: "/occasions/birthday", label: "أعياد الميلاد" },
  { href: "/occasions/christmas", label: "الكريسماس" },
  { href: "/box", label: "اعمل البوكس بنفسك" },
  { href: "/gift-card", label: "كارت هدية" },
  { href: "/bride", label: "العروسة والإشبينات" },
  { href: "/kits", label: "ورشة مع الصحاب" },
  { href: "/brands", label: "البراندات المحلية" },
  { href: "/send-to-assiut", label: "ابعت لأهلك في أسيوط" },
];

const announcements = [
  "توصيل في نفس اليوم في مدينة أسيوط للطلبات قبل الساعة 1 الضهر",
  "صورة الهدية قبل ما تخرج وصورة وهي بتتسلم",
  "ادفع بإنستاباي من أي مكان في مصر أو برّاها",
  "كارت برسالتك مع كل هدية",
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
  const t = await getT();
  return (
    <header className="sticky top-0 z-30 bg-bg">
      <div className="group overflow-hidden bg-brand text-white" aria-label={announcements.map((a) => t(a)).join(t("، "))}>
        {/* نسختين ورا بعض عشان اللفّة تبان متصلة */}
        <div className="flex h-9 w-max animate-marquee items-center group-hover:[animation-play-state:paused]" aria-hidden>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {announcements.map((a) => (
                <span key={a} className="flex items-center gap-2 px-8 text-xs whitespace-nowrap">
                  <span className="size-1.5 rounded-full bg-white/70" />
                  {t(a)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
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
        <nav className="container-x hidden h-12 items-center gap-1 text-[15px] font-medium text-ink-2 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 transition-colors hover:bg-paper hover:text-brand">
              {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="container-x pb-3 md:hidden">
          <SearchForm />
        </div>
      </div>
    </header>
  );
}
