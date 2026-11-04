import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandNav } from "@/components/brand/portal-ui";
import { requireBrand } from "@/lib/brand-auth";

/** صفحات البوابة شخصية وبتتعمل وقت الطلب */
export const instant = false;

export const metadata: Metadata = { title: { default: "بوابة البراندات", template: "%s | بوابة البراندات" }, robots: { index: false } };

async function Nav() {
  const s = await requireBrand();
  return <BrandNav brandName={s.partner.name} />;
}

/** بوابة البراند: عربي دايماً، قايمة فوق، والمحتوى تحتها */
export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="min-h-dvh bg-bg">
      <Suspense fallback={<div className="h-28 border-b border-line" />}>
        <Nav />
      </Suspense>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>{children}</Suspense>
      </main>
    </div>
  );
}
