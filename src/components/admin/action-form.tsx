"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Result = { ok: true } | { ok: false; error: string };

/** فورم صغير في اللوحة: بيحفظ ويفضل في نفس الصفحة، وبيقول «اتحفظ» أو المشكلة */
export function ActionForm({
  action,
  submitLabel,
  doneLabel = "تم الحفظ ✓",
  resetOnSuccess = false,
  className = "space-y-4",
  children,
}: {
  action: (f: FormData) => Promise<Result>;
  submitLabel: string;
  doneLabel?: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      action={(f) =>
        start(async () => {
          setMsg(null);
          const r = await action(f);
          setMsg(r.ok ? { ok: true, text: doneLabel } : { ok: false, text: r.error });
          if (r.ok) {
            if (resetOnSuccess) ref.current?.reset();
            router.refresh();
          }
        })
      }
      className={className}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary btn-sm">{pending ? "لحظة…" : submitLabel}</button>
        {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-brand"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}

/** زرار بيعمل action واحد بعد تأكيد (زي مسح مصروف) */
export function ConfirmButton({ action, confirm, label }: { action: () => Promise<Result>; confirm: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirm)) return;
        start(async () => {
          const r = await action();
          if (!r.ok) window.alert(r.error);
          router.refresh();
        });
      }}
      className="text-xs text-muted underline-offset-4 hover:text-brand hover:underline"
    >
      {pending ? "…" : label}
    </button>
  );
}
