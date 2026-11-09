import { getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import { STORE_NAME } from "@/lib/settings";
import { Bow } from "./decor";
import { Logo } from "./logo";
import { getSiteSettings, linkVisible } from "@/lib/site-settings";
import { getLocalizedStorefront } from "@/lib/catalog";
import { Icon } from "./icons";
import { Pill } from "./scrapbook";

const shop = [
  { href: "/shop", label: "كل الهدايا" },
  { href: "/box", label: "اعمل البوكس بنفسك" },
  { href: "/gift-card", label: "كارت هدية" },
  { href: "/bride", label: "العروسة والإشبينات" },
  { href: "/kits", label: "ورشة مع الصحاب" },
  { href: "/brands", label: "البراندات المحلية" },
  { href: "/send-to-assiut", label: "ابعت لأهلك في أسيوط" },
];

const delivery = ["التوصيل جوه مدينة أسيوط بمندوب خاص", "الدفع بإنستاباي، أو كاش لو إنت المستلم"];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group inline-flex items-center gap-1.5 transition-colors hover:text-white">
        <span className="h-px w-0 bg-pink-mid transition-all duration-300 group-hover:w-3" aria-hidden />
        {children}
      </Link>
    </li>
  );
}

/**
 * آخر الصفحة: كارت بوستال بيسألك «في حد في بالك؟»، وبعده footer عادي بعرض الصفحة:
 * اللوجو وجملة عن المتجر، وعواميد اللينكات، وتحتهم سطر الحقوق.
 */
export async function SiteFooter() {
  const [t, site, sf] = await Promise.all([getT(), getSiteSettings(), getLocalizedStorefront()]);
  const name = t(STORE_NAME);
  // أول 4 مناسبات من اللي متضافة في اللوحة
  const occasions = sf.occasions
    .map((o) => ({ href: `/occasions/${o.slug}`, label: o.name }))
    .filter((l) => linkVisible(l.href, site))
    .slice(0, 4);
  return (
    <footer className="mt-24">
      {/* الكارت البوستال */}
      <div className="container-x mb-16">
        <div className="reveal panel relative mx-auto grid max-w-4xl items-center gap-8 overflow-hidden border border-line bg-paper px-6 py-9 shadow-[0_30px_50px_-34px_rgb(30_40_70/0.6)] sm:grid-cols-[1fr_auto] sm:px-12 sm:py-12">
          <div>
            <Pill>{t("قبل ما تمشي")}</Pill>
            <p className="mt-3 font-heading text-3xl leading-tight text-ink sm:text-4xl">{t("في حد في بالك دلوقتي؟")}</p>
            <p className="mt-2 max-w-md text-lg leading-8 text-ink-2">{t("ابعتله هدية صغيرة تفرّحه، وإحنا نتصرف في الباقي.")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">
                {t("اختار هديتك")}
              </Link>
              <Link href="/track" className="btn border border-ink/15 bg-bg text-ink hover:border-brand hover:text-brand">
                {t("تابع طلبك")}
              </Link>
            </div>
          </div>

          {/* طابع البريد والختم */}
          <div className="relative mx-auto hidden h-44 w-48 sm:block" aria-hidden>
            <div className="absolute end-2 top-0 w-32 rotate-6 drop-shadow-[0_10px_14px_rgb(60_20_25/0.3)]">
              <div className="stamp bg-white">
                <div className="flex aspect-[4/5] flex-col items-center justify-center gap-1 bg-brand text-white">
                  <Bow className="w-14 text-white" />
                  <span className="font-logo text-lg italic">giftful</span>
                  <span className="text-[11px] tracking-wide text-white/80">{t("بريد الهدايا")}</span>
                </div>
              </div>
            </div>
            {/* ختم البريد */}
            <div className="absolute start-0 bottom-0 grid size-24 -rotate-12 place-items-center rounded-full border-[3px] border-double border-blue-deep/70 bg-paper/70 text-center text-blue-deep">
              <span className="leading-tight">
                <span className="block text-[11px] font-semibold">{t("أسيوط")}</span>
                <span className="block font-script text-lg">{t("بحب")}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-deep text-white/80">
        <div aria-hidden className="ribbon h-2 !shadow-none" />
        <div className="reveal-stagger container-x grid grid-cols-2 gap-x-6 gap-y-10 py-14 text-[15px] lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div className="col-span-2 max-w-xs lg:col-span-1">
            <p className="text-lg text-white" aria-label={name}>
              <Logo accent="text-pink-mid" />
            </p>
            <p className="mt-3 font-script text-xl text-pink-mid">{t("هدية متغلفة بحب")}</p>
            <p className="mt-2 leading-7">{t("هدايا مخصصة ومتغلفة، بنوصّلها لأي عنوان في أسيوط في اليوم والفترة اللي تختارها.")}</p>
          </div>
          <div>
            <p className="mb-4 font-heading text-lg text-white">{t("تسوّق")}</p>
            <ul className="space-y-2.5">
              {shop.filter((l) => linkVisible(l.href, site)).map((l) => (
                <FooterLink key={l.href} href={l.href}>
                  {t(l.label)}
                </FooterLink>
              ))}
            </ul>
          </div>
          {occasions.length > 0 && (
            <div>
              <p className="mb-4 font-heading text-lg text-white">{t("المناسبات")}</p>
              <ul className="space-y-2.5">
                {occasions.map((l) => (
                  <FooterLink key={l.href} href={l.href}>
                    {l.label}
                  </FooterLink>
                ))}
              </ul>
            </div>
          )}
          <div className="col-span-2 lg:col-span-1">
            <p className="mb-4 font-heading text-lg text-white">{t("التوصيل والدفع")}</p>
            <ul className="space-y-3 leading-6">
              {delivery.map((d) => (
                <li key={d} className="flex gap-2">
                  <Icon name="check" className="mt-1 size-4 shrink-0 text-pink-mid" />
                  {t(d)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-white/60">
            <p>
              © 2026 {name}. {t("كل الحقوق محفوظة.")}{" "}
              <Link href="/policies" className="underline underline-offset-4 hover:text-white">
                {t("السياسات")}
              </Link>
            </p>
            <a href="#" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-1.5 text-white/80 transition-colors hover:bg-white hover:text-blue-deep">
              {t("لفوق")}
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 14 6-6 6 6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
