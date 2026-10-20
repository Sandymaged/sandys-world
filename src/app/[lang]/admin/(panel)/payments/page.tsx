import Link from "next/link";
import { PaymentPanel } from "@/components/admin/order-actions";
import { Empty, money } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { expireUnpaid, repo } from "@/lib/db";

export const instant = false;

export const metadata = { title: "مدفوعات مستنية تأكيد" };

/** شاشة "مدفوعات مستنية تأكيد" (FR-105): صورة التحويل والرقم المرجعي والمبلغ، وتأكيد أو رفض */
export default async function AdminPayments() {
  await requireAdmin();
  await expireUnpaid();
  const all = await repo().list({ status: "awaiting_payment" });
  const waiting = all.filter((o) => o.paymentStatus === "awaiting_confirmation");
  const noProof = all.filter((o) => o.paymentStatus !== "awaiting_confirmation");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl text-brand">مستنية تأكيدك</h1>
        <p className="mb-4 text-sm text-ink-2">افتحي حساب إنستاباي واتأكدي إن المبلغ والرقم المرجعي وصلوا، وبعدين أكّدي.</p>
        {waiting.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {waiting.map((o) => (
              <div key={o.id} className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
                <div className="flex items-baseline justify-between">
                  <Link href={`/admin/orders/${o.id}`} className="tabular font-heading text-2xl text-brand hover:underline">#{o.number}</Link>
                  <span className="text-sm text-muted">{o.sender.name}</span>
                </div>
                <PaymentPanel id={o.id} status={o.paymentStatus} reference={o.transferReference} proofUrl={o.proofFile ? `/admin/files/${o.proofFile}` : null} total={o.totals.total} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>مفيش تحويلات مستنية تأكيد.</Empty>
        )}
      </section>

      {noProof.length > 0 && (
        <section>
          <h2 className="text-2xl text-brand">لسه مرفعوش إثبات</h2>
          <p className="mb-3 text-sm text-ink-2">بيتلغوا لوحدهم لو المهلة خلصت.</p>
          <ul className="divide-y divide-dashed divide-line bg-[#fffdf8] shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
            {noProof.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <Link href={`/admin/orders/${o.id}`} className="tabular font-semibold text-brand">#{o.number}</Link>
                <span>{o.sender.name}</span>
                <span className="tabular">{money(o.totals.total)}</span>
                {o.paymentStatus === "rejected" && <span className="text-brand">اترفض: {o.paymentRejectionReason}</span>}
                {o.paymentDueAt && (
                  <span className="ms-auto text-xs text-muted">
                    آخر ميعاد: {new Intl.DateTimeFormat("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short", timeZone: "Africa/Cairo" }).format(new Date(o.paymentDueAt))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
