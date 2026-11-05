import Link from "next/link";
import { Empty } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { cairoDay, listSeasons } from "@/lib/store-setup";

export const instant = false;

export const metadata = { title: "المواسم" };

/** المواسم (رمضان، الكريسماس، عيد الأم…): بانر على الصفحة الرئيسية وباكدجات ليها آخر ميعاد طلب */
export default async function AdminSeasons() {
  await requireAdmin();
  const seasons = await listSeasons();
  const now = Date.now();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">المواسم</h1>
        <Link href="/admin/catalog/seasons/new" className="btn-primary btn-sm ms-auto">+ موسم جديد</Link>
      </div>
      <p className="text-sm text-muted">الموسم بيظهر على الصفحة الرئيسية في الفترة اللي تحدديها. عشان تحطي باكدج في الموسم، اختاريه من صفحة الباكدج.</p>
      {seasons.length === 0 ? (
        <Empty>لسه مفيش مواسم.</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {seasons.map((s) => {
            const live = Date.parse(s.visibleFrom) <= now && now <= Date.parse(s.visibleUntil);
            const over = now > Date.parse(s.visibleUntil);
            return (
              <li key={s.id}>
                <Link href={`/admin/catalog/seasons/${s.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-brand-soft/40">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="tabular block text-xs text-muted">
                      بيظهر من {cairoDay(s.visibleFrom)} لـ {cairoDay(s.visibleUntil)} · يوم المناسبة {s.occasionDate}
                    </span>
                  </span>
                  <span className={`chip text-xs ${live ? "border-success bg-success/10 text-success" : "border-line bg-white text-muted"}`}>
                    {live ? "ظاهر دلوقتي" : over ? "خلص" : "لسه"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
