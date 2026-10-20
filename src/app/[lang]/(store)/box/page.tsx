import { getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BoxBuilder } from "@/components/box-builder";
import { getLocalizedStorefront } from "@/lib/catalog";
import { PageHeader } from "@/components/scrapbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("اعمل البوكس بنفسك"), description: t("اختار حجم البوكس واملاه بالهدايا اللي تعجبك، والسعر بيتحسب قدامك.") };
}

export default async function BoxPage({ searchParams }: PageProps<"/[lang]/box">) {
  const t = await getT();
  return (
    <>
      <PageHeader tone="grid" kicker={t("على ذوقك")} title={t("اعمل البوكس بنفسك")} subtitle={t("اختار الحجم، واملاه باللي يعجبك، وإحنا نغلفه وننسقه.")} />
      <div className="container-x py-10">
        <Suspense fallback={<p className="text-muted">{t("بنجهز البوكس…")}</p>}>
          <Builder searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Builder({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  const [{ add, brand: brandParam }, sf] = await Promise.all([searchParams, getLocalizedStorefront()]);
  // ?brand=slug: البوكس من منتجات براند واحد بس
  const brand = sf.brands.find((b) => b.slug === brandParam);
  const products = sf.products.filter((p) => p.boxEligible && (!brand || p.brandSlug === brand.slug));
  const initial = products.find((p) => p.slug === add)?.id;
  return (
    <>
      {brand && (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[1.25rem] rounded-2xl bg-blue-soft p-4">
          <p className="flex-1 text-sm">
            {t("بتعمل بوكس من منتجات {brand} بس.", { brand: brand.name })}
          </p>
          <Link href="/box" className="text-sm font-semibold text-brand underline underline-offset-4">
            {t("شوف كل المنتجات")}
          </Link>
        </div>
      )}
    <BoxBuilder
      sizes={sf.boxSizes}
      products={products}
      packaging={sf.settings.packaging}
      initialProductId={initial}
    />
    </>
  );
}
