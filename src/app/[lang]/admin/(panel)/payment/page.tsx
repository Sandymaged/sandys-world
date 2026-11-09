import { ActionForm } from "@/components/admin/action-form";
import { Field, Row, Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { loadContact, loadInstapay } from "@/lib/store-setup";
import { saveContact, saveInstapay } from "@/lib/store-setup-actions";

export const instant = false;

export const metadata = { title: "الدفع والتواصل" };

/** بيانات إنستاباي اللي بتظهر للعميل في صفحة الدفع (مع زرار نسخ ولينك وكود QR)، وبيانات تواصل المتجر */
export default async function PaymentSettingsPage() {
  await requireAdmin();
  const [ip, contact] = await Promise.all([loadInstapay(), loadContact()]);
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-3xl text-brand">الدفع والتواصل</h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          البيانات دي بتظهر للعميل بعد ما يأكد الطلب، عشان يحوّل ويرفع صورة التحويل. الرقم والعنوان ليهم زرار نسخ، واللينك بيتعمل منه كود QR يمسحه بالموبايل.
        </p>
      </div>
      {!ip.address && !ip.phone && (
        <p className="rounded-2xl bg-[#fff1b8] p-4 text-sm leading-6">لسه مفيش بيانات، فالعميل مش هيعرف يحوّل على إيه. املي الخانات دي.</p>
      )}
      <ActionForm action={saveInstapay} submitLabel="حفظ" className="space-y-5">
        <Section title="بيانات التحويل">
          <Row>
            <Field label="رقم الموبايل المربوط بإنستاباي" name="phone" defaultValue={ip.phone} dir="ltr" placeholder="01xxxxxxxxx" />
            <Field label="عنوان إنستاباي (IPA)" name="address" defaultValue={ip.address} dir="ltr" placeholder="name@instapay" />
          </Row>
          <Field label="لينك الدفع" name="link" defaultValue={ip.link} dir="ltr" placeholder="https://ipn.eg/S/..." hint="من تطبيق إنستاباي: «شارك» على حسابك. العميل بيدوس عليه يفتح التطبيق على حسابك على طول." />
          <Field label="الاسم اللي هيظهر للعميل" name="holderName" defaultValue={ip.holderName} placeholder="الاسم زي ما هو في إنستاباي" hint="عشان العميل يتأكد إنه بيحوّل للحساب الصح." />
        </Section>
      </ActionForm>

      <ActionForm action={saveContact} submitLabel="حفظ" className="space-y-5">
        <Section title="بيانات التواصل">
          <p className="-mt-2 text-sm leading-6 text-muted">بتتكتب في آخر ملف البراندات، علشان البراند يعرف يكلمك.</p>
          <Row>
            <Field label="رقم الواتساب" name="whatsapp" defaultValue={contact.whatsapp} dir="ltr" placeholder="01xxxxxxxxx" />
            <Field label="الانستجرام" name="instagram" defaultValue={contact.instagram} dir="ltr" placeholder="giftful" hint="الاسم بس، أو لينك الصفحة." />
          </Row>
          <Field label="لينك الموقع" name="website" defaultValue={contact.website} dir="ltr" placeholder="https://..." />
        </Section>
      </ActionForm>
    </div>
  );
}
