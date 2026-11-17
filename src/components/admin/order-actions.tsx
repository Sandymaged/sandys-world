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
            لم تُرسَل بعد؟
          </button>
        </p>
      ) : (
        <button type="button" disabled={pending} onClick={() => mark(true)} className="text-xs text-muted underline underline-offset-4 hover:text-brand">
          {pending ? "لحظة…" : "أرسلتها من الهاتف؟ علّمها كمُرسَلة"}
        </button>
      )}
    </div>
  );
}

/**
 * أزرار تغيير الحالة.
 * - من «بانتظار موافقة التصميم» للتجهيز: لازم تعلّم «العميل وافق على التصميم» الأول (وبيتسجل في السجل).
 * - «تم التسليم» قبل يوم التوصيل أو قبل ما براند يسلّم منتجاته: تنبيه واضح وتأكيد صريح.
 * - «خرج للتوصيل» وفيه براند لسه ماسلّمش: تنبيه بس.
 */
export function StatusButtons({
  id,
  status,
  earlyDateLabel = null,
  unhandedBrands = [],
}: {
  id: string;
  status: OrderStatus;
  /** يوم التوصيل (مكتوب) لو لسه ماجاش */
  earlyDateLabel?: string | null;
  /** أسماء البراندات اللي لسه ماضغطتش «سلّمت للمتجر» */
  unhandedBrands?: string[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [designOk, setDesignOk] = useState(false);
  const run = (s: OrderStatus, note?: string, opts?: { designApproved?: boolean; force?: boolean }) =>
    start(async () => {
      const r = await setOrderStatus(id, s, note, opts);
      setError(r.ok ? null : r.error);
    });
  const next = nextStatus[status] ?? [];
  const canCancel = cancellable.includes(status);
  const brandsLine = unhandedBrands.length ? `لم يؤكد التسليم للمتجر بعد: ${unhandedBrands.join("، ")}` : null;
  const earlyLine = earlyDateLabel ? `موعد التوصيل ${earlyDateLabel}، ولم يأتِ بعد` : null;
  const deliverWarnings = [earlyLine, brandsLine].filter((x): x is string => Boolean(x));
  const onClick = (s: OrderStatus) => {
    if (s === "delivered" && deliverWarnings.length) {
      if (window.confirm(`تنبيه قبل «تم التسليم»:\n- ${deliverWarnings.join("\n- ")}\n\nهل سُلِّم الطلب فعلاً للمستلم؟`)) run(s, undefined, { force: true });
      return;
    }
    if (s === "out_for_delivery" && brandsLine) {
      if (window.confirm(`تنبيه: ${brandsLine}.\nهل تريد تعليم الطلب «خرج للتوصيل» على أي حال؟`)) run(s);
      return;
    }
    run(s);
  };
  const showDeliverWarn = next.includes("delivered") && deliverWarnings.length > 0;
  const showOutWarn = next.includes("out_for_delivery") && brandsLine;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {(showDeliverWarn || showOutWarn) && (
        <div className="w-full rounded-xl border border-butter bg-butter-soft p-3 text-sm text-butter">
          <p className="font-semibold">⚠ تنبيه قبل {showDeliverWarn ? "«تم التسليم»" : "«خرج للتوصيل»"}</p>
          <ul className="mt-1 list-inside list-disc">
            {(showDeliverWarn ? deliverWarnings : [brandsLine!]).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {status === "awaiting_design_approval" ? (
        <div className="w-full space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={designOk} onChange={(e) => setDesignOk(e.target.checked)} className="size-4 accent-brand" />
            العميل وافق على التصميم
          </label>
          <button disabled={pending || !designOk} onClick={() => run("preparing", undefined, { designApproved: true })} className="btn-primary btn-sm disabled:opacity-50">
            العميل وافق على التصميم ← ابدأ التجهيز
          </button>
          {!designOk && <p className="text-xs text-muted">أرسل التصميم للعميل أولاً، ولا تبدأ التجهيز إلا بعد موافقته.</p>}
        </div>
      ) : (
        next.map((s) => (
          <button key={s} disabled={pending} onClick={() => onClick(s)} className="btn-primary btn-sm">
            ← {statusLabel[s]}
          </button>
        ))
      )}
      {status === "awaiting_payment" && <p className="text-sm text-muted">ينتقل فور تأكيد الدفع.</p>}
      {canCancel && (
        <button
          disabled={pending}
          onClick={() => {
            if (window.confirm("هل تريد إلغاء الطلب؟ ستُحرَّر فترات التوصيل.")) run("cancelled", "أُلغي من لوحة التحكم");
          }}
          className="btn-outline btn-sm text-brand"
        >
          إلغاء
        </button>
      )}
      {error && <p className="w-full rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
      {status === "delivery_failed" && <p className="w-full text-xs text-muted">سجّل المحاولة الثانية من «محاولة توصيل ثانية» بالأسفل: في اليوم نفسه مجاناً، وفي يوم آخر برسوم جديدة.</p>}
      {!canCancel && status !== "cancelled" && status !== "delivered" && <p className="w-full text-xs text-muted">بدأ التجهيز، فلا يمكن إلغاء الطلب.</p>}
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
      <h2 className="text-xl text-brand">محاولة توصيل ثانية</h2>
      {status === "delivery_failed" && (
        <form action={(f) => start(async () => done(await redeliverAction(id, f)))} className="mt-3 space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["same_day", "نفس اليوم (مجاناً)"],
                ["other_day", "يوم آخر (برسوم)"],
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
            {pending ? "لحظة…" : mode === "same_day" ? "← خرج للتوصيل مرة أخرى" : "تسجيل الموعد الجديد"}
          </button>
          {mode === "other_day" && <p className="text-xs text-muted">تُضاف الرسوم إلى إجمالي الطلب، ويعود الطلب إلى «جاهز» حتى ذلك اليوم.</p>}
        </form>
      )}
      {redeliveries.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {redeliveries.map((r, i) => (
            <li key={r.at} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
              <span className="tabular">{r.date} · رسوم {r.fee.toLocaleString("en-US")} ج.م</span>
              {r.paidAt ? (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">{r.fee ? "مدفوعة" : "مجاناً"}</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => done(await markRedeliveryPaid(id, i)))}
                  className="btn btn-sm bg-success text-white"
                >
                  ✓ دفع العميل
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
            ✓ وصل المبلغ، تأكيد
          </button>
          <button disabled={pending} onClick={() => setRejecting((v) => !v)} className="btn-outline btn-sm text-brand">
            رفض
          </button>
        </div>
      )}
      {rejecting && (
        <form action={(f) => start(() => rejectPayment(id, f).then(() => setRejecting(false)))} className="flex gap-2">
          <input name="reason" className="field h-10" placeholder="السبب: المبلغ ناقص / التحويل غير موجود" />
          <button className="btn btn-sm shrink-0 bg-brand text-white">إرسال</button>
        </form>
      )}
    </div>
  );
}
