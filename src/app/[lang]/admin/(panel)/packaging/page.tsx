import { ActionForm } from "@/components/admin/action-form";
import { BoxesEditor } from "@/components/admin/boxes-editor";
import { Field, Row, Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { loadStoreConfig } from "@/lib/store-config";
import { saveStoreConfigAction } from "@/lib/store-config-actions";

export const instant = false;

export const metadata = { title: "الصناديق والتغليف" };

/** مقاسات البوكسات وأسعارها وأشكالها، ونسبة التغليف، واختيارات التغليف اللي العميل بيختار منها */
export default async function PackagingPage() {
  await requireAdmin();
  const c = await loadStoreConfig();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-brand">الصناديق والتغليف</h1>
        <p className="mt-1 text-sm text-muted">ما يُضبط هنا يظهر للعميل في «صمّم صندوقك بنفسك» وفي السلة.</p>
      </div>
      <ActionForm action={saveStoreConfigAction} submitLabel="حفظ" className="space-y-5">
        <Section title="نسبة التغليف على الصندوق">
          <p className="-mt-2 text-sm text-muted">تُحسب على سعر الصندوق والمنتجات التي بداخله، أما الباقات الجاهزة فسعرها شامل التغليف.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="النسبة (٪)" name="rate" type="number" defaultValue={Math.round(c.packaging.rate * 1000) / 10} />
            <Field label="الحد الأدنى (ج.م)" name="min" type="number" defaultValue={c.packaging.min} />
            <Field label="الحد الأقصى (ج.م)" name="max" type="number" defaultValue={c.packaging.max} hint="صفر = بلا حد" />
          </div>
        </Section>
        <Section title="الصناديق وخيارات التغليف">
          <BoxesEditor boxes={c.boxSizes} wrappings={c.wrappings} />
        </Section>
      </ActionForm>
      <Row>
        <p className="text-xs text-muted">ملاحظة: حذف صندوق لا يؤثر على الطلبات السابقة التي استخدمته.</p>
      </Row>
    </div>
  );
}
