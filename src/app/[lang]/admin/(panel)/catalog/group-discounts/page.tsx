import { ActionForm } from "@/components/admin/action-form";
import { Check, Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { loadGroupDiscounts } from "@/lib/store-setup";
import { saveGroupDiscounts } from "@/lib/store-setup-actions";

export const instant = false;

export const metadata = { title: "خصم الجروبات" };

/** خصم الجروبات على الكيتات: كل ما عدد الأشخاص يزيد الخصم يزيد (لحد 4 شرايح) */
export default async function GroupDiscountsPage() {
  await requireAdmin();
  const g = await loadGroupDiscounts();
  const rows = [...g.tiers].sort((a, b) => a.minQty - b.minQty);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-brand">خصم الجروبات</h1>
        <p className="mt-1 text-sm text-muted">
          بيتطبق على كيتات «ورشة مع الصحاب» وبوكسات العروسة والإشبينات: لما العميل يطلب لعدد أكبر، الكيت كله بيتخصم. وفي صفحة الكيت بيظهرله «زوّدي كام وخدي خصم كام».
        </p>
      </div>
      <ActionForm action={saveGroupDiscounts} submitLabel="حفظ" className="space-y-5">
        <Section title="الخصم">
          <Check label="الخصم شغال" name="enabled" defaultChecked={g.enabled} />
          <p className="-mt-2 text-xs text-muted">لو قفلتيه الشرايح بتفضل محفوظة هنا، والعملاء مش بيشوفوا أي خصم.</p>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr] gap-3 text-xs text-muted sm:max-w-md">
              <span>من عدد (أشخاص أو قطع)</span>
              <span>الخصم ٪</span>
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr] gap-3 sm:max-w-md">
                <input name={`qty_${i}`} defaultValue={rows[i]?.minQty ?? ""} inputMode="numeric" placeholder={i === 0 ? "6" : ""} aria-label={`الشريحة ${i + 1}: من عدد`} className="field tabular" />
                <input name={`pct_${i}`} defaultValue={rows[i] ? Math.round(rows[i].rate * 1000) / 10 : ""} inputMode="decimal" placeholder={i === 0 ? "5" : ""} aria-label={`الشريحة ${i + 1}: الخصم ٪`} className="field tabular" />
              </div>
            ))}
            <p className="text-xs leading-5 text-muted">لحد 4 شرايح، والسطر الفاضي بيتشال. مثلاً: من 6 خصم 5٪، ومن 10 خصم 10٪. العدد الأكبر لازم خصمه أكبر.</p>
          </div>
        </Section>
      </ActionForm>
    </div>
  );
}
