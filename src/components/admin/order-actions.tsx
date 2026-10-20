"use client";

import { useState, useTransition } from "react";
import { confirmPayment, rejectPayment, setOrderStatus } from "@/lib/admin-actions";
import { nextStatus, statusLabel } from "@/lib/admin-format";
import type { OrderStatus, PaymentStatus } from "@/lib/db/types";

export function StatusButtons({ id, status }: { id: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const next = nextStatus[status] ?? [];
  const canCancel = !["delivered", "cancelled"].includes(status);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {next.map((s) => (
        <button key={s} disabled={pending} onClick={() => start(() => setOrderStatus(id, s))} className="btn-primary btn-sm">
          ← {statusLabel[s]}
        </button>
      ))}
      {status === "awaiting_payment" && <p className="text-sm text-muted">بيتحرك أول ما الدفع يتأكد.</p>}
      {canCancel && (
        <button
          disabled={pending}
          onClick={() => {
            if (window.confirm("متأكدة إنك عايزة تلغي الأوردر؟ فترات التوصيل هتتفك.")) start(() => setOrderStatus(id, "cancelled", "اتلغى من اللوحة"));
          }}
          className="btn-outline btn-sm text-brand"
        >
          إلغاء
        </button>
      )}
    </div>
  );
}

/** تأكيد أو رفض التحويل (FR-63 / FR-64 / FR-105) */
export function PaymentPanel({
  id,
  status,
  reference,
  proofUrl,
  total,
}: {
  id: string;
  status: PaymentStatus;
  reference: string | null;
  proofUrl: string | null;
  total: number;
}) {
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  return (
    <div className="mt-3 space-y-3">
      {reference && (
        <p className="text-sm">
          الرقم المرجعي: <b className="tabular select-all" dir="ltr">{reference}</b>
        </p>
      )}
      <p className="text-sm">
        المبلغ المطلوب: <b className="tabular">{total.toLocaleString("en-US")} ج.م</b>
      </p>
      {proofUrl && (
        <a href={proofUrl} target="_blank" rel="noreferrer" className="polaroid block w-40 rotate-[-2deg]">
          {/* eslint-disable-next-line @next/next/no-img-element -- صورة خاصة بتتعرض من مسار محمي */}
          <img src={proofUrl} alt="صورة التحويل" className="aspect-[3/4] w-full object-cover" />
        </a>
      )}
      {status === "awaiting_confirmation" && (
        <div className="flex flex-wrap gap-2">
          <button disabled={pending} onClick={() => start(() => confirmPayment(id))} className="btn btn-sm bg-success text-white">
            ✓ المبلغ وصل، أكّد
          </button>
          <button disabled={pending} onClick={() => setRejecting((v) => !v)} className="btn-outline btn-sm text-brand">
            رفض
          </button>
        </div>
      )}
      {rejecting && (
        <form action={(f) => start(() => rejectPayment(id, f).then(() => setRejecting(false)))} className="flex gap-2">
          <input name="reason" className="field h-10" placeholder="السبب: المبلغ ناقص / التحويل مش موجود" />
          <button className="btn btn-sm shrink-0 bg-brand text-white">ابعت</button>
        </form>
      )}
    </div>
  );
}
