import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLoginForm } from "@/components/brand/portal-ui";
import { Logo, Thread } from "@/components/logo";
import { brandAccountsAvailable, getBrandSession } from "@/lib/brand-auth";

export const instant = false;

export const metadata: Metadata = { title: "دخول العلامات التجارية", robots: { index: false } };

export default async function BrandLoginPage() {
  if (await getBrandSession()) redirect("/brand");
  return (
    <main dir="rtl" lang="ar" className="grid min-h-dvh place-items-center bg-bg p-4">
      <div className="panel w-full max-w-sm border border-line bg-paper p-7 text-center shadow-[0_24px_40px_-24px_rgb(90_20_35/0.45)]">
        <span className="text-lg text-ink">
          <Logo />
        </span>
        <h1 className="mt-5 text-3xl text-brand">بوابة العلامات التجارية</h1>
        <Thread className="mx-auto mt-1 w-32 text-candy" />
        <p className="mt-2 text-sm leading-6 text-ink-2">منتجاتك، والطلبات المطلوبة منك، وحسابك مع المتجر.</p>
        <div className="mt-6 text-start">
          {brandAccountsAvailable() ? (
            <BrandLoginForm />
          ) : (
            <p className="rounded-xl bg-butter-soft p-3 text-sm leading-6 text-butter">تعمل حسابات العلامات التجارية عندما يكون الموقع مربوطاً بـ Supabase.</p>
          )}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted">ليس لديك حساب بعد؟ تواصل مع المتجر وسيرسل لك البريد الإلكتروني وكلمة المرور.</p>
      </div>
    </main>
  );
}
