"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { useT } from "@/i18n/client";
import { submitPaymentProof, trackOrder } from "@/lib/order-actions";
import { Icon } from "./icons";

/** زرار نسخ (المبلغ أو عنوان إنستاباي) */
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* المتصفح رفض النسخ: النص ظاهر ويتنسخ يدوي */
        }
      }}
      className={`chip shrink-0 ${done ? "border-success bg-success text-white" : "border-brand bg-bg text-brand hover:bg-brand-soft"}`}
    >
      {done ? (
        <>
          <Icon name="check" className="me-1 size-4" /> {t("اتنسخ")}
        </>
      ) : (
        label ?? t("نسخ")
      )}
    </button>
  );
}

/** فورم الرقم المرجعي وصورة التحويل */
export function ProofForm({ token }: { token: string }) {
  const t = useT();
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [state, action, pending] = useActionState(async (_: unknown, form: FormData) => {
    const r = await submitPaymentProof(token, t.locale, form);
    if (r.ok) router.refresh();
    return r;
  }, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="ref">{t("الرقم المرجعي للتحويل")}</label>
        <input id="ref" name="reference" className="field tabular" dir="ltr" inputMode="numeric" autoComplete="off" placeholder="1234567890" required />
      </div>
      <div>
        <span className="label">{t("صورة التحويل")}</span>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-bg p-3 hover:border-brand">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- معاينة محلية (blob) قبل الرفع
            <img src={preview} alt="" className="h-16 w-12 rotate-[-4deg] object-cover shadow" />
          ) : (
            <span className="grid h-16 w-12 place-items-center bg-bg text-candy">
              <Icon name="camera" />
            </span>
          )}
          <span className="text-sm text-ink-2">{preview ? t("غيّر الصورة") : t("اختار سكرين شوت التحويل (JPG أو PNG، لحد 5 ميجا)")}</span>
          <input
            type="file"
            name="proof"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            required
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
        </label>
      </div>
      {state && !state.ok && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{state.error}</p>}
      <motion.button whileTap={{ scale: 0.97 }} disabled={pending} className="btn-primary w-full">
        {pending ? t("لحظة…") : t("ابعت إثبات الدفع")}
      </motion.button>
    </form>
  );
}

/** فورم متابعة الطلب */
export function TrackForm() {
  const t = useT();
  const [state, action, pending] = useActionState(async (_: unknown, form: FormData) => (await trackOrder(t.locale, form)) ?? null, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="tn">{t("رقم الطلب")}</label>
        <input id="tn" name="number" className="field tabular" dir="ltr" inputMode="numeric" placeholder="1001" required />
      </div>
      <div>
        <label className="label" htmlFor="tp">{t("الموبايل اللي طلبت بيه")}</label>
        <input id="tp" name="phone" className="field tabular" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" required />
      </div>
      {state?.error && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? t("لحظة…") : t("تابع الطلب")}</button>
    </form>
  );
}
