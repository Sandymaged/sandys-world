import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddKit } from "@/components/add-kit";
import { GiftArt } from "@/components/gift-art";
import { Icon } from "@/components/icons";
import { Breadcrumbs } from "@/components/product-info";
import { getLocalizedStorefront, getStorefront } from "@/lib/catalog";
import { prepLabel } from "@/lib/format";
import { Polaroid } from "@/components/scrapbook";

export async function generateStaticParams() {
  const sf = await getStorefront();
  return sf.kits.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/kits/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const k = (await getLocalizedStorefront()).kits.find((x) => x.slug === slug);
  return k ? { title: k.name, description: k.description } : {};
}

export default function KitPage({ params }: PageProps<"/[lang]/kits/[slug]">) {
  return (
    <div className="bg-grid-paper py-6 sm:py-10">
      <div className="container-x">
        <Suspense fallback={<div className="aspect-[4/3] max-w-lg animate-pulse rounded-[1.5rem] bg-surface" />}>
          <Content params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getT();
  const { slug } = await params;
  const sf = await getLocalizedStorefront();
  const kit = sf.kits.find((k) => k.slug === slug);
  if (!kit) notFound();

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: t("الرئيسية") }, kit.category === "bridal" ? { href: "/bride", label: t("العروسة والإشبينات") } : { href: "/kits", label: t("ورشة مع الصحاب") }, { label: kit.name }]} />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="md:sticky md:top-36 md:self-start">
          <Polaroid rotate={-2.5} tape="butter" className="mx-auto max-w-md" caption={kit.tagline}>
            <GiftArt image={kit.images[0]} label={kit.name} className="aspect-square" sizes="(max-width: 768px) 100vw, 50vw" priority />
          </Polaroid>
        </div>
        <div className="space-y-7">
          <div>
            <p className="font-script text-2xl text-candy">{kit.tagline}</p>
            <h1 className="text-4xl leading-tight text-brand sm:text-5xl">{kit.name}</h1>
            <p className="mt-4 leading-8 text-ink-2">{kit.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-success">
                <Icon name="truck" className="size-4" /> {prepLabel(kit.prepDays, t)}
              </span>
              {kit.duration && (
              <span className="flex items-center gap-1.5 rounded-full bg-lilac-soft px-3 py-1.5 text-lilac">
                <Icon name="clock" className="size-4" /> {kit.duration}
              </span>
              )}
            </div>
          </div>

          <section className="rounded-[1.5rem] border-2 border-brand bg-bg p-5">
            <h2 className="flex items-center gap-2 text-2xl text-brand">
              {kit.category === "bridal" ? t("البوكس فيه") : t("كيت كل واحدة فيه")}
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {kit.contents.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="text-candy">✦</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <AddKit kit={kit} tiers={sf.settings.weddingDiscounts} />
        </div>
      </div>
    </>
  );
}
