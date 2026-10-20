import type { Metadata } from "next";
import Image from "next/image";
import { GiftRibbon } from "@/components/decor";
import { Reveal, Tilt } from "@/components/motion/reveal";
import { Pill, Polaroid, ScrapTitle, TextMarquee } from "@/components/scrapbook";
import { WeddingForm } from "@/components/wedding-form";
import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { getLocalizedStorefront } from "@/lib/catalog";
import { egp } from "@/lib/format";
import type { BridalRole } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("العروسة والإشبينات"),
    description: t("بوكسات «هتكوني إشبينتي؟»، هدايا العروسة وأم العروسة والفلاور جيرل، وتوزيعات ويافطات الفرح."),
  };
}

const roles: { id: BridalRole; label: string; kicker: string; tone: string }[] = [
  { id: "bride", label: "العروسة", kicker: "ليكي إنتي", tone: "bg-brand-soft" },
  { id: "bridesmaid", label: "الإشبينات", kicker: "صحابك", tone: "bg-lilac-soft" },
  { id: "mother", label: "أم العروسة", kicker: "شكراً يا ماما", tone: "bg-butter-soft" },
  { id: "flower-girl", label: "الفلاور جيرل", kicker: "أصغر واحدة", tone: "bg-success-soft" },
];

export default async function BridePage() {
  const t = await getT();
  const sf = await getLocalizedStorefront();
  const sets = sf.kits.filter((k) => k.category === "bridal");
  const proposal = sets.find((k) => k.slug === "bridesmaid-proposal");
  const bride = sets.find((k) => k.slug === "bride-box");

  return (
    <div className="overflow-x-clip">
      {/* البانر: صفحة بينك بالشريطة الكاروهات وصور بولارويد بتطفو */}
      <section className="container-x pt-4 sm:pt-6">
        <div className="panel relative overflow-hidden bg-blush">
          <GiftRibbon className="end-[10%] hidden lg:block" />
          <div className="grid items-center gap-10 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-2 lg:pe-[16%]">
            <div className="animate-fade-up">
              <Pill>{t("مبروك يا عروسة")}</Pill>
              <h1 className="mt-4 text-5xl leading-tight text-ink sm:text-6xl">{t("العروسة والإشبينات")}</h1>
              <p className="mt-3 max-w-md text-lg leading-8 text-ink-2">
                {t("بوكسات تسألي بيها صحابك «هتكوني إشبينتي؟»، وهدايا ليكي ولماما وللفلاور جيرل، وتوزيعات ويافطات الفرح على ألوانك.")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#sets" className="btn-primary">{t("شوفي البوكسات")}</a>
                <a href="#request" className="btn border border-ink/15 bg-paper text-ink hover:border-brand hover:text-brand">{t("توزيعات ويافطات")}</a>
              </div>
            </div>
            <div className="relative mx-auto h-80 w-full max-w-sm sm:h-96">
              {proposal && (
                <div className="absolute top-0 end-0 w-[56%] animate-float">
                  <Polaroid caption={t("هتكوني إشبينتي؟")} rotate={9} delay={0.3} tape={null}>
                    <div className="relative aspect-square overflow-hidden">
                      <Image src={proposal.images[0]} alt={proposal.name} fill sizes="240px" className="object-cover" priority />
                    </div>
                  </Polaroid>
                </div>
              )}
              {bride && (
                <div className="absolute bottom-0 start-0 w-[52%] animate-float [animation-delay:-3.5s]">
                  <Polaroid caption={t("Bride to be")} rotate={-9} delay={0.5} tape={null}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image src={bride.images[0]} alt={bride.name} fill sizes="220px" className="object-cover" priority />
                    </div>
                  </Polaroid>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-x mt-6">
        <div className="overflow-hidden rounded-full bg-maroon py-3 text-maroon-ink">
          <TextMarquee items={[t("هتكوني إشبينتي؟"), t("روب بالاسم"), t("بوكس العروسة"), t("توزيعات على ألوانك"), t("يافطة Welcome")]} />
        </div>
      </div>

      {/* تسوّقي حسب الدور */}
      <section className="relative bg-grid-paper py-16">
        <div className="container-x">
          <ScrapTitle kicker={t("لمين البوكس؟")} title={t("تسوّقي حسب الدور")} />
          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {roles.map((r, i) => {
              const set = sets.find((k) => k.role === r.id);
              return (
                <Reveal key={r.id} delay={i * 0.08} className={i % 2 ? "rotate-2" : "-rotate-2"}>
                  <Tilt>
                    <a href={set ? `#set-${set.slug}` : "#sets"} className={`relative block p-4 pt-6 text-center shadow-[0_14px_22px_-14px_rgb(60_20_25/0.5)] ${r.tone}`}>
                      <p className="font-script text-lg text-candy">{t(r.kicker)}</p>
                      <p className="font-heading text-2xl text-brand">{t(r.label)}</p>
                    </a>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* البوكسات */}
      <section id="sets" className="scroll-mt-40 py-16">
        <div className="container-x">
          <ScrapTitle kicker={t("بالاسم ومتغلفة")} title={t("بوكسات العروسة والإشبينات")} />
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((k, i) => (
              <Reveal key={k.id} delay={(i % 3) * 0.08} className={i % 2 ? "rotate-1" : "-rotate-1"}>
                <Tilt className="group">
                  <Link id={`set-${k.slug}`} href={`/kits/${k.slug}`} className="polaroid relative block scroll-mt-40">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image src={k.images[0]} alt={k.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="px-1 pt-3">
                      <p className="font-script text-lg text-candy">{k.tagline}</p>
                      <h3 className="font-heading text-2xl text-brand">{k.name}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted">{k.contents.join(" · ")}</p>
                      <p className="mt-1.5 text-sm">
                        <span className="tabular font-semibold text-brand">{egp(k.pricePerPerson, t)}</span>
                        {k.maxPeople > 1 && <span className="text-muted"> {t("للفرد")}</span>}
                      </p>
                    </div>
                  </Link>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* طلب خاص: توزيعات ويافطات */}
      <section id="request" className="relative scroll-mt-40 bg-gingham py-16">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-40">
            <ScrapTitle kicker={t("حاجة على ذوقك؟")} title={t("توزيعات ويافطات وطلبات خاصة")} className="lg:text-start" />
            <p className="mt-4 leading-8 text-ink-2 lg:text-start">
              {t("قوليلنا نوع الطلب والعدد وميعاد الفرح وألوانه، وهيوصلك عرض سعر بلينك على واتساب. توافقي وتدفعي عربون 50% والباقي قبل التسليم.")}
            </p>
            <ul className="mt-5 space-y-2 font-script text-xl text-lilac lg:text-start">
              <li>✦ {t("خصم 5% من 6 قطع، و10% من 10 قطع")}</li>
              <li>✦ {t("هنبعتلك شكل التصميم توافقي عليه قبل التنفيذ")}</li>
              <li>✦ {t("يفضل الطلب قبل الفرح بأسبوعين على الأقل")}</li>
            </ul>
          </div>
          <WeddingForm tiers={sf.settings.weddingDiscounts} />
        </div>
      </section>
    </div>
  );
}
