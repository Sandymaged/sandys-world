import { ActionForm } from "@/components/admin/action-form";
import { Box } from "@/components/brand/bits";
import { changePasswordAction } from "@/lib/brand-actions";
import { requireBrand } from "@/lib/brand-auth";

export const instant = false;

export const metadata = { title: "كلمة المرور" };

export default async function BrandAccount() {
  const s = await requireBrand();
  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-3xl text-brand">كلمة المرور</h1>
        <p className="mt-1 text-sm text-ink-2">
          مسجّل الدخول بـ <b dir="ltr">{s.email}</b>
        </p>
      </div>
      <Box>
        <ActionForm action={changePasswordAction} submitLabel="تغيير كلمة المرور" doneLabel="تم التغيير ✓" resetOnSuccess>
          <div>
            <label className="label" htmlFor="current">كلمة المرور الحالية</label>
            <input id="current" name="current" type="password" dir="ltr" className="field" autoComplete="current-password" required />
          </div>
          <div>
            <label className="label" htmlFor="next">كلمة المرور الجديدة (8 أحرف أو أكثر)</label>
            <input id="next" name="next" type="password" dir="ltr" className="field" autoComplete="new-password" minLength={8} required />
          </div>
          <div>
            <label className="label" htmlFor="confirm">أعد كتابتها</label>
            <input id="confirm" name="confirm" type="password" dir="ltr" className="field" autoComplete="new-password" minLength={8} required />
          </div>
        </ActionForm>
      </Box>
      <p className="text-xs leading-5 text-muted">نسيت كلمة المرور؟ تواصل مع المتجر وسيُنشئ لك كلمة جديدة.</p>
    </div>
  );
}
