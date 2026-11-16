import { headers } from "next/headers";
import Link from "next/link";
import { AccountRowActions, CreateBrandAccount } from "@/components/admin/brand-accounts";
import { Empty } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { brandAccountsAvailable, listBrandAccounts, type BrandAccount } from "@/lib/brand-auth";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "المستخدمون" };

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Cairo" }) : "لم يدخل بعد";

/** حسابات البراندات المحلية: كل براند بيدخل بإيميل وكلمة سر ويدير منتجاته وطلباته */
export default async function AdminUsers() {
  await requireAdmin();
  const h = await headers();
  const loginUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/brand/login`;
  const catalog = await loadCatalogData();
  const names = new Map(catalog.partners.map((p) => [p.id, p.name]));
  let accounts: BrandAccount[] = [];
  let error: string | null = null;
  if (brandAccountsAvailable()) {
    try {
      accounts = await listBrandAccounts();
    } catch (e) {
      error = e instanceof Error ? e.message : "تعذّر تحميل الحسابات";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-brand">المستخدمون</h1>
        <p className="mt-1 text-sm leading-6 text-ink-2">
          حساب لكل علامة تجارية محلية. تدخل العلامة التجارية من{" "}
          <a href="/brand/login" target="_blank" rel="noreferrer" className="text-brand underline underline-offset-4" dir="ltr">/brand/login</a>{" "}
          وتضيف منتجاتها (بانتظار موافقتك)، وتحدّث الكميات المتوفرة لديها، وتطّلع على طلباتها وتعلّم «سلّمت»، وتتابع حسابها معك.
        </p>
      </div>

      {!brandAccountsAvailable() ? (
        <Empty>تعمل حسابات العلامات التجارية عندما يكون الموقع مربوطاً بـ Supabase.</Empty>
      ) : (
        <>
          <section className="space-y-4 bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            <h2 className="text-xl text-brand">حساب علامة تجارية جديد</h2>
            {catalog.partners.length === 0 ? (
              <p className="text-sm text-muted">
                أضف العلامة التجارية أولاً من <Link href="/admin/catalog/brands" className="text-brand underline">البراندات</Link>.
              </p>
            ) : (
              <CreateBrandAccount brands={catalog.partners.map((p) => ({ id: p.id, name: p.name }))} loginUrl={loginUrl} />
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-ink">الحسابات ({accounts.length})</h2>
            {error && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
            {accounts.length === 0 ? (
              <Empty>لا توجد حسابات علامات تجارية بعد.</Empty>
            ) : (
              <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
                {accounts.map((a) => (
                  <li key={a.userId} className="space-y-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-semibold">{names.get(a.partnerId) ?? "علامة تجارية محذوفة"}</span>
                      <span className="text-sm text-ink-2" dir="ltr">{a.email}</span>
                      <span className="text-xs text-muted">آخر دخول: {when(a.lastSignInAt)}</span>
                      {a.mustChangePassword && <span className="rounded-full bg-butter-soft px-2 py-0.5 text-xs text-butter">ما زال بكلمة المرور المؤقتة</span>}
                    </div>
                    <AccountRowActions userId={a.userId} email={a.email} loginUrl={loginUrl} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
