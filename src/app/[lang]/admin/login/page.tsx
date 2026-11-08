import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/login-form";
import { Bow } from "@/components/decor";
import { Tape } from "@/components/scrapbook";
import { DEFAULT_USERNAME, DEV_PASSWORD, usingDevPassword } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "دخول لوحة التحكم", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main dir="rtl" lang="ar" className="grid min-h-dvh place-items-center bg-gingham p-4">
      <div className="relative w-full max-w-sm -rotate-1 bg-[#fffdf8] p-7 pt-9 text-center shadow-[0_24px_40px_-24px_rgb(60_20_25/0.6)]">
        <Tape tone="lilac" className="-top-3 left-8 -rotate-6" />
        <Tape tone="butter" className="-top-3 right-8 rotate-6" />
        <Bow className="mx-auto w-20 text-brand" />
        <h1 className="mt-2 text-4xl text-brand">لوحة التحكم</h1>
        <p className="mt-1 font-script text-xl text-candy">أهلاً يا صاحبة المتجر</p>
        <div className="mt-6 text-start">
          <AdminLoginForm />
        </div>
        {usingDevPassword() && (
          <p className="mt-5 rounded-xl bg-butter-soft p-3 text-xs leading-5 text-butter">
            وضع التطوير: اسم المستخدم <b dir="ltr">{DEFAULT_USERNAME}</b> وكلمة السر <b className="tabular" dir="ltr">{DEV_PASSWORD}</b>. قبل ما الموقع يفتح لازم تتحط كلمة سر في متغير ADMIN_PASSWORD.
          </p>
        )}
      </div>
    </main>
  );
}
