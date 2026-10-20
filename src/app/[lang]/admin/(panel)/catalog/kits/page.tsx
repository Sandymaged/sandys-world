import Link from "next/link";
import { Empty, money } from "@/components/admin/ui";
import { GiftArt } from "@/components/gift-art";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "الكيتات والعروسة" };

export default async function AdminKits() {
  await requireAdmin();
  const d = await loadCatalogData();
  const groups = [
    { title: "ورشة مع الصحاب", list: d.kits.filter((k) => k.category === "workshop") },
    { title: "العروسة والإشبينات", list: d.kits.filter((k) => k.category === "bridal") },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">الكيتات والعروسة</h1>
        <Link href="/admin/catalog/kits/new" className="btn-primary btn-sm ms-auto">+ كيت جديد</Link>
      </div>
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="mb-2 text-2xl text-brand">{g.title}</h2>
          {g.list.length === 0 ? (
            <Empty>لسه مفيش.</Empty>
          ) : (
            <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
              {g.list.map((k) => (
                <li key={k.id}>
                  <Link href={`/admin/catalog/kits/${k.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/40">
                    <GiftArt image={k.images[0]} label={k.name} className="size-12 shrink-0" sizes="48px" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{k.name}</span>
                      <span className="block truncate text-xs text-muted">{k.contents.join(" · ")}</span>
                    </span>
                    <span className="tabular text-xs text-muted">{k.minPeople === k.maxPeople ? `${k.minPeople} فرد` : `${k.minPeople}–${k.maxPeople} أفراد`}</span>
                    <span className="tabular w-24 text-end text-sm font-semibold">{money(k.pricePerPerson)}</span>
                    {!k.isAvailable && <span className="rounded-full bg-line px-2 py-0.5 text-xs text-muted">مخفي</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
