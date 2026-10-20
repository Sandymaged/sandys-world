import type { Metadata } from "next";
import { TrackForm } from "@/components/order-client";
import { PageHeader } from "@/components/scrapbook";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("تابع طلبك"), robots: { index: false } };
}

export default async function TrackPage() {
  const t = await getT();
  return (
    <div>
      <PageHeader tone="lilac" kicker={t("طلبك فين؟")} title={t("تابع طلبك")} subtitle={t("من غير حساب: رقم الطلب والموبايل اللي طلبت بيه.")} />
      <div className="container-x py-12">
        <div className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-6 sm:p-8 shadow-[0_18px_36px_-28px_rgb(60_30_20/0.45)]">
          <TrackForm />
        </div>
      </div>
    </div>
  );
}
