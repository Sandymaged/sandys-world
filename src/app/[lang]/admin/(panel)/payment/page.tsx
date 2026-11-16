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
          تظهر هذه البيانات للعميل بعد تأكيد الطلب، ليحوّل المبلغ ويرفع صورة التحويل. للرقم والعنوان زر نسخ، ويُنشأ من الرابط كود QR يمسحه العميل بهاتفه.
        </p>
      </div>
      {!ip.address && !ip.phone && (
        <p className="rounded-2xl bg-[#fff1b8] p-4 text-sm leading-6">لا توجد بيانات بعد، فلن يعرف العميل إلى أين يحوّل. املأ هذه الخانات.</p>
      )}
      <ActionForm action={saveInstapay} submitLabel="حفظ" className="space-y-5">
        <Section title="بيانات التحويل">
          <Row>
            <Field label="رقم الهاتف المربوط بإنستاباي" name="phone" defaultValue={ip.phone} dir="ltr" placeholder="01xxxxxxxxx" />
            <Field label="عنوان إنستاباي (IPA)" name="address" defaultValue={ip.address} dir="ltr" placeholder="name@instapay" />
          </Row>
          <Field label="رابط الدفع" name="link" defaultValue={ip.link} dir="ltr" placeholder="https://ipn.eg/S/..." hint="من تطبيق إنستاباي: «شارك» حسابك. عند الضغط عليه يفتح التطبيق على حسابك مباشرة." />
          <Field label="الاسم الذي يظهر للعميل" name="holderName" defaultValue={ip.holderName} placeholder="الاسم كما هو في إنستاباي" hint="ليتأكد العميل أنه يحوّل إلى الحساب الصحيح." />
        </Section>
      </ActionForm>

      <ActionForm action={saveContact} submitLabel="حفظ" className="space-y-5">
        <Section title="بيانات التواصل">
          <p className="-mt-2 text-sm leading-6 text-muted">تُكتب في آخر ملف العلامات التجارية، لتتمكن العلامة التجارية من التواصل معك.</p>
          <Row>
            <Field label="رقم الواتساب" name="whatsapp" defaultValue={contact.whatsapp} dir="ltr" placeholder="01xxxxxxxxx" />
            <Field label="إنستجرام" name="instagram" defaultValue={contact.instagram} dir="ltr" placeholder="giftful" hint="اسم الحساب فقط، أو رابط الصفحة." />
          </Row>
          <Field label="رابط الموقع" name="website" defaultValue={contact.website} dir="ltr" placeholder="https://..." />
        </Section>
      </ActionForm>
    </div>
  );
}
