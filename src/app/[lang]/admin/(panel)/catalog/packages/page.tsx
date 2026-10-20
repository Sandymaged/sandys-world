import Link from "next/link";
import { Empty, money } from "@/components/admin/ui";
import { GiftArt } from "@/components/gift-art";
import { requireAdmin } from "@/lib/admin-auth";
import { adminOptions } from "@/lib/admin-options";
import { loadCatalogData } from "@/lib/db/catalog-store";
import { tierLabels } from "@/lib/format";

export const instant = false;

export const metadata = { title: "الباكدجات" };

export default async function AdminPackages() {
  await requireAdmin();
  const [d, opts] = await Promise.all([loadCatalogData(), adminOptions()]);
  const products = new Map(d.products.map((p) => [p.id, p]));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">الباكدجات</h1>
        <Link href="/admin/catalog/packages/new" className="btn-primary btn-sm ms-auto">+ باكدج جديد</Link>
      </div>
      {d.packages.length === 0 ? (
        <Empty>لسه مفيش باكدجات.</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {d.packages.map((pk) => {
            const cost = pk.items.reduce((s, i) => s + (products.get(i.productId)?.cost ?? 0) * i.quantity, 0);
            const margin = pk.price ? (pk.price - cost) / pk.price : 0;
            const hidden = !pk.isAvailable || pk.items.some((i) => !products.get(i.productId)?.isAvailable);
            return (
              <li key={pk.id}>
                <Link href={`/admin/catalog/packages/${pk.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/40">
                  <GiftArt image={pk.images[0]} label={pk.name} className="size-12 shrink-0" sizes="48px" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{pk.name} <span className="text-xs font-normal text-muted">· {tierLabels[pk.tier]}</span></span>
                    <span className="block truncate text-xs text-muted">{pk.items.map((i) => products.get(i.productId)?.name ?? "؟").join(" · ")}</span>
                  </span>
                  <span className={`tabular text-xs ${margin < opts.minPackageMargin ? "font-semibold text-brand" : "text-success"}`}>هامش {Math.round(margin * 100)}%</span>
                  <span className="tabular w-20 text-end text-sm font-semibold">{money(pk.price)}</span>
                  {hidden && <span className="rounded-full bg-line px-2 py-0.5 text-xs text-muted">مخفي</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
