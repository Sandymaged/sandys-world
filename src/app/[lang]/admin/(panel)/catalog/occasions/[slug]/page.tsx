import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Field, ImageField, Row, Section } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { listOccasions } from "@/lib/store-setup";
import { deleteOccasion, saveOccasion } from "@/lib/store-setup-actions";

export const instant = false;

export const metadata = { title: "مناسبة" };

export default async function AdminOccasion({ params }: PageProps<"/[lang]/admin/catalog/occasions/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const all = await listOccasions();
  const o = slug === "new" ? null : all.find((x) => x.slug === decodeURIComponent(slug));
  if (slug !== "new" && !o) notFound();
  const back = "/admin/catalog/occasions";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← المناسبات</Link>
        <h1 className="text-3xl text-brand">{o ? o.name : "مناسبة جديدة"}</h1>
      </div>
      <CatalogForm action={saveOccasion.bind(null, o?.slug ?? null)} backTo={back}>
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربي" name="name" defaultValue={o?.name} required placeholder="عيد ميلاد" />
            <Field label="الاسم بالإنجليزي" name="nameEn" defaultValue={o?.en?.name} dir="ltr" placeholder="Birthday" />
          </Row>
          <Row>
            {o ? (
              <div>
                <p className="label">الرابط</p>
                <p className="field flex items-center bg-surface text-muted" dir="ltr">/occasions/{o.slug}</p>
                <p className="mt-1 text-xs text-muted">الرابط مش بيتغير بعد ما المناسبة تتعمل.</p>
              </div>
            ) : (
              <Field label="الرابط (slug)" name="slug" dir="ltr" placeholder="birthday" hint="لو سبتيه فاضي بيتعمل من الاسم الإنجليزي." />
            )}
            <Field label="الترتيب" name="sort" type="number" defaultValue={o?.sort ?? all.length + 1} hint="الأصغر بيظهر الأول." />
          </Row>
        </Section>
        <Section title="الصورة">
          <ImageField current={o?.image} />
        </Section>
      </CatalogForm>
      {o && <DeleteButton action={deleteOccasion.bind(null, o.slug)} backTo={back} what="المناسبة" />}
    </div>
  );
}
