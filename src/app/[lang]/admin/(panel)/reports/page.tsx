import Link from "next/link";
import { money } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { expireUnpaid, repo } from "@/lib/db";
import { loadCatalogData } from "@/lib/db/catalog-store";
import { listExpenses, listZonesAdmin, loadFinance } from "@/lib/finance";
import { allStatements } from "@/lib/brand-portal";
import { buildReport, moneyNow, periodRange, periods, type PeriodId, type Ranked } from "@/lib/reports";

export const instant = false;

export const metadata = { title: "التقارير" };

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** رقم كبير ومعاه المقارنة بالفترة اللي قبلها */
function Tile({ label, value, prev, note, tone = "" }: { label: string; value: string; prev?: { now: number; before: number }; note?: string; tone?: string }) {
  const change = prev && prev.before !== 0 ? (prev.now - prev.before) / Math.abs(prev.before) : null;
  return (
    <div className={`rounded-2xl bg-[#fffdf8] p-4 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)] ${tone}`}>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="tabular mt-1 font-heading text-3xl text-ink">{value}</p>
      {change !== null && (
        <p className={`tabular mt-0.5 text-xs font-semibold ${change >= 0 ? "text-success" : "text-brand"}`}>
          {change >= 0 ? "▲" : "▼"} {pct(Math.abs(change))} عن الفترة اللي قبلها
        </p>
      )}
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

/** قايمة مرتبة بشريط لكل صف (لون واحد، والرقم مكتوب جنبه) */
function BarList({ title, rows, format = (n: number) => String(n), empty = "لسه مفيش بيانات." }: { title: string; rows: Ranked[]; format?: (n: number) => string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="rounded-2xl bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
      <h2 className="text-xl text-brand">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} title={`${r.label}: ${format(r.value)}`}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate">{r.label}</span>
                <span className="tabular shrink-0 font-semibold">{format(r.value)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-surface">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const refundNames: Record<string, string> = { refund: "فلوس رجعت للعملاء", compensation: "تعويضات", return: "مرتجعات" };

/** التقارير: المبيعات، والمكسب الحقيقي بعد كل التكاليف، والخسارة والضايع، والعملاء، والمخزون، والبراندات */
export default async function ReportsPage({ searchParams }: PageProps<"/[lang]/admin/reports">) {
  await requireAdmin();
  await expireUnpaid();
  const sp = await searchParams;
  const period = (periods.find((p) => p.id === sp.p)?.id ?? "this-month") as PeriodId;
  const range = periodRange(period);
  const [orders, catalog, finance, expenses, zones, giftCardBalances, statements] = await Promise.all([
    repo().list(),
    loadCatalogData(),
    loadFinance(),
    listExpenses(),
    listZonesAdmin(),
    repo().giftCardBalances(),
    allStatements(),
  ]);
  // فلوس البراندات اللي معاكي: كل نصيبهم من الطلبات اللي اتدفعت (مستحق، أو في مدة الاسترجاع، أو لسه في الشغل) ناقص اللي اتحوّل
  const now = moneyNow({
    orders,
    catalog,
    finance,
    expenses,
    zoneNames: new Map(),
    giftCardBalances,
    brandsOwed: statements.reduce((s, b) => s + Math.max(0, b.s.due + b.s.holding + b.s.pending - b.s.paid), 0),
    brandPayouts: statements.reduce((s, b) => s + b.s.paid, 0),
  });
  const r = buildReport(
    { orders, catalog, finance, expenses, zoneNames: new Map(zones.map((z) => [z.id, z.name])), giftCardBalances },
    range.from,
    range.to,
    range.prevFrom,
    range.prevTo,
  );
  const missingCosts = Object.keys(finance.zoneCosts).length === 0 || finance.packagingCostPerGift === 0;
  const costRows: Ranked[] = [
    { key: "goods", label: "نصيب البراندات وتكلفة المنتجات", value: r.costs.goods },
    { key: "delivery", label: "التوصيل (اللي بتدفعيه)", value: r.costs.delivery },
    { key: "packaging", label: "خامات التغليف", value: r.costs.packaging },
    { key: "fees", label: "عمولة إنستاباي", value: r.costs.fees },
    { key: "refunds", label: "مرتجعات وتعويضات", value: r.costs.refunds },
    { key: "expenses", label: "المصاريف", value: r.costs.expenses },
  ].filter((x) => x.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-3xl text-brand">التقارير</h1>
          <p className="tabular mt-1 text-sm text-muted">
            من {r.from === "2000-01-01" ? "الأول" : r.from} لـ {r.to}
          </p>
        </div>
        <nav className="ms-auto flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <Link key={p.id} href={`/admin/reports?p=${p.id}`} className={`chip ${p.id === period ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand"}`}>
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* فلوسك دلوقتي: من الأول، مش مرتبطة بالفترة اللي فوق */}
      <section className="rounded-2xl bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl text-brand">فلوسك دلوقتي</h2>
          <p className="text-xs text-muted">من أول يوم لحد النهارده</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-bg p-4">
            <p className="text-sm text-ink-2">المفروض يكون معاكي</p>
            <p className={`tabular mt-1 font-heading text-3xl ${now.onHand < 0 ? "text-brand" : "text-ink"}`}>{money(now.onHand)}</p>
            <p className="tabular mt-1 text-xs text-muted">إنستاباي {money(now.instapayIn)} · كاش {money(now.cashIn)} قبل الخصم</p>
          </div>
          <div className="rounded-2xl bg-bg p-4">
            <p className="text-sm text-ink-2">مش بتاعتك (لازم تفضل موجودة)</p>
            <p className="tabular mt-1 font-heading text-3xl text-butter">{money(now.brandsOwed + now.giftCardsOutstanding)}</p>
            <p className="tabular mt-1 text-xs text-muted">للبراندات {money(now.brandsOwed)} · كروت هدايا {money(now.giftCardsOutstanding)}</p>
          </div>
          <div className={`rounded-2xl p-4 ${now.yours < 0 ? "bg-brand-soft" : "bg-success-soft"}`}>
            <p className="text-sm text-ink-2">بتاعتك فعلاً</p>
            <p className={`tabular mt-1 font-heading text-3xl ${now.yours < 0 ? "text-brand" : "text-success"}`}>{money(now.yours)}</p>
            <p className="mt-1 text-xs text-muted">ده اللي تقدري تصرفي منه.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt>دخل إنستاباي (تحويلات اتأكدت)</dt><dd className="tabular font-semibold">{money(now.instapayIn)}</dd></div>
            <div className="flex justify-between"><dt>كاش اتحصّل عند التسليم</dt><dd className="tabular font-semibold">{money(now.cashIn)}</dd></div>
            <div className="flex justify-between text-ink-2"><dt>− عمولة إنستاباي</dt><dd className="tabular">{money(now.fees)}</dd></div>
            <div className="flex justify-between text-ink-2"><dt>− فلوس رجعت وتعويضات</dt><dd className="tabular">{money(now.refunds)}</dd></div>
            <div className="flex justify-between text-ink-2"><dt>− اتحوّل للبراندات</dt><dd className="tabular">{money(now.brandPayouts)}</dd></div>
            <div className="flex justify-between text-ink-2"><dt>− المصاريف المتسجلة</dt><dd className="tabular">{money(now.expenses)}</dd></div>
            <div className="flex justify-between text-ink-2"><dt>− التوصيل والتغليف (من التكاليف)</dt><dd className="tabular">{money(now.deliveryAndPackaging)}</dd></div>
            <div className="flex justify-between border-t border-dashed border-line pt-2 font-semibold"><dt>= المفروض معاكي</dt><dd className="tabular">{money(now.onHand)}</dd></div>
            {now.undelivered > 0 && (
              <p className="pt-1 text-xs leading-5 text-muted">منهم {money(now.undelivered)} فلوس طلبات اتدفعت ولسه ماتسلمتش، ممكن ترجع لو طلب اتلغى.</p>
            )}
          </dl>
          <div className="space-y-4">
            <dl className="space-y-1.5 text-sm">
              <p className="font-semibold">كروت الهدايا</p>
              <div className="flex justify-between"><dt>اتباع</dt><dd className="tabular">{money(now.giftCards.sold)}</dd></div>
              <div className="flex justify-between"><dt>اتصرف منها على هدايا</dt><dd className="tabular">{money(now.giftCards.used)}</dd></div>
              <div className="flex justify-between font-semibold text-butter"><dt>لسه عند الناس (عليكي)</dt><dd className="tabular">{money(now.giftCards.outstanding)}</dd></div>
              <div className="flex justify-between text-success"><dt>مدتها خلصت ومتصرفتش (بقت بتاعتك)</dt><dd className="tabular">{money(now.giftCards.expired)}</dd></div>
            </dl>
            <div className="flex justify-between rounded-xl bg-bg p-3 text-sm">
              <span>الخصومات اللي اديتيها (أكواد خصم)</span>
              <span className="tabular font-semibold">{money(now.discounts)}</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">
          قارني «المفروض معاكي» باللي في إنستاباي والكاش اللي في إيدك. لو فيه فرق يبقى فيه مصروف ماتسجلش، أو تكلفة توصيل مختلفة عن اللي في{" "}
          <Link href="/admin/costs" className="underline underline-offset-4">التكاليف</Link>.
        </p>
      </section>

      <h2 className="pt-2 text-2xl text-brand">المكسب والمبيعات في الفترة</h2>

      {missingCosts && (
        <p className="rounded-2xl bg-[#fff1b8] p-4 text-sm leading-6">
          عشان المكسب يبقى حقيقي، حطي تكلفة التوصيل لكل منطقة وتكلفة التغليف من{" "}
          <Link href="/admin/costs" className="font-semibold underline underline-offset-4">تكاليف التوصيل والتغليف</Link>، وسجلي مصاريفك في{" "}
          <Link href="/admin/expenses" className="font-semibold underline underline-offset-4">المصاريف</Link>.
        </p>
      )}

      {/* أهم الأرقام */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="الفلوس اللي دخلت" value={money(Math.round(r.cashIn))} prev={{ now: r.cashIn, before: r.prevCashIn }} />
        <Tile label="صافي المكسب" value={money(Math.round(r.profit))} prev={{ now: r.profit, before: r.prevProfit }} note={`${pct(r.margin)} من اللي دخل`} tone={r.profit < 0 ? "ring-2 ring-brand" : ""} />
        <Tile label="عدد الطلبات" value={String(r.orders)} prev={{ now: r.orders, before: r.prevOrders }} />
        <Tile label="متوسط الطلب" value={money(Math.round(r.avgOrder))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* الفلوس راحت فين */}
        <section className="rounded-2xl bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          <h2 className="text-xl text-brand">الحساب</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt>الفلوس اللي دخلت</dt><dd className="tabular font-semibold">{money(r.cashIn)}</dd></div>
            {r.giftCardSales > 0 && <div className="flex justify-between text-ink-2"><dt>− كروت هدايا اتباعت (مش مكسب لسه)</dt><dd className="tabular">{money(r.giftCardSales)}</dd></div>}
            {r.paidWithGiftCards > 0 && <div className="flex justify-between text-ink-2"><dt>+ هدايا اتدفعت بكروت هدايا</dt><dd className="tabular">{money(r.paidWithGiftCards)}</dd></div>}
            {costRows.map((c) => (
              <div key={c.key} className="flex justify-between text-ink-2">
                <dt>− {c.label}</dt>
                <dd className="tabular">{money(Math.round(c.value))}</dd>
              </div>
            ))}
            <div className={`flex justify-between border-t border-dashed border-line pt-2 font-heading text-xl ${r.profit < 0 ? "text-brand" : "text-success"}`}>
              <dt>صافي المكسب</dt>
              <dd className="tabular">{money(Math.round(r.profit))}</dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <p className="rounded-xl bg-bg p-2">عمولتك من البراندات<br /><b className="tabular text-sm">{money(Math.round(r.income.commission))}</b></p>
            <p className="rounded-xl bg-bg p-2">التغليف اللي اتدفع<br /><b className="tabular text-sm">{money(r.income.packaging)}</b></p>
            <p className="rounded-xl bg-bg p-2">التوصيل اللي اتدفع<br /><b className="tabular text-sm">{money(r.income.delivery)}</b></p>
          </div>
        </section>

        {/* الخسارة والضايع */}
        <section className="rounded-2xl bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          <h2 className="text-xl text-brand">الخسارة والضايع</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt>طلبات اتلغت</dt><dd className="tabular">{r.losses.cancelledCount} · {money(r.losses.cancelledValue)}</dd></div>
            <div className="flex justify-between text-muted"><dt>منها ما دفعتش في المهلة</dt><dd className="tabular">{r.losses.expiredCount}</dd></div>
            <div className="flex justify-between"><dt>خصومات وكوبونات</dt><dd className="tabular">{money(r.losses.discounts)}</dd></div>
            {Object.entries(r.losses.refundsByKind).map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt>{refundNames[k] ?? k}</dt><dd className="tabular">{money(v)}</dd></div>
            ))}
            <div className="flex justify-between"><dt>اتدفع بكروت هدايا</dt><dd className="tabular">{money(r.paidWithGiftCards)}</dd></div>
            <div className="flex justify-between border-t border-dashed border-line pt-2"><dt>رصيد كروت الهدايا اللي لسه عند الناس</dt><dd className="tabular font-semibold">{money(r.giftCardLiability)}</dd></div>
          </dl>
          {r.losses.cancelReasons.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted">أسباب الإلغاء</p>
              <ul className="mt-1 space-y-1 text-sm">
                {r.losses.cancelReasons.map((c) => (
                  <li key={c.key} className="flex justify-between gap-3"><span className="truncate">{c.label}</span><span className="tabular">{c.value}</span></li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarList title="أكتر المنتجات بيعاً (بالقطعة)" rows={r.topProducts} />
        <BarList title="أكتر الباكدجات والكيتات" rows={r.topPackages} />
        <BarList title="البراندات (قيمة مبيعاتهم)" rows={r.brands} format={(n) => money(Math.round(n))} />
        <BarList title="عرفونا منين" rows={r.sources} empty="لسه محدش جاوب على السؤال." />
        <BarList title="أكتر المناطق طلباً" rows={r.zones} />
        <BarList title="المصاريف حسب النوع" rows={r.expensesByCategory} format={(n) => money(n)} empty="مفيش مصاريف متسجلة في الفترة دي." />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          <h2 className="text-xl text-brand">العملاء</h2>
          <p className="mt-2 text-sm">
            <b className="tabular">{r.customers.total}</b> عميل طلبوا في الفترة دي، منهم <b className="tabular text-success">{r.customers.returning}</b> طلبوا قبل كده
            {r.customers.total > 0 && <span className="text-muted"> ({pct(r.customers.returning / r.customers.total)})</span>}.
          </p>
          {r.customers.topReturning.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {r.customers.topReturning.map((c) => (
                <li key={c.key} className="flex justify-between"><span>{c.label}</span><span className="tabular text-muted">{c.value} طلبات</span></li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          <h2 className="text-xl text-brand">المخزون اللي قرب يخلص</h2>
          {r.lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-muted">مفيش حاجة عددها ٣ أو أقل.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {r.lowStock.map((s) => (
                <li key={s.key} className="flex justify-between gap-3">
                  <span className="truncate">{s.label}</span>
                  <span className={`tabular shrink-0 font-semibold ${s.value === 0 ? "text-brand" : "text-butter"}`}>{s.value === 0 ? "خلص" : `فاضل ${s.value}`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-xs leading-5 text-muted">
        الحساب على الفلوس اللي دخلت فعلاً: الطلب بيتحسب لما الدفع يتأكد أو لو كاش ولسه ما اتلغاش. نصيب البراند = سعر المنتج ناقص عمولتك، والتكلفة بأرقام الكتالوج دلوقتي.
      </p>
    </div>
  );
}
