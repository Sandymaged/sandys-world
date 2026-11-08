import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddProduct } from "@/components/add-to-cart";
import { PackageCard, Rail, SectionHeading } from "@/components/cards";
import { GiftArt } from "@/components/gift-art";
import { Icon } from "@/components/icons";
import { Breadcrumbs, PolicyDetails } from "@/components/product-info";
import { atLeastOne, getLocalizedStorefront, getStorefront } from "@/lib/catalog";
import { egp, prepLabel } from "@/lib/format";
import { ProductGallery } from "@/components/product-gallery";
import { Link } from "@/i18n/client";

export async function generateStaticParams() {
  const sf = await getStorefront();
  return atLeastOne(sf.products.map((p) => ({ slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getLocalizedStorefront()).products.find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.description } : {};
}

export default function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  return (
    <div className="bg-grid-paper py-6 sm:py-10">
      <div className="container-x">
        <Suspense fallback={<div className="aspect-[4/5] max-w-lg animate-pulse rounded-2xl bg-surface" />}>
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
  const product = sf.products.find((p) => p.slug === slug);
  if (!product) notFound();
  const inPackages = sf.packages.filter((pk) => pk.products.some((x) => x.id === product.id));
  const brand = sf.brands.find((b) => b.slug === product.brandSlug);

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: t("الرئيسية") }, { href: "/shop", label: t("كل الهدايا") }, { label: product.name }]} />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="md:sticky md:top-36 md:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>
        <div className="panel space-y-7 border border-line bg-paper p-6 sm:p-10">
          <div>
            <p className="font-script text-xl text-candy">{product.category}</p>
            <h1 className="mt-1 text-4xl leading-tight text-ink sm:text-5xl">{product.name}</h1>
            <p className="tabular mt-2 font-heading text-3xl text-brand">{egp(product.price, t)}</p>
            <p className="mt-4 leading-8 text-ink-2">{product.description}</p>
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-3 text-sm text-success">
              <Icon name="truck" className="size-[18px] shrink-0" />
              {prepLabel(product.prepDays, t)}
            </p>
          </div>
          {brand && (
            <div className="relative flex items-center gap-4 rounded-2xl bg-blue-soft p-4">
              <div className="stamp w-16 shrink-0 -rotate-3">
                <GiftArt image={brand.cover} label={brand.name} className="aspect-[4/5]" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-script text-lg leading-tight text-lilac">{t("من صنع")}</p>
                <Link href={`/brands/${brand.slug}`} className="font-heading text-2xl text-brand hover:underline">
                  {brand.name}
                </Link>
                <p className="truncate text-xs text-ink-2">{brand.tagline}</p>
              </div>
              <Link href={`/box?brand=${brand.slug}`} className="hidden shrink-0 text-xs font-semibold text-brand underline underline-offset-4 sm:block">
                {t("اعمل هديتك من {brand}", { brand: brand.name })}
              </Link>
            </div>
          )}
          <AddProduct product={product} />
          <PolicyDetails customizable={product.isCustomizable} />
        </div>
      </div>

      {inPackages.length > 0 && (
        <section className="mt-16">
          <SectionHeading title={t("موجود في الباكدجات دي")} />
          <Rail>
            {inPackages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </Rail>
        </section>
      )}
    </>
  );
}
