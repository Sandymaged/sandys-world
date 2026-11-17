import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/client";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddPackage } from "@/components/add-to-cart";
import { tierStyles } from "@/components/cards";
import { GiftArt } from "@/components/gift-art";
import { Icon } from "@/components/icons";
import { Breadcrumbs, PolicyDetails } from "@/components/product-info";
import { ContactUs } from "@/components/contact-us";
import { atLeastOne, getLocalizedStorefront, getStorefront } from "@/lib/catalog";
import { egp, prepLabel, tierLabels } from "@/lib/format";

import { BasketReveal } from "@/components/basket-reveal";

export async function generateStaticParams() {
  const sf = await getStorefront();
  return atLeastOne(sf.packages.map((p) => ({ slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/packages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pkg = (await getLocalizedStorefront()).packages.find((p) => p.slug === slug);
  return pkg ? { title: pkg.name, description: pkg.description } : {};
}

export default function PackagePage({ params }: PageProps<"/[lang]/packages/[slug]">) {
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
  const pkg = sf.packages.find((p) => p.slug === slug);
  // الباكدج مش ظاهر: خلص منتج فيه، أو اتقفل الموسم بتاعه
  if (!pkg) notFound();
  const contentIds = new Set(pkg.products.map((p) => p.id));
  const addons = sf.products.filter((p) => p.isAddon && !contentIds.has(p.id));
  const occasion = sf.occasions.find((o) => pkg.occasions.includes(o.slug));
  const customizable = pkg.products.some((p) => p.isCustomizable);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: t("الرئيسية") },
          occasion ? { href: `/occasions/${occasion.slug}`, label: t("هدايا {name}", { name: occasion.name }) } : { href: "/shop", label: t("كل الهدايا") },
          { label: pkg.name },
        ]}
      />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="md:sticky md:top-36 md:self-start">
          <BasketReveal
            className="mx-auto max-w-lg rotate-[-1deg]"
            title={t("استني… إيه اللي جوه الباكدج؟")}
            subtitle={t("بصي من قريب")}
            items={pkg.products.map((p) => ({ key: p.id, name: p.name, brand: p.brand, image: p.images[0], quantity: p.quantity }))}
          >
            <p className="font-heading text-xl uppercase">{t("الهدية المثالية بتبدأ من هنا")}</p>
            <a
              href="#order"
              className="tabular rounded-full bg-[#fff6ec] px-8 py-2.5 font-heading text-lg text-[#8f1b22] shadow-[0_6px_0_rgb(0_0_0/0.18)] transition-transform hover:-translate-y-0.5"
            >
              {t("اطلبيها بـ {price}", { price: egp(pkg.price, t) })}
            </a>
          </BasketReveal>
        </div>

        <div className="panel space-y-7 border border-line bg-paper p-6 sm:p-10">
          <div>
            <span className={`inline-block rounded-full border border-line px-3 py-1 text-xs font-semibold ${tierStyles[pkg.tier]}`}>{t("باكدج {tier}", { tier: t(tierLabels[pkg.tier]) })}</span>
            <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-5xl">{pkg.name}</h1>
            <p className="tabular mt-2 font-heading text-3xl text-brand">{egp(pkg.price, t)}</p>
            <p className="mt-1 text-xs text-muted">{t("شامل التغليف والكارت · التوصيل بيتحسب حسب المنطقة")}</p>
            <p className="mt-4 leading-8 text-ink-2">{pkg.description}</p>
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-3 text-sm text-success">
              <Icon name="truck" className="size-[18px] shrink-0" />
              {prepLabel(pkg.prepDays, t)}
            </p>
          </div>

          <section>
            <h2 className="mb-3 text-2xl text-brand">{t("جوه الباكدج")}</h2>
            <ul className="divide-y divide-dashed divide-line rounded-2xl border border-line bg-bg">
              {pkg.products.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <GiftArt image={p.images[0]} label={p.name} className="size-14 shrink-0 rounded-lg" sizes="56px" />
                  <Link href={`/products/${p.slug}`} className="min-w-0 flex-1 text-sm hover:underline">
                    {p.name}
                    {p.quantity > 1 && <span className="tabular text-muted"> × {p.quantity}</span>}
                  </Link>
                  {p.brandSlug && (
                    <Link href={`/brands/${p.brandSlug}`} className="shrink-0 text-xs text-muted underline-offset-2 hover:text-brand hover:underline">
                      {p.brand}
                    </Link>
                  )}
                  {p.isCustomizable && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-ink-2">
                      <Icon name="pen" className="size-3.5" />
                      {t("بالاسم")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div id="order" className="scroll-mt-40">
            <AddPackage pkg={pkg} addons={addons} boxes={sf.boxSizes.filter((b) => (sf.settings.packageBoxes?.[pkg.id] ?? []).includes(b.id))} />
          </div>
          <PolicyDetails customizable={customizable} />
          <ContactUs className="mt-6" />
        </div>
      </div>
    </>
  );
}
