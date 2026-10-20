import Link from "next/link";
import { ActionForm, ConfirmButton } from "@/components/admin/action-form";
import { Field, Row, Section } from "@/components/admin/form";
import { Empty, money } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { cairoNow } from "@/lib/delivery";
import { expenseCategories, listExpenses } from "@/lib/finance";
import { addExpenseAction, deleteExpenseAction } from "@/lib/finance-actions";

export const instant = false;

export const metadata = { title: "المصاريف" };

const monthName = (ym: string) =>
  new Intl.DateTimeFormat("ar-EG-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

const shiftMonth = (ym: string, by: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** المصاريف بالشهر: تضيفي أي مصروف (إعلانات، إيجار، رواتب…) وبيتخصم من المكسب في التقارير */
export default async function ExpensesPage({ searchParams }: PageProps<"/[lang]/admin/expenses">) {
  await requireAdmin();
  const sp = await searchParams;
  const today = cairoNow().date;
  const month = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : today.slice(0, 7);
  const list = await listExpenses(`${month}-01`, `${month}-31`);
  const total = list.reduce((s, e) => s + e.amount, 0);
  const byCategory = Object.entries(
    list.reduce<Record<string, number>>((acc, e) => ((acc[e.category] = (acc[e.category] ?? 0) + e.amount), acc), {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-brand">المصاريف</h1>
        <p className="mt-1 text-sm text-muted">أي فلوس بتطلع على المتجر غير المنتجات. بتتخصم من المكسب في التقارير.</p>
      </div>

      <Section title="مصروف جديد">
        <ActionForm action={addExpenseAction} submitLabel="ضيفي المصروف" doneLabel="اتضاف ✓" resetOnSuccess>
          <Row>
            <Field label="المبلغ (ج.م)" name="amount" type="number" required />
            <Field label="التاريخ" name="spentOn" type="date" defaultValue={today} />
          </Row>
          <Row>
            <div>
              <label className="label" htmlFor="category">النوع</label>
              <input id="category" name="category" list="expense-categories" className="field" placeholder="إعلانات" />
              <datalist id="expense-categories">
                {expenseCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <Field label="ملاحظة (اختياري)" name="note" placeholder="إعلان إنستجرام لعيد الأم" />
          </Row>
        </ActionForm>
      </Section>

      <section className="space-y-4 bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/admin/expenses?m=${shiftMonth(month, -1)}`} className="btn-outline btn-sm">← الشهر اللي فات</Link>
          <h2 className="text-xl text-brand">{monthName(month)}</h2>
          {month < today.slice(0, 7) && (
            <Link href={`/admin/expenses?m=${shiftMonth(month, 1)}`} className="btn-outline btn-sm">الشهر اللي بعده →</Link>
          )}
          <p className="ms-auto font-heading text-2xl text-brand">
            <span className="tabular">{money(total)}</span>
          </p>
        </div>

        {byCategory.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {byCategory.map(([c, v]) => (
              <span key={c} className="chip border-line bg-bg text-ink-2">
                {c}: <b className="tabular ms-1">{money(v)}</b>
              </span>
            ))}
          </div>
        )}

        {list.length === 0 ? (
          <Empty>مفيش مصاريف متسجلة في الشهر ده.</Empty>
        ) : (
          <ul className="divide-y divide-dashed divide-line">
            {list.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <span className="tabular w-24 text-sm text-muted">{e.spentOn}</span>
                <span className="chip border-line bg-bg text-ink-2">{e.category}</span>
                <span className="min-w-0 flex-1 text-sm">{e.note}</span>
                <span className="tabular font-semibold">{money(e.amount)}</span>
                <ConfirmButton action={deleteExpenseAction.bind(null, e.id)} confirm="تمسحي المصروف ده؟" label="مسح" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
