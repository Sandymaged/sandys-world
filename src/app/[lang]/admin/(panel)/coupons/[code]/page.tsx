import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, Field, Row, Section, Select } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { cairoDay, listCoupons } from "@/lib/store-setup";
import { deleteCoupon, saveCoupon } from "@/lib/store-setup-actions";

export const instant = false;

export const metadata = { title: "كود خصم" };

export default async function AdminCoupon({ params }: PageProps<"/[lang]/admin/coupons/[code]">) {
  await requireAdmin();
  const { code } = await params;
  const c = code === "new" ? null : (await listCoupons()).find((x) => x.code === decodeURIComponent(code));
  if (code !== "new" && !c) notFound();
  const back = "/admin/coupons";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← أكواد الخصم</Link>
        <h1 className="text-3xl text-brand" dir={c ? "ltr" : undefined}>{c ? c.code : "كود جديد"}</h1>
      </div>
      <CatalogForm action={saveCoupon.bind(null, c?.code ?? null)} backTo={back}>
        <Section title="الكود">
          {!c && <Field label="الكود" name="code" dir="ltr" required placeholder="EID20" hint="حروف إنجليزي وأرقام بس، من 3 لـ 20. العميل بيكتبه في صفحة الدفع." />}
          <Row>
            <Select
              label="نوع الخصم"
              name="kind"
              defaultValue={c?.kind ?? "percent"}
              options={[
                { value: "percent", label: "نسبة ٪" },
                { value: "amount", label: "مبلغ ثابت (ج.م)" },
              ]}
            />
            <Field label="القيمة" name="value" type="number" defaultValue={c?.value ?? ""} required placeholder="10" />
          </Row>
          <Row>
            <Field label="أقل طلب يتطبق عليه (ج.م)" name="minOrder" type="number" defaultValue={c?.minOrder || ""} placeholder="0" hint="فاضي = أي طلب." />
            <Field label="آخر يوم للكود" name="expiresAt" type="date" defaultValue={cairoDay(c?.expiresAt)} hint="فاضي = مالوش آخر." />
          </Row>
          <Field
            label="أقصى عدد مرات استخدام"
            name="maxUses"
            type="number"
            defaultValue={c?.maxUses ?? ""}
            hint={c ? `اتستخدم ${c.used} مرة لحد دلوقتي. فاضي = من غير حد.` : "فاضي = من غير حد."}
          />
          <Check label="الكود شغال" name="isActive" defaultChecked={c?.isActive ?? true} />
        </Section>
      </CatalogForm>
      {c && <DeleteButton action={deleteCoupon.bind(null, c.code)} backTo={back} what="الكود" />}
    </div>
  );
}
