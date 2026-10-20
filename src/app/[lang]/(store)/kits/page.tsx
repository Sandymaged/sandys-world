import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/client";
import { GiftArt } from "@/components/gift-art";
import { Reveal, Tilt } from "@/components/motion/reveal";
import { PageHeader } from "@/components/scrapbook";
import { getLocalizedStorefront } from "@/lib/catalog";
import { egp } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("كيتات ورش مع الصحاب"), description: t("كيتات DIY جاهزة لقعدات البنات وأعياد الميلاد: تلوين فرشة شعر، حلقان، شمع، شنط ومجات، وكل كيت بكارت باسم صاحبته.") };
}

const steps = [
  ["اختاري الكيت", "كل كيت محتوياته ثابتة وجاهزة لكل واحدة."],
  ["حددي العدد والأسماء", "خصم تلقائي من 6 أفراد، وكارت باسم كل واحدة."],
  ["يوصلك متغلف", "كل كيت في شنطته أو علبته، جاهز للقعدة."],
];

export default async function KitsPage() {
  const t = await getT();
  const sf = await getLocalizedStorefront();
  return (
    <div className="space-y-16">
      <PageHeader
        tone="lilac"
        kicker={t("قعدة بنات؟")}
        title={t("ورشة مع الصحاب")}
        subtitle={t("كيتات DIY جاهزة لأعياد الميلاد والقعدات: كل واحدة تعمل حاجتها بإيدها وتاخدها معاها.")}
      />

      <section className="container-x">
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {sf.kits.filter((k) => k.category === "workshop").map((k, i) => (
            <Reveal key={k.id} delay={(i % 3) * 0.08}>
              <Tilt className="group">
                <Link href={`/kits/${k.slug}`} className="block">
                  <div className="relative">
                    <GiftArt
                      image={k.images[0]}
                      label={k.name}
                      className="aspect-[4/3] rounded-[1.5rem] border-2 border-brand transition-shadow duration-300 group-hover:shadow-[0_18px_30px_-20px_rgb(60_20_25/0.45)]"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      zoom
                    />
                    <span className="absolute top-3 start-3 -rotate-3 rounded-full border-2 border-brand bg-bg px-3 py-1 font-heading text-lg text-brand">
                      DIY
                    </span>
                  </div>
                  <p className="mt-3 font-script text-lg text-candy">{k.tagline}</p>
                  <h2 className="text-2xl text-brand">{k.name}</h2>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{k.contents.join(" · ")}</p>
                  <p className="mt-1.5 text-sm">
                    <span className="tabular font-semibold text-brand">{egp(k.pricePerPerson, t)}</span>
                    <span className="text-muted"> {t("للفرد")} · {k.duration}</span>
                  </p>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-x">
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title}>
              <Reveal delay={i * 0.1} className="h-full rounded-[1.5rem] rounded-2xl border border-line bg-bg p-5">
                <span className="tabular font-heading text-5xl text-brand">0{i + 1}</span>
                <p className="mt-1 font-semibold">{t(title)}</p>
                <p className="mt-1 text-sm leading-6 text-ink-2">{t(body)}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
