import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/nav";

/** صفحات اللوحة شخصية وبتتعمل وقت الطلب، فمش محتاجة فحص التنقل الفوري */
export const instant = false;

export const metadata: Metadata = { title: { default: "لوحة التحكم", template: "%s | لوحة التحكم" }, robots: { index: false } };

/** إطار اللوحة: عربي دايماً. قايمة جانبية على اليمين (وعلى الموبايل بتتفتح من زرار)، والمحتوى جنبها */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="min-h-dvh bg-[#fbf7f2] lg:flex">
      <Suspense fallback={<div className="hidden w-64 shrink-0 lg:block" />}>
        <AdminNav />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>{children}</Suspense>
      </main>
    </div>
  );
}
