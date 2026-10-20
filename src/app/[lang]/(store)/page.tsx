import Image from "next/image";
import { AssistantPromo } from "@/components/assistant-promo";
import { BasketReveal } from "@/components/basket-reveal";
import { BrandCard } from "@/components/brand-card";
import { CardWriter } from "@/components/card-writer";
import { EnvelopeSteps } from "@/components/envelope-steps";
import { Grid, PackageCard, Rail } from "@/components/cards";
import { GiftArt } from "@/components/gift-art";
import { GiftCardArt } from "@/components/gift-card-art";
import { GiftFinder } from "@/components/gift-finder";
import { Hero } from "@/components/hero";
import { Icon } from "@/components/icons";
import { NoteBoard } from "@/components/note-board";
import { Pill, Quote, ScrapTitle } from "@/components/scrapbook";
import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { getLocalizedStorefront } from "@/lib/catalog";
import { getLocale } from "@/i18n/server";
import { getSiteSettings, type QuoteSlot } from "@/lib/site-settings";
import { egp } from "@/lib/format";
import { STORE_NAME } from "@/lib/settings";

/*
 * الصفحة الرئيسية زي صفحات دفتر: كل قسم صفحة مدورة لوحدها على ورق كريمي،
 * وبينهم اقتباسات عن الهدايا. فيها تجربتين صغيرين: نختار الهدية سوا، واكتب كارتك.
 */

// اللي بيوصل مع كل هدية: ورق متثبت على اللوحة
const notes = [
  { title: "صورة قبل ما تخرج", body: "بنبعتلك صورة الهدية على واتساب قبل ما تتحرك." },
  { title: "كارت برسالتك", body: "مكتوب بخط حلو ومتحط جوه الهدية." },
  { title: "متغلفة بحب", body: "ورق وشرايط على ذوق المناسبة." },
  { title: "في الميعاد اللي تختاره", body: "يوم وفترة توصيل لكل هدية." },
  { title: "من براندات أسيوط", body: "كل حاجة معمولة بإيد ناس من بلدنا." },
  { title: "تتابع طلبك", body: "وتعرف هو فين لحد ما يتسلم." },
];

