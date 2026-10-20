import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/nav";
import { Bow } from "@/components/decor";
import { adminLogout } from "@/lib/admin-actions";

/** صفحات اللوحة شخصية وبتتعمل وقت الطلب، فمش محتاجة فحص التنقل الفوري */
export const instant = false;

export const metadata: Metadata = { title: { default: "لوحة التحكم", template: "%s | لوحة التحكم" }, robots: { index: false } };

/** إطار اللوحة: عربي دايماً، ومتظبط للموبايل (أغلب الشغل اليومي منه) */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="min-h-dvh bg-[#fbf7f2]">
      <header className="sticky top-0 z-30 border-b-2 border-dashed border-line bg-bg print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Bow className="w-8 text-brand" />
          <p className="font-heading text-2xl text-brand">لوحة التحكم</p>
          <form action={adminLogout} className="ms-auto">
            <button className="text-sm text-muted underline-offset-4 hover:text-brand hover:underline">خروج</button>
          </form>
        </div>
        <Suspense fallback={<div className="h-11" />}>
          <AdminNav />
        </Suspense>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>{children}</Suspense>
      </main>
    </div>
  );
}
