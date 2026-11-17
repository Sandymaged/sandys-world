import Image from "next/image";
import { BrandCard } from "@/components/brand-card";
import { PackageCard, ProductCard } from "@/components/cards";
import { GiftCardArt } from "@/components/gift-card-art";
import { GiftFinder } from "@/components/gift-finder";
import { Hero } from "@/components/hero";
import { Icon } from "@/components/icons";
import { Pill, Polaroid, Quote } from "@/components/scrapbook";
import { ScrollRow } from "@/components/scroll-row";
import { SendForYou } from "@/components/send-for-you";
import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { getLocalizedStorefront } from "@/lib/catalog";
import { getLocale } from "@/i18n/server";
import { getSiteSettings, type QuoteSlot } from "@/lib/site-settings";
import { STORE_NAME } from "@/lib/settings";

/*
 * الصفحة الرئيسية: قصيرة ومن غير تكرار (كانت حوالي ١٦ شاشة موبايل، ونفس المميزات متكررة ٣ مرات).
 * الترتيب: العنوان ← فكرتنا وخطوات التوصيل (مكان واحد) ← هدايا مختارة ← نختار الهدية سوا ← الموسم ← كارت الهدية والأقسام ← البراندات.
 */

export default async function HomePage() {
  const t = await getT();
  const [sf, site, locale] = await Promise.all([getLocalizedStorefront(), getSiteSettings(), getLocale()]);
  const on = site.sections;
  // الاقتباسات من إعدادات الموقع، وبالإنجليزي لو الصفحة إنجليزي ومكتوبلها نسخة
  const quote = (slot: QuoteSlot) => {
    const q = site.quotes[slot];
    return locale === "en" ? { text: q.textEn || q.text, sub: q.subEn || q.sub } : { text: q.text, sub: q.sub };
  };
  const season = sf.activeSeason;
  const seasonPackages = season ? sf.packages.filter((p) => p.seasonId === season.id) : [];
  const featured = sf.packages.filter((p) => !p.seasonId);
  // هدايا مختارة: الباقات الجاهزة الأول، والمنتجات تكمّل لحد 8
  const picks = [...featured.slice(0, 8).map((p) => ({ kind: "package" as const, p })), ...sf.products.filter((p) => !p.isAddon).slice(0, Math.max(0, 8 - featured.length)).map((p) => ({ kind: "product" as const, p }))];
  const photo = (slug: string) => sf.products.find((p) => p.slug === slug);
  // ستيكرز الهيرو: صور منتجات (الأول والرابع دواير وجنبهم ورقة صغيرة)
  const chips: Record<number, string> = { 0: "لماما", 3: "عيد ميلاد سعيد" };
  const preferred = ["rose-bouquet", "chocolate-box"].map(photo).filter((p) => p?.images[0]);
  const heroStickers = [...new Map([...preferred, ...sf.products].filter((p) => p?.images[0]).map((p) => [p!.images[0], p!])).values()]
    .slice(0, 6)
    .map((p, i) => ({ src: p.images[0], alt: p.name, chip: chips[i] }));

  const kitSections = [
    {
      href: "/bride",
      images: sf.kits.filter((k) => k.category === "bridal").map((k) => k.images[0]),
      tone: "bg-blush",
      kicker: "مبروك يا عروسة",
      title: "العروسة والإشبينات",
      line: "بوكسات وهدايا للفرح، على ذوقك وبالأسامي.",
      tags: ["بالأسامي", "على ألوان الفرح", "للإشبينات ولماما"],
      cta: "ادخلي القسم",
    },
    {
      href: "/kits",
      images: sf.kits.filter((k) => k.category === "workshop").map((k) => k.images[0]),
      tone: "bg-blue-soft",
      kicker: "قعدة بنات؟",
      title: "ورشة مع الصحاب",
      line: "كيت فيه كل حاجة، تعملوا بيه حاجة بإيديكم في قعدة حلوة.",
      tags: ["كل الأدوات في الكيت", "من غير خبرة", "لكل الشلة"],
      cta: "اختاروا الكيت",
    },
  ].filter((c) => (c.href === "/bride" ? on.bride : on.kits));

  // الصفحة متنوعة: أقسام بعرض الشاشة كلها (شرايط ملونة)، وأقسام كروت، وأقسام على الورق من غير خلفية
  return (
    <div className="space-y-14 overflow-x-clip pb-4 sm:space-y-20">
      <Hero
        showBox={on.box}
        stickers={heroStickers}
        seasonName={season?.name ?? null}
        seasonHref={season?.occasionSlug ? `/occasions/${season.occasionSlug}` : "/shop"}
        deadline={season?.readyDeadline ?? null}
      />

      {/* فكرة الموقع: تطلب من أي مكان وإحنا نوصّلها عنك */}
      <SendForYou />

      {/* هدايا مختارة: صف بيتسحب، وكل كارت عليه زرار إضافة */}
      {picks.length > 0 && (
        <section className="container-x">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-4xl leading-tight sm:text-5xl">{t("هدايا مختارة")}</h2>
            <Link href="/shop" className="flex items-center gap-0.5 text-[15px] font-medium text-ink-2 hover:text-brand">
              {t("كل الهدايا")}
              <Icon name="chevron" className="size-4" />
            </Link>
          </div>
          <ScrollRow label={t("هدايا مختارة")}>
            {picks.map((x, i) => (x.kind === "package" ? <PackageCard key={x.p.id} pkg={x.p} priority={i < 2} /> : <ProductCard key={x.p.id} product={x.p} />))}
          </ScrollRow>
        </section>
      )}

      {/* نختار الهدية سوا: شريط أزرق بعرض الصفحة */}
      <section className="grain bg-blue-soft py-12 sm:py-16">
        <div className="container-x grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal">
            <Pill>{t("محتار تجيب إيه؟")}</Pill>
            <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("يلا نختار الهدية سوا")}</h2>
            <p className="mt-3 text-lg leading-8 text-ink-2">{t("أجب عن أسئلة قصيرة، ونعرض لك الهدايا المناسبة فوراً.")}</p>
          </div>
          <div className="reveal">
            <GiftFinder occasions={sf.occasions.map((o) => ({ slug: o.slug, name: o.name }))} />
          </div>
        </div>
      </section>

      {quote("red").text && (
        <Quote band tone="red" by={quote("red").sub || undefined}>
          {quote("red").text}
        </Quote>
      )}

      {/* الموسم: شريط أحمر غامق بعرض الصفحة، والهدايا صف بيتسحب */}
      {seasonPackages.length > 0 && season && (
        <section className="bg-maroon py-12 text-maroon-ink sm:py-16">
          <div className="container-x">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Pill tone="light">{t("متاحة لحد آخر ميعاد طلب بس")}</Pill>
                <h2 className="mt-3 text-4xl text-maroon-ink sm:text-5xl">{t("هدايا {name}", { name: season.name })}</h2>
              </div>
              <Link
                href={season.occasionSlug ? `/occasions/${season.occasionSlug}` : "/shop"}
                className="btn border border-maroon-ink/50 text-maroon-ink hover:bg-maroon-ink hover:text-maroon"
              >
                {t("شوف كل هدايا الموسم")}
              </Link>
            </div>
            <ScrollRow label={t("هدايا {name}", { name: season.name })}>
              {seasonPackages.map((p, i) => (
                <PackageCard key={p.id} pkg={p} priority={i < 2} />
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* كارت الهدية وورشة مع الصحاب/العروسة: كروت جنب بعض */}
      {(on.giftCard || kitSections.length > 0) && (
        <section className="reveal-stagger container-x grid gap-6 lg:grid-cols-2">
          {on.giftCard && (
            <div className="panel grain grid items-center gap-6 overflow-hidden border border-line bg-paper px-6 py-10 sm:grid-cols-[0.9fr_1.1fr] sm:px-10">
              <div className="animate-float mx-auto w-full max-w-[16rem]">
                <GiftCardArt design="classic" title={t("كارت هدية")} storeName={t(STORE_NAME)} className="[transform:perspective(1000px)_rotateY(-16deg)_rotate(-8deg)]" />
              </div>
              <div className="reveal text-center sm:text-start">
                <span className="font-script text-3xl text-brand">{t("مش عارف تجيب إيه؟")}</span>
                <h2 className="mt-1 text-3xl leading-tight sm:text-4xl">{t("خليه هو يختار")}</h2>
                <p className="mt-3 text-ink-2">{t("كارت هدية بالمبلغ اللي تحبه، بيوصله على واتساب.")}</p>
                <Link href="/gift-card" className="btn-primary mt-6">
                  {t("اشتري كارت هدية")}
                </Link>
              </div>
            </div>
          )}
          {kitSections.map((c, i) => {
            const pics = c.images.filter(Boolean).slice(0, 3);
            return (
              <div key={c.href} className={`panel grain grid items-center gap-6 overflow-hidden px-6 py-10 sm:grid-cols-[1fr_1fr] sm:px-10 ${c.tone} ${!on.giftCard && kitSections.length === 1 ? "lg:col-span-2" : ""} ${on.giftCard && kitSections.length === 2 && i === 1 ? "lg:col-span-2" : ""}`}>
                <div className="relative mx-auto h-52 w-full max-w-xs">
                  {pics.map((src, j) => (
                    <Polaroid
                      key={src}
                      rotate={[-18, 15, -6][j]}
                      delay={j * 0.12}
                      tape={(["pink", "butter", "lilac"] as const)[j]}
                      className={`absolute w-32 ${["start-0 top-2", "end-0 top-0", "start-1/2 bottom-0 -translate-x-1/2 rtl:translate-x-1/2"][j]}`}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <Image src={src} alt="" fill sizes="140px" className="object-cover" />
                      </div>
                    </Polaroid>
                  ))}
                </div>
                <div className="reveal text-center sm:text-start">
                  <span className="font-script text-3xl text-brand">{t(c.kicker)}</span>
                  <h2 className="mt-1 text-3xl leading-tight sm:text-4xl">{t(c.title)}</h2>
                  <p className="mt-2 text-ink-2">{t(c.line)}</p>
                  <ul className="mt-4 space-y-1.5 text-[15px] font-semibold text-ink">
                    {c.tags.map((x) => (
                      <li key={x} className="flex items-center justify-center gap-2 sm:justify-start">
                        <span className="grid size-5 place-items-center rounded-full bg-paper text-brand shadow-sm">
                          <Icon name="check" className="size-3.5" />
                        </span>
                        {t(x)}
                      </li>
                    ))}
                  </ul>
                  <Link href={c.href} className="btn-primary mt-6">
                    {t(c.cta)}
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* البراندات المحلية: شريط بعرض الصفحة، الكلام والدواير جنب بعض، وتحتهم صف البراندات */}
      {on.brands && (
        <section className="grain bg-blue-soft py-12 sm:py-16">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="reveal max-w-2xl">
                <Pill>{t("ورا كل هدية حد عملها بحب")}</Pill>
                <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("براندات من أسيوط")}</h2>
                <p className="mt-3 text-lg leading-8 text-ink-2">
                  {t("كل منتج عندنا جاي من براند محلي صغير. اعرف مين عمله، واشتري منه أو اعمل هديتك كلها من منتجاته.")}
                </p>
              </div>
              <Link href="/brands" className="btn-primary">
                {t("كل البراندات")}
              </Link>
            </div>
            <div className="mt-10">
              {/* شبكة بدل صف بيتسحب: البراندات لسه قليلة، والصف كان بيسيب فاضي كبير */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* في الموبايل أول 3 بس عشان الصفحة متطولش */}
                {sf.brands.slice(0, 6).map((b, i) => (
                  <div key={b.id} className={i >= 3 ? "hidden sm:block" : ""}>
                    <BrandCard brand={b} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
