import type { Metadata } from "next";
import { BrandCard } from "@/components/brand-card";
import { PageHeader } from "@/components/scrapbook";
import { Reveal } from "@/components/motion/reveal";
import { getT } from "@/i18n/server";
import { getLocalizedStorefront } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("براندات محلية من أسيوط"),
    description: t("اعرف البراندات المحلية اللي ورا كل هدية، واشتري منهم أو اعمل هديتك من منتجاتهم."),
  };
}

export default async function BrandsPage() {
  const t = await getT();
  const sf = await getLocalizedStorefront();
  return (
    <div>
      <PageHeader
        kicker={t("ورا كل هدية حد عملها بحب")}
        title={t("براندات محلية من أسيوط")}
        subtitle={t("كل منتج عندنا جاي من براند صغير. اعرف مين عمله، واشتري منه، أو اعمل هديتك كلها من منتجاته.")}
      />

      <section className="container-x py-14">
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {sf.brands.map((b) => (
            <Reveal key={b.id}>
              <BrandCard brand={b} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
