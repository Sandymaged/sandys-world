import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Grid, PackageCard, ProductCard, SectionHeading } from "@/components/cards";
import { GiftArt } from "@/components/gift-art";
import { atLeastOne, filterCatalog, getLocalizedStorefront, getStorefront } from "@/lib/catalog";
import { PageHeader } from "@/components/scrapbook";

export async function generateStaticParams() {
  const sf = await getStorefront();
  return atLeastOne(sf.occasions.map((o) => ({ slug: o.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/occasions/[slug]">): Promise<Metadata> {
  const t = await getT();
  const { slug } = await params;
  const sf = await getLocalizedStorefront();
  const o = sf.occasions.find((x) => x.slug === slug);
  if (!o) return {};
  return {
    title: t("هدايا {name} في أسيوط", { name: o.name }),
    description: t("باكدجات وهدايا {name} متغلفة وجاهزة، توصل لأي عنوان في أسيوط في الميعاد اللي تختاره.", { name: o.name }),
  };
}

export default async function OccasionPage({ params }: PageProps<"/[lang]/occasions/[slug]">) {
  const t = await getT();
  return (
    <div>
      <Suspense fallback={<p className="text-muted">{t("بنحمّل الهدايا…")}</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getT();
  const { slug } = await params;
  const sf = await getLocalizedStorefront();
  const occasion = sf.occasions.find((o) => o.slug === slug);
  if (!occasion) notFound();
  const { packages, products } = filterCatalog(sf, { occasion: slug });

  return (
    <>
      <PageHeader
        tone="pink"
        kicker={t("بتحتفل بإيه؟")}
        title={t("هدايا {name}", { name: occasion.name })}
        subtitle={t("باكدجات متغلفة جاهزة، أو منتجات تتبعت لوحدها أو في بوكس، وتوصل في الميعاد اللي تختاره.")}
        aside={
          <div className="stamp hidden w-40 shrink-0 rotate-6 shadow-[0_14px_24px_-14px_rgb(60_20_25/0.55)] md:block">
            <GiftArt image={occasion.image} label={occasion.name} className="aspect-[4/5]" sizes="160px" priority />
          </div>
        }
      />
      <div className="container-x py-10">
      {packages.length > 0 && (
        <section className="mb-10">
          <SectionHeading title={t("باكدجات جاهزة")} />
          <Grid>
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </Grid>
        </section>
      )}
      {products.length > 0 && (
        <section>
          <SectionHeading title={t("منتجات")} />
          <Grid>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Grid>
        </section>
      )}
      {packages.length === 0 && products.length === 0 && (
        <p className="rounded-2xl bg-surface p-10 text-center text-muted">{t("لسه مفيش هدايا للمناسبة دي.")}</p>
      )}
      </div>
    </>
  );
}
