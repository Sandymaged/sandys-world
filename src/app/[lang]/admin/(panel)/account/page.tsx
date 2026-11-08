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
        <p className="mt-1 text-sm text-muted">اسم المستخدم وكلمة السر اللي بتدخلي بيهم اللوحة.</p>
      </div>
      {info.isDefault && (
        <p className="rounded-2xl bg-[#fff1b8] p-4 text-sm leading-6">
          لسه بتدخلي بالحساب المبدئي (اسم المستخدم <b dir="ltr">admin</b>). اختاري اسم مستخدم وكلمة سر خاصين بيكي.
        </p>
      )}
      <ActionForm action={changeAdminAccount} submitLabel="حفظ" resetOnSuccess className="space-y-5">
        <Section title="تغيير اسم المستخدم وكلمة السر">
          <Field label="كلمة السر الحالية" name="current" type="password" required />
          <Field label="اسم المستخدم" name="username" defaultValue={info.username} dir="ltr" required hint="حروف إنجليزي وأرقام، من 3 لـ 30." />
          <Field label="كلمة السر الجديدة" name="password" type="password" required hint="8 حروف على الأقل. ممكن تكتبي نفس القديمة لو عايزة تغيّري الاسم بس." />
          <Field label="اكتبي كلمة السر الجديدة تاني" name="confirm" type="password" required />
          <p className="text-xs leading-5 text-muted">بعد الحفظ، أي جهاز تاني داخل على اللوحة بيخرج ولازم يدخل بالجديد. الجهاز ده بيفضل داخل.</p>
        </Section>
      </ActionForm>
    </div>
  );
}
