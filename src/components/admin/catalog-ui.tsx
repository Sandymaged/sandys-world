"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SaveResult } from "@/lib/admin-catalog-actions";

/** مسح بعد تأكيد، ولو فيه سبب يمنع المسح بيظهر */
export function DeleteButton({ action, backTo, what, confirmText }: { action: () => Promise<SaveResult>; backTo: string; what: string; confirmText?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmText ?? `متأكدة إنك عايزة تمسحي ${what}؟ مفيش رجوع.`)) return;
          start(async () => {
            const r = await action();
            if (r.ok) router.push(backTo);
            else setError(r.error);
          });
        }}
        className="text-sm text-brand underline underline-offset-4"
      >
        {pending ? "بيتمسح…" : `مسح ${what}`}
      </button>
      {error && <p className="mt-2 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
    </div>
  );
}
