"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SiteSaveResult } from "@/lib/site-actions";

/** فورم إعدادات الموقع: بيحفظ ويفضل في نفس الصفحة، وبيقول «اتحفظ» */
export function SiteSettingsForm({ action, children }: { action: (f: FormData) => Promise<SiteSaveResult>; children: React.ReactNode }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      action={(f) =>
        start(async () => {
          setMsg(null);
          const r = await action(f);
          setMsg(r.ok ? { ok: true, text: "تم الحفظ ✓ وتحدّث الموقع." } : { ok: false, text: r.error });
          if (r.ok) router.refresh();
        })
      }
      className="space-y-6"
    >
      {children}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-dashed border-line bg-[#fbf7f2]/95 px-4 py-3 backdrop-blur">
        <button disabled={pending} className="btn-primary">{pending ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button>
        {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-brand"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
