import Link from "next/link";
import { Empty } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { egp } from "@/lib/format";
import { cairoDay, listCoupons } from "@/lib/store-setup";

export const instant = false;

export const metadata = { title: "أكواد الخصم" };

/** أكواد الخصم: نسبة أو مبلغ، بحد أدنى للطلب وتاريخ انتهاء وعدد مرات */
export default async function AdminCoupons() {
  await requireAdmin();
  const coupons = await listCoupons();
  const now = Date.now();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-brand">أكواد الخصم</h1>
        <Link href="/admin/coupons/new" className="btn-primary btn-sm ms-auto">+ كود جديد</Link>
      </div>
      <p className="text-sm text-muted">الخصم بيتحسب على الهدايا بس، مش على التوصيل ولا على كروت الهدايا.</p>
      {coupons.length === 0 ? (
        <Empty>لسه مفيش أكواد خصم.</Empty>
      ) : (
        <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          {coupons.map((c) => {
            const expired = c.expiresAt != null && Date.parse(c.expiresAt) < now;
            const usedUp = c.maxUses != null && c.used >= c.maxUses;
            const state = !c.isActive ? "مقفول" : expired ? "انتهى" : usedUp ? "خلص" : null;
            return (
              <li key={c.code}>
                <Link href={`/admin/coupons/${c.code}`} className={`flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-brand-soft/40 ${state ? "opacity-60" : ""}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono font-semibold" dir="ltr">{c.code}</span>
                    <span className="tabular block text-xs text-muted">
                      {c.kind === "percent" ? `${c.value}٪` : egp(c.value)} خصم
                      {c.minOrder > 0 && ` · على طلب ${egp(c.minOrder)} أو أكتر`}
                      {c.expiresAt && ` · لحد ${cairoDay(c.expiresAt)}`}
                    </span>
                  </span>
                  <span className="tabular text-xs text-muted">
                    اتستخدم {c.used}
                    {c.maxUses != null && ` من ${c.maxUses}`}
                  </span>
                  {state && <span className="chip border-line bg-white text-xs text-muted">{state}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
