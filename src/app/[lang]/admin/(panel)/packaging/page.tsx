import { ActionForm } from "@/components/admin/action-form";
import { BoxesEditor } from "@/components/admin/boxes-editor";
import { Field, Row, Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { loadStoreConfig } from "@/lib/store-config";
import { saveStoreConfigAction } from "@/lib/store-config-actions";

export const instant = false;

export const metadata = { title: "البوكسات والتغليف" };

/** مقاسات البوكسات وأسعارها وأشكالها، ونسبة التغليف، واختيارات التغليف اللي العميل بيختار منها */
export default async function PackagingPage() {
  await requireAdmin();
  const c = await loadStoreConfig();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-brand">البوكسات والتغليف</h1>
        <p className="mt-1 text-sm text-muted">اللي هنا بيظهر للعميل في «اعمل البوكس بنفسك» وفي السلة.</p>
      </div>
      <ActionForm action={saveStoreConfigAction} submitLabel="حفظ" className="space-y-5">
        <Section title="نسبة التغليف على البوكس">
          <p className="-mt-2 text-sm text-muted">بتتحسب على سعر البوكس والمنتجات اللي جواه، والباكدجات الجاهزة سعرها شامل التغليف.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="النسبة (٪)" name="rate" type="number" defaultValue={Math.round(c.packaging.rate * 1000) / 10} />
            <Field label="أقل حاجة (ج.م)" name="min" type="number" defaultValue={c.packaging.min} />
            <Field label="أقصى حاجة (ج.م)" name="max" type="number" defaultValue={c.packaging.max} hint="صفر = من غير حد" />
          </div>
        </Section>
        <Section title="البوكسات واختيارات التغليف">
          <BoxesEditor boxes={c.boxSizes} wrappings={c.wrappings} />
        </Section>
      </ActionForm>
      <Row>
        <p className="text-xs text-muted">ملحوظة: مسح بوكس مش بيأثر على الطلبات القديمة اللي اتعملت بيه.</p>
      </Row>
    </div>
  );
}
