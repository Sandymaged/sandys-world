import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout-view";
import { getLocalizedStorefront } from "@/lib/catalog";
import { PageHeader } from "@/components/scrapbook";
import { ContactUs } from "@/components/contact-us";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("إتمام الطلب"), robots: { index: false } };
}

export default async function CheckoutPage() {
  const t = await getT();
  const sf = await getLocalizedStorefront();
  return (
    <>
      <PageHeader tone="lilac" kicker={t("آخر خطوة")} title={t("إتمام الطلب")} />
      <div className="container-x py-10">
        <CheckoutView zones={sf.zones} settings={sf.settings} />
        <ContactUs className="mt-8 max-w-md" />
      </div>
    </>
  );
}
