"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { createBrandAccountAction, deleteBrandAccountAction, resetBrandPasswordAction } from "@/lib/brand-admin-actions";

/* حسابات البراندات في اللوحة: عمل حساب، وكلمة سر جديدة، ومسح. كلمة السر بتبان مرة واحدة بس عشان تتبعت للبراند */

type Shown = { email: string; password: string } | null;

function PasswordNote({ shown, loginUrl, onClose }: { shown: NonNullable<Shown>; loginUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `أهلاً! ده حسابك على بوابة البراندات في giftful:\n${loginUrl}\nالإيميل: ${shown.email}\nكلمة السر: ${shown.password}\nغيّر كلمة السر أول ما تدخل.`;
  return (
    <div className="space-y-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-sm">
      <p className="font-semibold text-success">الحساب جاهز. ابعتي البيانات دي للبراند (كلمة السر مش هتظهر تاني):</p>
      <pre dir="rtl" className="whitespace-pre-wrap rounded-xl bg-paper p-3 font-sans leading-6 text-ink">{text}</pre>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
        >
          {copied ? "اتنسخ ✓" : "انسخي الرسالة"}
        </button>
        <a className="btn-outline btn-sm" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          ابعتيها واتساب
        </a>
        <button type="button" className="btn-sm text-muted hover:text-brand" onClick={onClose}>
          تمام
        </button>
      </div>
    </div>
  );
}

export function CreateBrandAccount({ brands, loginUrl }: { brands: { id: string; name: string }[]; loginUrl: string }) {
  const [state, action, pending] = useActionState(createBrandAccountAction, null);
  const [hidden, setHidden] = useState<string | null>(null);
  const shown = state?.ok && hidden !== state.password ? state : null;
  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="partnerId">البراند</label>
          <select id="partnerId" name="partnerId" className="field" required defaultValue="">
            <option value="" disabled>اختاري…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="email">إيميل البراند</label>
          <input id="email" name="email" type="email" dir="ltr" className="field" required placeholder="brand@example.com" />
        </div>
        <button disabled={pending} className="btn-primary">{pending ? "لحظة…" : "اعملي الحساب"}</button>
      </form>
      {state && !state.ok && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{state.error}</p>}
      {shown && <PasswordNote shown={shown} loginUrl={loginUrl} onClose={() => setHidden(shown.password)} />}
    </div>
  );
}

export function AccountRowActions({ userId, email, loginUrl }: { userId: string; email: string; loginUrl: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [shown, setShown] = useState<Shown>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          disabled={pending}
          className="text-brand underline-offset-4 hover:underline"
          onClick={() => {
            if (!window.confirm(`كلمة سر جديدة لـ ${email}؟ القديمة هتبطل.`)) return;
            start(async () => {
              const r = await resetBrandPasswordAction(userId, email);
              if (r.ok) setShown({ email: r.email, password: r.password });
              else setError(r.error);
            });
          }}
        >
          كلمة سر جديدة
        </button>
        <button
          type="button"
          disabled={pending}
          className="text-muted underline-offset-4 hover:text-brand hover:underline"
          onClick={() => {
            if (!window.confirm(`تمسحي حساب ${email}؟ البراند مش هيقدر يدخل تاني (منتجاته وطلباته بتفضل زي ما هي).`)) return;
            start(async () => {
              const r = await deleteBrandAccountAction(userId);
              if (!r.ok) setError(r.error);
              router.refresh();
            });
          }}
        >
          مسح الحساب
        </button>
      </div>
      {error && <p className="text-sm text-brand">{error}</p>}
      {shown && <PasswordNote shown={shown} loginUrl={loginUrl} onClose={() => setShown(null)} />}
    </div>
  );
}
