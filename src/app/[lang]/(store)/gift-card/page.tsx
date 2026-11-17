import type { Metadata } from "next";
import { SectionClosed } from "@/components/closed-screens";
import { sectionOpen } from "@/lib/site-settings";
import { GiftCardForm } from "@/components/gift-card-form";
import { Breadcrumbs } from "@/components/product-info";
import { getT } from "@/i18n/server";
import { GIFT_CARD_VALID_DAYS } from "@/lib/gift-card";
import { dayCount } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("كارت هدية"),
    description: t("لا تعرف ماذا تهديه؟ أرسل له بطاقة هدية يختار بها ما يعجبه، تصله على واتساب وصالحة لمدة {days}.", { days: dayCount(GIFT_CARD_VALID_DAYS, t) }),
  };
}

/** كارت الهدية: لما تبقى مش عارف تجيب إيه، خليه هو يختار */
export default async function GiftCardPage() {
  // القسم ده ممكن يتقفل من إعدادات الموقع في اللوحة
  if (!(await sectionOpen("giftCard"))) return <SectionClosed title="كارت هدية" />;
  const t = await getT();
  return (
    <div className="container-x py-6 sm:py-10">
      <Breadcrumbs items={[{ href: "/", label: t("الرئيسية") }, { href: "/shop", label: t("كل الهدايا") }, { label: t("كارت هدية") }]} />
      <h1 className="mb-10 max-w-3xl text-4xl leading-tight sm:text-5xl">{t("بتدوّر على هدية لحد، بس مش عارف تجيبله إيه؟")}</h1>
      <GiftCardForm />
    </div>
  );
}
