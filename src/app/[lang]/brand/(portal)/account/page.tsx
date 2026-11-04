import { ActionForm } from "@/components/admin/action-form";
import { Box } from "@/components/brand/bits";
import { changePasswordAction } from "@/lib/brand-actions";
import { requireBrand } from "@/lib/brand-auth";

export const instant = false;

export const metadata = { title: "كلمة السر" };

export default async function BrandAccount() {
  const s = await requireBrand();
  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-3xl text-brand">كلمة السر</h1>
        <p className="mt-1 text-sm text-ink-2">
          داخل بـ <b dir="ltr">{s.email}</b>
        </p>
      </div>
      <Box>
        <ActionForm action={changePasswordAction} submitLabel="غيّر كلمة السر" doneLabel="اتغيرت ✓" resetOnSuccess>
          <div>
            <label className="label" htmlFor="current">كلمة السر الحالية</label>
            <input id="current" name="current" type="password" dir="ltr" className="field" autoComplete="current-password" required />
          </div>
          <div>
            <label className="label" htmlFor="next">كلمة السر الجديدة (8 حروف أو أكتر)</label>
            <input id="next" name="next" type="password" dir="ltr" className="field" autoComplete="new-password" minLength={8} required />
          </div>
          <div>
            <label className="label" htmlFor="confirm">اكتبها تاني</label>
            <input id="confirm" name="confirm" type="password" dir="ltr" className="field" autoComplete="new-password" minLength={8} required />
          </div>
        </ActionForm>
      </Box>
      <p className="text-xs leading-5 text-muted">نسيت كلمة السر؟ كلّم المتجر وهيعملك واحدة جديدة.</p>
    </div>
  );
}
