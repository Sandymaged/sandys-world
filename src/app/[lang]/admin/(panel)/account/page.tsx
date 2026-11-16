import { ActionForm } from "@/components/admin/action-form";
import { Field, Section } from "@/components/admin/form";
import { adminAccountInfo, requireAdmin } from "@/lib/admin-auth";
import { changeAdminAccount } from "@/lib/admin-actions";

export const instant = false;

export const metadata = { title: "حسابي" };

/** اسم المستخدم وكلمة السر بتوع اللوحة */
export default async function AccountPage() {
  await requireAdmin();
  const info = await adminAccountInfo();
  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-3xl text-brand">حسابي</h1>
        <p className="mt-1 text-sm text-muted">اسم المستخدم وكلمة المرور اللذان تدخل بهما إلى اللوحة.</p>
      </div>
      {info.isDefault && (
        <p className="rounded-2xl bg-[#fff1b8] p-4 text-sm leading-6">
          ما زلت تدخل بالحساب الافتراضي (اسم المستخدم <b dir="ltr">admin</b>). اختر اسم مستخدم وكلمة مرور خاصين بك.
        </p>
      )}
      <ActionForm action={changeAdminAccount} submitLabel="حفظ" resetOnSuccess className="space-y-5">
        <Section title="تغيير اسم المستخدم وكلمة المرور">
          <Field label="كلمة المرور الحالية" name="current" type="password" required />
          <Field label="اسم المستخدم" name="username" defaultValue={info.username} dir="ltr" required hint="حروف إنجليزية وأرقام، من 3 إلى 30." />
          <Field label="كلمة المرور الجديدة" name="password" type="password" required hint="8 أحرف على الأقل. يمكنك كتابة كلمة المرور القديمة نفسها إن أردت تغيير الاسم فقط." />
          <Field label="أعد كتابة كلمة المرور الجديدة" name="confirm" type="password" required />
          <p className="text-xs leading-5 text-muted">بعد الحفظ، يُسجَّل خروج أي جهاز آخر من اللوحة ويجب أن يدخل بالبيانات الجديدة. يبقى هذا الجهاز مسجّلاً.</p>
        </Section>
      </ActionForm>
    </div>
  );
}
