import { ActionForm } from "@/components/admin/action-form";
import { Field, Row, Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { listZonesAdmin, loadFinance } from "@/lib/finance";
import { saveCostsAction } from "@/lib/finance-actions";

export const instant = false;

export const metadata = { title: "تكاليف التوصيل والتغليف" };

const kindLabel: Record<string, string> = { city: "مدينة أسيوط", markaz: "مراكز أسيوط", governorate: "محافظات أخرى" };

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
        <p className="mt-1 text-sm text-muted">هذه التكاليف للوحة فقط، ولا يراها العملاء. يُحسب منها الربح الفعلي في التقارير.</p>
      </div>

      <ActionForm action={saveCostsAction} submitLabel="حفظ التكاليف" className="space-y-5">
        <Section title="مناطق التوصيل">
          <p className="-mt-2 text-sm text-muted">«يدفع العميل» هي رسوم التوصيل التي تظهر في الموقع. «تكلفتك» هي ما تدفعه فعلاً لمندوب التوصيل أو شركة الشحن.</p>
          {/* على الموبايل كل منطقة كارت («تكلفتك» أول خانة)، وعلى الشاشات الكبيرة صفوف زي الجدول، من غير سكرول بالعرض */}
          <div className="text-sm">
            <div className="hidden gap-3 pb-2 text-xs font-medium text-muted sm:grid sm:grid-cols-[minmax(0,1fr)_8rem_8rem_4rem]">
              <span>المنطقة</span>
              <span>تكلفتك (ج.م)</span>
              <span>يدفع العميل (ج.م)</span>
              <span>مفعّلة</span>
            </div>
            {zones.map((z) => (
              <div key={z.id} className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-dashed border-line py-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_4rem] sm:items-center sm:py-2">
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <p className="font-semibold">{z.name}</p>
                  <p className="text-xs text-muted">{kindLabel[z.kind] ?? z.kind}</p>
                </div>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-semibold text-brand sm:hidden">تكلفتك (ج.م)</span>
                  <input name={`zc_${z.id}`} defaultValue={f.zoneCosts[z.id] ?? ""} inputMode="numeric" placeholder="0" className="field tabular h-10 w-full" aria-label={`تكلفة ${z.name}`} />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs text-muted sm:hidden">يدفع العميل (ج.م)</span>
                  <input name={`zf_${z.id}`} defaultValue={z.fee} inputMode="numeric" className="field tabular h-10 w-full" aria-label={`رسوم ${z.name}`} />
                </label>
                <label className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <input type="checkbox" name={`za_${z.id}`} defaultChecked={z.isActive} className="size-5 accent-brand" aria-label={`${z.name} مفعّلة`} />
                  <span className="text-xs text-muted sm:hidden">مفعّلة</span>
                </label>
              </div>
            ))}
          </div>
        </Section>

        <Section title="التغليف">
          <Field
            label="تكلفة التغليف للهدية الواحدة (ج.م)"
            name="packagingCostPerGift"
            type="number"
            defaultValue={f.packagingCostPerGift || ""}
            hint="متوسط تكلفة الورق والعلبة والشريط والبطاقة لكل هدية."
          />
        </Section>

        <Section title="عمولة إنستاباي">
          <Row>
            <Field label="النسبة (٪)" name="instapayFeeRate" type="number" defaultValue={f.instapayFeeRate || ""} hint="إن لم تكن هناك عمولة على التحويلات الواردة، فاتركها فارغة." />
            <Field label="أقصى عمولة للتحويل الواحد (ج.م)" name="instapayFeeMax" type="number" defaultValue={f.instapayFeeMax || ""} hint="فارغ = بلا حد." />
          </Row>
        </Section>
      </ActionForm>
    </div>
  );
}
