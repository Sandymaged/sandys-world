import Link from "next/link";
import { CatalogTabs } from "@/components/admin/catalog-ui";
import { Empty } from "@/components/admin/ui";
import { GiftArt } from "@/components/gift-art";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "البراندات المحلية" };

/** سجل الشركاء: الاسم، التواصل، نسبة العمولة، منتجاتهم (FR-114) */
export default async function AdminBrands() {
  await requireAdmin();
  const d = await loadCatalogData();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CatalogTabs />
        <Link href="/admin/catalog/brands/new" className="btn-primary btn-sm ms-auto">+ براند جديد</Link>
      </div>
      {d.partners.length === 0 ? (
        <Empty>لسه مفيش براندات.</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {d.partners.map((b) => {
            const count = d.products.filter((p) => p.partnerId === b.id).length;
            return (
              <li key={b.id}>
                <Link href={`/admin/catalog/brands/${b.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/40">
                  <GiftArt image={b.cover} label={b.name} className="size-12 shrink-0" sizes="48px" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{b.name}</span>
                    <span className="block truncate text-xs text-muted">{b.city} · {b.tagline}</span>
                  </span>
                  <span className="tabular text-xs text-muted">{count} منتجات</span>
                  <span className="tabular w-24 text-end text-sm font-semibold">عمولة {Math.round(b.commissionRate * 100)}%</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