const steps = [
  ["اختار الهدية", "باكدج جاهز، أو بوكس على ذوقك، أو اكتب الاسم على المنتج."],
  ["حدد المستلم والميعاد", "لكل هدية عنوان ويوم وفترة توصيل، ورسالة كارت."],
  ["ادفع", "إنستاباي من أي مكان، أو كاش لو إنت المستلم."],
  ["استلم الصور", "صورة الهدية قبل ما تخرج، وصورة وهي بتتسلم، على واتساب."],
];

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
  // الباكدج اللي فيه أكتر حاجات: بنفرده كمثال على «إيه اللي جوه»
  const spotlight = [...featured].sort((a, b) => b.products.length - a.products.length)[0];
  const photo = (slug: string) => sf.products.find((p) => p.slug === slug);
  const heroImages = [
    { slug: "rose-bouquet", caption: "ورد الصبح" },
    { slug: "chocolate-box", caption: "حاجة حلوة" },
  ]
    .map((h) => ({ p: photo(h.slug), caption: h.caption }))
    .filter((h) => h.p?.images[0])
    .map((h) => ({ src: h.p!.images[0], alt: h.p!.name, caption: h.caption }));
  const bridal = sf.kits.find((k) => k.category === "bridal");
  const workshop = sf.kits.find((k) => k.category === "workshop");

  return (
    <div className="space-y-16 overflow-x-clip pb-4 sm:space-y-24">
      <Hero
        showBox={on.box}
        images={heroImages}
        seasonName={season?.name ?? null}
        seasonHref={season?.occasionSlug ? `/occasions/${season.occasionSlug}` : "/shop"}
        deadline={season?.readyDeadline ?? null}
      />

      {/* نختار الهدية سوا */}
      <section className="container-x">
        <div className="panel grid gap-10 bg-paper px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal">
            <Pill>{t("محتار تجيب إيه؟")}</Pill>
            <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("يلا نختار الهدية سوا")}</h2>
            <p className="mt-3 text-lg leading-8 text-ink-2">{t("جاوب على ٣ أسئلة صغيرين، وهنوريك الهدايا اللي تناسبك على طول.")}</p>
          </div>
          <GiftFinder occasions={sf.occasions.map((o) => ({ slug: o.slug, name: o.name }))} />
        </div>
      </section>

      {/* مع كل هدية: لوحة الورق المتثبت */}
      <section className="container-x">
        <ScrapTitle kicker={t("مش بس هدية")} title={t("هتاخد إيه مع كل هدية؟")} className="mb-10" />
        <NoteBoard notes={notes.map((n) => ({ title: t(n.title), body: t(n.body) }))} />
      </section>

      <section className="container-x">
        {quote("red").text && (
          <Quote tone="red" by={quote("red").sub || undefined}>
            {quote("red").text}
          </Quote>
        )}
      </section>

      {/* المناسبات */}
      <section className="container-x">
        <ScrapTitle kicker={t("بتحتفل بإيه؟")} title={t("تسوّق حسب المناسبة")} />
        <div className="scroll-x mt-10 gap-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-9 lg:px-0">
          {sf.occasions.map((o) => (
            <Link key={o.slug} href={`/occasions/${o.slug}`} className="group block w-28 shrink-0 text-center lg:w-auto">
              <div className="mx-auto overflow-hidden rounded-full border-4 border-paper shadow-[0_14px_24px_-18px_rgb(60_30_20/0.6)] transition-transform group-hover:-translate-y-1">
                <GiftArt image={o.image} label={o.name} className="aspect-square" sizes="120px" zoom />
              </div>
              <span className="mt-3 block text-[15px] font-semibold text-ink group-hover:text-brand">{o.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* إيه اللي جوه: باكدج واحد بالتفصيل */}
      {spotlight && (
        <section className="container-x">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="reveal order-2 lg:order-1">
              <Pill tone="blue">{t("بصي من قريب")}</Pill>
              <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("كل باكدج متجمع بإيد، من براندات محلية")}</h2>
              <p className="mt-4 text-lg leading-8 text-ink-2">
                {t("كل حاجة جوه الباكدج جاية من براند صغير من أسيوط، ومكتوب جنبها اسمه. بنغلفها ونكتب الكارت ونبعتلك صورتها قبل ما تخرج.")}
              </p>
              <ul className="mt-6 space-y-3">
                {spotlight.products.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 text-[15px]">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-soft text-blue-deep">
                      <Icon name="check" className="size-4" />
                    </span>
                    <span className="font-semibold">{p.name}</span>
                    {p.brand && <span className="text-muted">· {p.brand}</span>}
                  </li>
                ))}
              </ul>
              <Link href={`/packages/${spotlight.slug}`} className="btn-primary mt-8">
                {t("شوف «{name}» بـ {price}", { name: spotlight.name, price: egp(spotlight.price, t) })}
              </Link>
            </div>
            <div className="order-1 lg:order-2">
              <BasketReveal
                className="mx-auto max-w-md"
                title={t("استني… إيه اللي جوه الباكدج؟")}
                subtitle={spotlight.name}
                items={spotlight.products.map((p) => ({ key: p.id, name: p.name, brand: p.brand, image: p.images[0], quantity: p.quantity }))}
              />
            </div>
          </div>
        </section>
      )}

      {/* الموسم: الصفحة الحمرا الغامقة */}
      {seasonPackages.length > 0 && season && (
        <section className="container-x">
          <div className="panel bg-maroon px-5 py-12 text-maroon-ink sm:px-10 sm:py-16">
            <ScrapTitle kicker={t("متاحة لحد آخر ميعاد طلب بس")} title={t("هدايا {name}", { name: season.name })} ink="text-maroon-ink" kickerTone="light" />
            <div className="mt-10">
              <Rail>
                {seasonPackages.map((p, i) => (
                  <PackageCard key={p.id} pkg={p} priority={i < 2} />
                ))}
              </Rail>
            </div>
            <div className="mt-8 text-center">
              <Link
                href={season.occasionSlug ? `/occasions/${season.occasionSlug}` : "/shop"}
                className="btn border border-maroon-ink/50 text-maroon-ink hover:bg-maroon-ink hover:text-maroon"
              >
                {t("شوف كل هدايا الموسم")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* الأكثر طلباً */}
      <section className="container-x">
        <ScrapTitle kicker={t("باكدجات جاهزة، والسعر شامل التغليف")} title={t("الأكثر طلباً")} />
        <div className="mt-10">
          <Grid>
            {featured.slice(0, 8).map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </Grid>
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop" className="btn border border-ink/15 bg-paper text-ink hover:border-brand hover:text-brand">
            {t("شوف كل الهدايا")}
          </Link>
        </div>
      </section>

      {/* كارت الهدية: لما تبقى مش عارف تجيب إيه */}
      {on.giftCard && (
        <section className="container-x">
          <div className="panel grid items-center gap-10 overflow-hidden border border-line bg-paper px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-2">
            <div className="relative mx-auto w-full max-w-md py-4">
              <div className="animate-float">
                <GiftCardArt
                  design="classic"
                  title={t("كارت هدية")}
                  storeName={t(STORE_NAME)}
                  className="[transform:perspective(1000px)_rotateY(-16deg)_rotate(-8deg)]"
                />
              </div>
              <div className="mx-auto mt-4 h-5 w-2/3 rounded-full bg-ink/10 blur-md" aria-hidden />
            </div>
            <div className="reveal">
              <Pill>{t("كارت هدية")}</Pill>
              <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("لما تبقى مش عارف تجيبله إيه… خليه هو يختار.")}</h2>
              <p className="mt-4 text-lg leading-8 text-ink-2">
                {t("ابعتله كارت هدية بالمبلغ اللي تحبه، بيوصله على واتساب برسالتك، ويختار بيه اللي يعجبه من الموقع كله.")}
              </p>
              <Link href="/gift-card" className="btn-primary mt-7">
                {t("اشتري كارت هدية")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* اكتب كارتك */}
      <section className="container-x">
        <div className="panel bg-blush px-6 py-10 sm:px-12 sm:py-14">
          <div className="reveal mb-8 max-w-xl">
            <Pill>{t("مع كل هدية كارت")}</Pill>
            <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("جرّب تكتب كارتك")}</h2>
            <p className="mt-3 text-lg leading-8 text-ink-2">
              {t("اكتب رسالتك وشوفها على الكارت. وإنت بتطلب هتكتبها، وإحنا نكتبها بخط حلو ونحطها مع الهدية.")}
            </p>
          </div>
          <CardWriter />
        </div>
      </section>

      <section className="container-x">
        {quote("blue").text && (
          <Quote tone="blue" by={quote("blue").sub || undefined}>
            {quote("blue").text}
          </Quote>
        )}
      </section>

      {/* البراندات المحلية */}
      {on.brands && (
        <section className="container-x">
          <ScrapTitle
            kicker={t("ورا كل هدية حد عملها بحب")}
            title={t("براندات من أسيوط")}
            subtitle={t("كل منتج عندنا جاي من براند محلي صغير. اعرف مين عمله، واشتري منه أو اعمل هديتك كلها من منتجاته.")}
          />
          <div className="mt-10">
            <Rail>
              {sf.brands.slice(0, 8).map((b) => (
                <BrandCard key={b.id} brand={b} />
              ))}
            </Rail>
          </div>
          <div className="mt-8 text-center">
            <Link href="/brands" className="btn border border-ink/15 bg-paper text-ink hover:border-brand hover:text-brand">
              {t("كل البراندات")}
            </Link>
          </div>
        </section>
      )}

      {/* العروسة + ورشة مع الصحاب: صفحتين جنب بعض */}
      <section className="container-x grid gap-6 md:grid-cols-2">
        {[
          {
            href: "/bride",
            img: bridal?.images[0],
            tone: "bg-blush",
            pill: "brand" as const,
            kicker: "مبروك يا عروسة",
            title: "العروسة والإشبينات",
            body: "بوكسات «هتكوني إشبينتي؟» بالأسامي، وهدايا ليكي ولماما، وتوزيعات الفرح على ألوانك.",
            cta: "ادخلي القسم",
          },
          {
            href: "/kits",
            img: workshop?.images[0],
            tone: "bg-blue-soft",
            pill: "blue" as const,
            kicker: "قعدة بنات؟",
            title: "ورشة مع الصحاب",
            body: "كيتات جاهزة بكل الأدوات، تعملوا بيها حاجة بإيديكم في قعدة حلوة.",
            cta: "كل الكيتات",
          },
        ]
          .filter((c) => (c.href === "/bride" ? on.bride : on.kits))
          .map((c) => (
          <Link key={c.href} href={c.href} className={`reveal panel group flex flex-col overflow-hidden ${c.tone}`}>
            {c.img && (
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image src={c.img} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              </div>
            )}
            <div className="flex-1 px-7 py-8 sm:px-10">
              <Pill tone={c.pill}>{t(c.kicker)}</Pill>
              <h2 className="mt-3 text-3xl sm:text-4xl">{t(c.title)}</h2>
              <p className="mt-2 text-lg leading-8 text-ink-2">{t(c.body)}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-semibold text-brand">
                {t(c.cta)}
                <Icon name="chevron" className="size-4 transition-transform group-hover:-translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* مساعد الهدايا */}
      <section className="container-x">
        <AssistantPromo />
      </section>

      {/* إزاي بتوصل */}
      <section className="container-x">
        <div className="panel bg-paper px-6 py-12 sm:px-12 sm:py-16">
          <ScrapTitle kicker={t("بسيطة خالص")} title={t("إزاي بتوصل الهدية")} kickerTone="blue" />
          <div className="mt-12">
            <EnvelopeSteps steps={steps.map(([title, body]) => ({ title: t(title), body: t(body) }))} />
          </div>
        </div>
      </section>

      <section className="container-x">
        {quote("paper").text && (
          <Quote by={quote("paper").sub || undefined}>
            {quote("paper").text}
          </Quote>
        )}
        <div className="mt-8 text-center">
          <Link href="/shop" className="btn-primary px-10">
            {t("يلا نبدأ")}
          </Link>
        </div>
      </section>
    </div>
  );
}
