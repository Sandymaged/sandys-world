import Link from "next/link";
import { Empty } from "@/components/admin/ui";
import { GiftArt } from "@/components/gift-art";
import { requireAdmin } from "@/lib/admin-auth";
import { listOccasions } from "@/lib/store-setup";

export const instant = false;

export const metadata = { title: "المناسبات" };

/** المناسبات اللي الهدايا بتتصنف عليها (تاب المناسبات في الموقع، وصفحة لكل مناسبة) */
export default async function AdminOccasions() {
  await requireAdmin();
  const occasions = await listOccasions();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">المناسبات</h1>
        <Link href="/admin/catalog/occasions/new" className="btn-primary btn-sm ms-auto">+ مناسبة جديدة</Link>
      </div>
      <p className="text-sm text-muted">تظهر في تبويب «المناسبات» أعلى الموقع. بعد إضافة مناسبة، حددها في صفحة كل منتج أو باقة ليظهر فيها.</p>
      {occasions.length === 0 ? (
        <Empty>لا توجد مناسبات بعد.</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {occasions.map((o) => (
            <li key={o.slug}>
              <Link href={`/admin/catalog/occasions/${o.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/40">
                <GiftArt image={o.image} label={o.name} className="size-12 shrink-0" sizes="48px" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{o.name}</span>
                  <span className="block truncate text-xs text-muted" dir="ltr">/occasions/{o.slug}</span>
                </span>
                <span className="tabular text-xs text-muted">ترتيب {o.sort}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
