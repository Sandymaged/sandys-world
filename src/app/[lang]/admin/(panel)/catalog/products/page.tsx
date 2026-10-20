import Link from "next/link";
import { Empty, money } from "@/components/admin/ui";
import { GiftArt } from "@/components/gift-art";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "المنتجات" };

export default async function AdminProducts() {
  await requireAdmin();
  const d = await loadCatalogData();
  const brands = new Map(d.partners.map((b) => [b.id, b.name]));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">المنتجات</h1>
        <Link href="/admin/catalog/products/new" className="btn-primary btn-sm ms-auto">+ منتج جديد</Link>
      </div>
      {d.products.length === 0 ? (
        <Empty>لسه مفيش منتجات.</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {d.products.map((p) => {
            const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
            return (
              <li key={p.id}>
                <Link href={`/admin/catalog/products/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/40">
                  <GiftArt image={p.images[0]} label={p.name} className="size-12 shrink-0" sizes="48px" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {p.partnerId ? brands.get(p.partnerId) ?? "براند اتمسح" : "من المتجر"} · {p.category || "من غير تصنيف"}
                    </span>
                  </span>
                  <span className="hidden text-end text-xs text-muted sm:block">
                    تكلفة <span className="tabular">{money(p.cost)}</span>
                    <span className="block">هامش <span className="tabular">{margin}%</span></span>
                  </span>
                  <span className="tabular w-20 text-end text-sm font-semibold">{money(p.price)}</span>
                  {!p.isAvailable && <span className="rounded-full bg-line px-2 py-0.5 text-xs text-muted">خلص</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
