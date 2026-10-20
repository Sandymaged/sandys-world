import type { Metadata } from "next";
import { GiftCardForm } from "@/components/gift-card-form";
import { Breadcrumbs } from "@/components/product-info";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("كارت هدية"),
    description: t("مش عارف تجيبله إيه؟ ابعتله كارت هدية يختار بيه اللي يعجبه، بيوصل على واتساب وصالح لمدة سنة."),
  };
}

/** كارت الهدية: لما تبقى مش عارف تجيب إيه، خليه هو يختار */
export default async function GiftCardPage() {
  const t = await getT();
  return (
    <div className="container-x py-6 sm:py-10">
      <Breadcrumbs items={[{ href: "/", label: t("الرئيسية") }, { href: "/shop", label: t("كل الهدايا") }, { label: t("كارت هدية") }]} />
      <h1 className="mb-10 max-w-3xl text-4xl leading-tight sm:text-5xl">{t("بتدوّر على هدية لحد، بس مش عارف تجيبله إيه؟")}</h1>
      <GiftCardForm />
    </div>
  );
}
