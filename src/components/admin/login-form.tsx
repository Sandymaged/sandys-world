"use client";

import { useActionState } from "react";
import { adminLogin } from "@/lib/admin-actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="user">اسم المستخدم</label>
        <input id="user" name="username" className="field" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="pw">كلمة السر</label>
        <input id="pw" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>
      {state?.error && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "لحظة…" : "دخول"}</button>
    </form>
  );
}
