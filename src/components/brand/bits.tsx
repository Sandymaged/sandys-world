import type { BrandOrder, MonthProgress } from "@/lib/brand-portal";
import { statusLabel, statusTone } from "@/lib/admin-format";
import { money } from "../admin/ui";
import { OrderActions } from "./portal-ui";

/* قطع صغيرة بتتكرر في صفحات البوابة */

export const periodName = { morning: "الصبح", afternoon: "الضهر", evening: "بالليل" } as const;

export const shortDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Cairo" });

export function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-paper p-5 shadow-[0_14px_28px_-22px_rgb(90_20_35/0.4)] ${className}`}>{children}</section>;
}

export function Stat({ label, value, hint, tone = "bg-paper" }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className={`rounded-3xl border border-line p-4 ${tone}`}>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="tabular mt-1 font-heading text-3xl text-brand">{value}</p>
      {hint && <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

/** طلب واحد زي ما البراند بيشوفه: منتجاته بس، وميعاد التوصيل، والزراير */
export function BrandOrderCard({ o }: { o: BrandOrder }) {
  return (
    <Box className={o.open ? "" : "opacity-75"}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="tabular font-heading text-2xl text-brand">#{o.number}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[o.status]}`}>{statusLabel[o.status]}</span>
        {o.open && o.handedAt && <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">سلّمته للمتجر</span>}
        {o.late && <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">متأخر في التسليم</span>}
        <span className="ms-auto text-sm text-ink-2">
          التوصيل للعميل: <b>{shortDate(o.deliveryDate)}</b> · {periodName[o.deliveryPeriod]}
        </span>
      </div>
      {o.open && !o.handedAt && o.handBy && (o.status === "preparing" || o.status === "ready") && (
        <p className={`mt-2 rounded-lg px-3 py-1.5 text-sm ${o.late ? "bg-brand-soft text-brand-dark" : "bg-butter-soft text-butter"}`}>
          {o.late ? (
            <>كان المفروض يتسلّم للمتجر يوم <b>{shortDate(o.handBy)}</b>. سلّمه في أسرع وقت وكلّم المتجر.</>
          ) : o.handBy === o.deliveryDate ? (
            <>سلّمه للمتجر يوم <b>{shortDate(o.handBy)}</b> الصبح بدري (يوم التوصيل).</>
          ) : (
            <>سلّمه للمتجر لحد يوم <b>{shortDate(o.handBy)}</b> (قبل التوصيل بيوم).</>
          )}
        </p>
      )}

      <ul className="mt-4 divide-y divide-dashed divide-line">
        {o.lines.map((l, i) => (
          <li key={`${l.productId}-${i}`} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-2.5">
            <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-blush text-sm font-semibold text-brand">{l.quantity}×</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{l.name}</span>
              {l.optionsText && <span className="block text-sm text-ink-2">{l.optionsText}</span>}
              {l.customization && (
                <span className="mt-1 block rounded-lg bg-butter-soft px-2 py-1 text-sm text-butter">
                  يتكتب عليه: <b dir="auto">{l.customization}</b>
                </span>
              )}
              <span className="block text-xs text-muted">ضمن: {l.giftTitle}</span>
            </span>
            <span className="tabular text-end text-sm">
              {money(l.net)}
              <span className="block text-xs text-muted">من {money(l.gross)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
        {o.open ? <OrderActions orderId={o.id} handed={Boolean(o.handedAt)} /> : <span />}
        <p className="text-sm text-ink-2">
          نصيبك{o.estimated && " (تقريباً)"}: <b className="tabular text-brand">{money(o.net)}</b>
        </p>
      </div>
    </Box>
  );
}

const pct = (r: number) => `${Math.round(r * 100)}%`;

/** سطر قصير: البراند فين من حد الشهر وشرايح العمولة */
export function tierLine(p: MonthProgress) {
  if (p.freeLeft > 0) return `الشهر ده باع ${money(p.sales)} من ${money(p.threshold)} ببلاش (فاضل ${money(p.freeLeft)} من غير عمولة)`;
  return `الشهر ده باع ${money(p.sales)} · عمولة ${pct(p.rate)} على الجزء ده${p.nextAt ? ` لحد ${money(p.nextAt)}، وبعدها ${pct(p.nextRate ?? 0)}` : ""}`;
}

/** كارت الشهر: الحد اللي ببلاش، والشرايح، والبراند فين منها */
export function MonthTierCard({ p }: { p: MonthProgress }) {
  const t = p.threshold;
  const tiers = [
    { label: `لحد ${money(t)}`, rate: "0%" },
    { label: `من ${money(t)} لـ ${money(2 * t)}`, rate: "10%" },
    { label: `من ${money(2 * t)} لـ ${money(4 * t)}`, rate: "15%" },
    { label: `فوق ${money(4 * t)}`, rate: "20%" },
  ];
  const fill = t > 0 ? Math.min(100, (p.sales / (4 * t)) * 100) : 0;
  return (
    <Box>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-xl text-ink">عمولة الشهر ده</h2>
        <span className="text-sm text-muted">بتبدأ من الأول كل شهر</span>
      </div>
      <p className="mt-1 text-sm leading-6 text-ink-2">{tierLine(p)}.</p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface" aria-hidden>
        <div className="h-full rounded-full bg-brand" style={{ width: `${fill}%` }} />
      </div>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
        {tiers.map((x) => (
          <li key={x.label} className="rounded-xl bg-bg px-3 py-2">
            <span className="block font-semibold text-brand">{x.rate}</span>
            <span className="text-xs text-ink-2">{x.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-muted">
        الحد = متوسط سعر منتجاتك × 20 (يعني حوالي أول 20 قطعة في الشهر من غير عمولة). كل نسبة بتتحسب على الجزء اللي جوه شريحتها بس، والعمولة بتتثبت لما الطلب يتسلم للعميل.
      </p>
    </Box>
  );
}
