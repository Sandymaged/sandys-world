import Link from "next/link";
import { Empty, money } from "@/components/admin/ui";
import { GiftArt } from "@/components/gift-art";
import { requireBrand } from "@/lib/brand-auth";
import { loadCatalogData } from "@/lib/db/catalog-store";
import { allOptionsSoldOut } from "@/lib/options";

export const instant = false;

export const metadata = { title: "منتجاتي" };

export default async function BrandProducts() {
  const s = await requireBrand();
  const mine = (await loadCatalogData()).products.filter((p) => p.partnerId === s.partnerId);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">منتجاتي</h1>
        <Link href="/brand/products/new" className="btn-primary btn-sm ms-auto">+ منتج جديد</Link>
      </div>
      <p className="text-sm leading-6 text-ink-2">المنتج الجديد بيظهر على الموقع بعد ما المتجر يوافق عليه. السعر والعدد والاختيارات بتتغير على طول.</p>
      {mine.length === 0 ? (
        <Empty>لسه مضفتش منتجات. ابدأ بـ «منتج جديد».</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line overflow-hidden rounded-3xl border border-line bg-paper">
          {mine.map((p) => {
            const out = !p.isAvailable || p.stock === 0 || allOptionsSoldOut(p.options);
            return (
              <li key={p.id}>
                <Link href={`/brand/products/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/40">
                  <GiftArt image={p.images[0]} label={p.name} className="size-12 shrink-0" sizes="48px" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {p.category || "من غير تصنيف"}
                      {typeof p.stock === "number" && <> · فاضل <span className="tabular">{p.stock}</span></>}
                    </span>
                  </span>
                  <span className="tabular w-20 text-end text-sm font-semibold">{money(p.price)}</span>
                  {p.reviewStatus === "pending" ? (
                    <span className="rounded-full bg-butter-soft px-2 py-0.5 text-xs text-butter">مستني موافقة</span>
                  ) : (
                    out && <span className="rounded-full bg-line px-2 py-0.5 text-xs text-muted">خلص</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
