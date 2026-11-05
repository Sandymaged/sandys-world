import Link from "next/link";
import { Empty } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { egp } from "@/lib/format";
import { listZones } from "@/lib/store-setup";

export const instant = false;

export const metadata = { title: "مناطق التوصيل" };

const zoneKindLabel: Record<string, string> = { city: "مدينة أسيوط", markaz: "مركز في أسيوط", governorate: "محافظة تانية" };

/** المناطق اللي العميل بيختار منها في الدفع، برسوم التوصيل بتاعة كل واحدة */
export default async function AdminZones() {
  await requireAdmin();
  const zones = await listZones();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">مناطق التوصيل</h1>
        <Link href="/admin/zones/new" className="btn-primary btn-sm ms-auto">+ منطقة جديدة</Link>
      </div>
      <p className="text-sm text-muted">
        العميل بيختار منطقة منهم في صفحة الدفع، ورسومها بتتضاف على الطلب. تكلفة التوصيل الفعلية عليكي بتتكتب في{" "}
        <Link href="/admin/costs" className="text-brand underline underline-offset-4">التكاليف</Link>.
      </p>
      {zones.length === 0 ? (
        <Empty>لسه مفيش مناطق. من غيرها محدش هيقدر يطلب هدية بتوصيل.</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {zones.map((z) => (
            <li key={z.id}>
              <Link href={`/admin/zones/${z.id}`} className={`flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-brand-soft/40 ${z.isActive ? "" : "opacity-60"}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{z.name}</span>
                  <span className="block text-xs text-muted">
                    {zoneKindLabel[z.kind]}
                    {z.sameDay && " · توصيل في نفس اليوم"}
                    {z.extraDays > 0 && ` · ${z.extraDays} أيام زيادة`}
                  </span>
                </span>
                <span className="tabular text-sm font-semibold">{egp(z.fee)}</span>
                {!z.isActive && <span className="chip border-line bg-white text-xs text-muted">مقفولة</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
