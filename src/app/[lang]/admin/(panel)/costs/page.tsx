import { ActionForm } from "@/components/admin/action-form";
import { Field, Row, Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { listZonesAdmin, loadFinance } from "@/lib/finance";
import { saveCostsAction } from "@/lib/finance-actions";

export const instant = false;

export const metadata = { title: "تكاليف التوصيل والتغليف" };

const kindLabel: Record<string, string> = { city: "مدينة أسيوط", markaz: "مراكز أسيوط", governorate: "محافظات تانية" };

/**
 * التكاليف الفعلية على المتجر لكل طلب (بتتخصم من المكسب في التقارير):
 * التوصيل لكل منطقة، وتكلفة التغليف للهدية، وعمولة إنستاباي.
 * وكمان رسوم التوصيل اللي العميل بيدفعها، وفتح وقفل المناطق.
 */
export default async function CostsPage() {
  await requireAdmin();
  const [f, zones] = await Promise.all([loadFinance(), listZonesAdmin()]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-brand">تكاليف التوصيل والتغليف</h1>
        <p className="mt-1 text-sm text-muted">التكاليف دي للوحة بس، العملاء مش بيشوفوها. بيتحسب منها المكسب الحقيقي في التقارير.</p>
      </div>

      <ActionForm action={saveCostsAction} submitLabel="حفظ التكاليف" className="space-y-5">
        <Section title="مناطق التوصيل">
          <p className="-mt-2 text-sm text-muted">«العميل بيدفع» هي رسوم التوصيل اللي بتظهر في الموقع. «بيكلفك» هي اللي بتدفعيها فعلاً للمندوب أو شركة الشحن.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="pb-2 text-start font-medium">المنطقة</th>
                  <th className="pb-2 text-start font-medium">العميل بيدفع (ج.م)</th>
                  <th className="pb-2 text-start font-medium">بيكلفك (ج.م)</th>
                  <th className="pb-2 text-start font-medium">مفتوحة</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-t border-dashed border-line">
                    <td className="py-2 pe-3">
                      <p className="font-semibold">{z.name}</p>
                      <p className="text-xs text-muted">{kindLabel[z.kind] ?? z.kind}</p>
                    </td>
                    <td className="py-2 pe-3">
                      <input name={`zf_${z.id}`} defaultValue={z.fee} inputMode="numeric" className="field tabular h-10 w-28" aria-label={`رسوم ${z.name}`} />
                    </td>
                    <td className="py-2 pe-3">
                      <input name={`zc_${z.id}`} defaultValue={f.zoneCosts[z.id] ?? ""} inputMode="numeric" placeholder="0" className="field tabular h-10 w-28" aria-label={`تكلفة ${z.name}`} />
                    </td>
                    <td className="py-2">
                      <input type="checkbox" name={`za_${z.id}`} defaultChecked={z.isActive} className="size-5 accent-brand" aria-label={`${z.name} مفتوحة`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="التغليف">
          <Field
            label="تكلفة التغليف للهدية الواحدة (ج.م)"
            name="packagingCostPerGift"
            type="number"
            defaultValue={f.packagingCostPerGift || ""}
            hint="متوسط اللي بيكلفك الورق والعلبة والشريطة والكارت لكل هدية."
          />
        </Section>

        <Section title="عمولة إنستاباي">
          <Row>
            <Field label="النسبة (٪)" name="instapayFeeRate" type="number" defaultValue={f.instapayFeeRate || ""} hint="لو مفيش عمولة على التحويلات اللي بتوصلك سيبيها فاضية." />
            <Field label="أقصى عمولة للتحويل الواحد (ج.م)" name="instapayFeeMax" type="number" defaultValue={f.instapayFeeMax || ""} hint="فاضي = من غير حد." />
          </Row>
        </Section>
      </ActionForm>
    </div>
  );
}
