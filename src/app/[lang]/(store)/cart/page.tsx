import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getLocalizedStorefront } from "@/lib/catalog";
import { PageHeader } from "@/components/scrapbook";
import { ContactUs } from "@/components/contact-us";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("السلة"), robots: { index: false } };
}

export default async function CartPage() {
  const t = await getT();
  const sf = await getLocalizedStorefront();
  return (
    <>
      <PageHeader tone="lilac" kicker={t("قربنا!")} title={t("السلة")} subtitle={t("رتّب هداياك، وبعدين قولنا هتروح لمين وإمتى.")} />
      <div className="container-x py-10">
        <CartView zones={sf.zones} settings={sf.settings} />
        <ContactUs className="mt-8 max-w-md" />
      </div>
    </>
  );
}
