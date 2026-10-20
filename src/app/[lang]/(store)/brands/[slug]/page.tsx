import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Grid, PackageCard, ProductCard, SectionHeading } from "@/components/cards";
import { Bow } from "@/components/decor";
import { GiftArt } from "@/components/gift-art";
import { Icon } from "@/components/icons";
import { Breadcrumbs } from "@/components/product-info";
import { StickyNote } from "@/components/scrapbook";
import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { getLocalizedStorefront, getStorefront } from "@/lib/catalog";

export async function generateStaticParams() {
  const sf = await getStorefront();
  return sf.brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = (await getLocalizedStorefront()).brands.find((x) => x.slug === slug);
  return b ? { title: b.name, description: b.tagline } : {};
}

export default function BrandPage({ params }: PageProps<"/[lang]/brands/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x py-10"><div className="aspect-[4/3] max-w-md animate-pulse bg-surface" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getT();
  const { slug } = await params;
  const sf = await getLocalizedStorefront();
  const brand = sf.brands.find((b) => b.slug === slug);
  if (!brand) notFound();
  const products = sf.products.filter((p) => p.brandSlug === slug);
  const packages = sf.packages.filter((pk) => pk.products.some((p) => p.brandSlug === slug));
  const boxable = products.some((p) => p.boxEligible);

  return (
    <div>
      <section className="relative bg-gingham-lilac pt-6 pb-16">
        <div className="container-x">
          <Breadcrumbs items={[{ href: "/", label: t("الرئيسية") }, { href: "/brands", label: t("البراندات المحلية") }, { label: brand.name }]} />
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
            <div className="relative mx-auto w-64 -rotate-3 sm:w-72">
              <div className="stamp shadow-[0_18px_30px_-16px_rgb(60_20_25/0.55)]">
                <GiftArt image={brand.cover} label={brand.name} className="aspect-[4/5]" sizes="300px" priority />
              </div>
              <Bow className="absolute -right-6 -bottom-6 w-20 rotate-12 animate-sway text-brand" />
            </div>
            <div className="min-w-0">
              <p className="font-script text-3xl text-lilac">{brand.tagline}</p>
              <h1 className="text-5xl leading-tight text-brand sm:text-6xl">{brand.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-2">
                <span className="flex items-center gap-1">
                  <Icon name="pin" className="size-4" /> {brand.city}
                </span>
                {brand.instagram && (
                  <a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline" dir="ltr">
                    @{brand.instagram}
                  </a>
                )}
              </p>
              <StickyNote tone="white" rotate={1.5} className="mt-6 max-w-lg">
                <p className="leading-8 text-ink-2">{brand.story}</p>
              </StickyNote>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {boxable && (
                  <Link href={`/box?brand=${brand.slug}`} className="btn-primary">
                    {t("اعمل هديتك من {brand}", { brand: brand.name })}
                  </Link>
                )}
                <a href="#products" className="btn border-2 border-brand bg-bg text-brand hover:bg-brand-soft">
                  {t("شوف المنتجات")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="container-x scroll-mt-40 py-14">
        <SectionHeading title={t("منتجات {brand}", { brand: brand.name })} subtitle={t("تتبعت لوحدها أو تحطها في بوكس")} />
        <Grid>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Grid>
      </section>

      {packages.length > 0 && (
        <section className="relative bg-grid-paper py-14">
          <div className="container-x">
            <SectionHeading title={t("باكدجات فيها منتجاتهم")} />
            <Grid>
              {packages.map((p) => (
                <PackageCard key={p.id} pkg={p} />
              ))}
            </Grid>
          </div>
        </section>
      )}
    </div>
  );
}
