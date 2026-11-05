"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmPayment, markRedeliveryPaid, redeliverAction, rejectPayment, setGiftCardSent, setOrderStatus } from "@/lib/admin-actions";
import { cancellable, nextStatus, statusLabel } from "@/lib/admin-format";
import type { OrderStatus, PaymentStatus, Redelivery } from "@/lib/db/types";

/**
 * إرسال كارت الهدية: زرار واتساب بيفتح الرسالة ويعلّم الكارت «اتبعت» (العميل بيشوفها في صفحة طلبه).
 * ولو اتبعت من الموبايل من صفحة الكارت، فيه زرار يعلّمه بإيدك، وزرار يرجّعه لو اتعلّم بالغلط.
 */
export function GiftCardSendButtons({ id, code, waHref, label, sentAt, sentLabel }: { id: string; code: string; waHref: string; label: string; sentAt: string | null; sentLabel: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const mark = (sent: boolean) =>
    start(async () => {
      await setGiftCardSent(id, code, sent);
      router.refresh();
    });
  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-wrap gap-2">
        <a href={waHref} target="_blank" rel="noreferrer" onClick={() => !sentAt && mark(true)} className="chip border-success bg-success-soft text-success hover:bg-success hover:text-white">
          {label}
        </a>
      </div>
      {sentAt ? (
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-success">
          ✓ {sentLabel}
          <button type="button" disabled={pending} onClick={() => mark(false)} className="text-xs font-normal text-muted underline underline-offset-4 hover:text-brand">
            لسه ماتبعتش؟
          </button>
        </p>
      ) : (
        <button type="button" disabled={pending} onClick={() => mark(true)} className="text-xs text-muted underline underline-offset-4 hover:text-brand">
          {pending ? "لحظة…" : "بعتّيه من الموبايل؟ علّمي إنه اتبعت"}
        </button>
      )}
    </div>
  );
}

export function StatusButtons({ id, status }: { id: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (s: OrderStatus, note?: string) =>
    start(async () => {
      const r = await setOrderStatus(id, s, note);
      setError(r.ok ? null : r.error);
    });
  const next = nextStatus[status] ?? [];
  const canCancel = cancellable.includes(status);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {next.map((s) => (
        <button key={s} disabled={pending} onClick={() => run(s)} className="btn-primary btn-sm">
          ← {statusLabel[s]}
        </button>
      ))}
      {status === "awaiting_payment" && <p className="text-sm text-muted">بيتحرك أول ما الدفع يتأكد.</p>}
      {canCancel && (
        <button
          disabled={pending}
          onClick={() => {
            if (window.confirm("متأكدة إنك عايزة تلغي الأوردر؟ فترات التوصيل هتتفك.")) run("cancelled", "اتلغى من اللوحة");
          }}
          className="btn-outline btn-sm text-brand"
        >
          إلغاء
        </button>
      )}
      {error && <p className="w-full rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
      {status === "delivery_failed" && <p className="w-full text-xs text-muted">سجّلي المحاولة التانية من «محاولة توصيل تانية» تحت: نفس اليوم ببلاش، ويوم تاني برسوم جديدة.</p>}
      {!canCancel && status !== "cancelled" && status !== "delivered" && <p className="w-full text-xs text-muted">التجهيز بدأ، فالطلب مينفعش يتلغي.</p>}
    </div>
  );
}

/**
 * بعد «التوصيل ماتمش»: محاولة تانية في نفس اليوم ببلاش، أو يوم تاني برسوم توصيل جديدة.
 * وتحتها رسوم المحاولات اللي فاتت، ودفعت ولا لسه.
 */
export function RedeliveryPanel({
  id,
  status,
  defaultFee,
  minDate,
  periods,
  redeliveries,
}: {
  id: string;
  status: OrderStatus;
  defaultFee: number;
  minDate: string;
  periods: { id: string; label: string }[];
  redeliveries: Redelivery[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"same_day" | "other_day">("same_day");
  if (status !== "delivery_failed" && redeliveries.length === 0) return null;
  const done = (r: { ok: boolean; error?: string }) => {
    setError(r.ok ? null : (r.error ?? null));
    if (r.ok) router.refresh();
  };
  return (
    <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
      <h2 className="text-xl text-brand">محاولة توصيل تانية</h2>
      {status === "delivery_failed" && (
        <form action={(f) => start(async () => done(await redeliverAction(id, f)))} className="mt-3 space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["same_day", "نفس اليوم (ببلاش)"],
                ["other_day", "يوم تاني (برسوم)"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className={`chip cursor-pointer ${mode === v ? "border-brand bg-brand-soft text-brand" : ""}`}>
                <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
          {mode === "other_day" && (
            <div className="grid gap-2 sm:grid-cols-3">
              <input type="date" name="date" min={minDate} defaultValue={minDate} required className="field tabular" aria-label="اليوم" />
              <select name="period" className="field" aria-label="الفترة" defaultValue={periods[0]?.id}>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <input name="fee" inputMode="numeric" defaultValue={defaultFee} className="field tabular" aria-label="رسوم التوصيل" placeholder="الرسوم" />
            </div>
          )}
          <button disabled={pending} className="btn-primary btn-sm">
            {pending ? "لحظة…" : mode === "same_day" ? "← خرج للتوصيل تاني" : "سجّلي الميعاد الجديد"}
          </button>
          {mode === "other_day" && <p className="text-xs text-muted">الرسوم بتتزود على إجمالي الطلب، والطلب بيرجع «جاهز» لحد اليوم ده.</p>}
        </form>
      )}
      {redeliveries.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {redeliveries.map((r, i) => (
            <li key={r.at} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
              <span className="tabular">{r.date} · رسوم {r.fee.toLocaleString("en-US")} ج.م</span>
              {r.paidAt ? (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">{r.fee ? "اتدفعت" : "ببلاش"}</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => done(await markRedeliveryPaid(id, i)))}
                  className="btn btn-sm bg-success text-white"
                >
                  ✓ العميل دفع
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
    </section>
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
