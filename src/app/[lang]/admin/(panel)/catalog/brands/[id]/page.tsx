import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogForm, Field, ImageField, Row, Section, TextArea } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { saveBrand } from "@/lib/admin-catalog-actions";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "براند" };

export default async function AdminBrand({ params }: PageProps<"/[lang]/admin/catalog/brands/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const d = await loadCatalogData();
  const b = id === "new" ? null : d.partners.find((x) => x.id === id);
  if (id !== "new" && !b) notFound();
  const back = "/admin/catalog/brands";
  const products = b ? d.products.filter((p) => p.partnerId === b.id) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← البراندات</Link>
        <h1 className="text-3xl text-brand">{b ? b.name : "براند جديد"}</h1>
      </div>
      <CatalogForm action={saveBrand.bind(null, b?.id ?? null)} backTo={back}>
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربي" name="name" defaultValue={b?.name} required />
            <Field label="الاسم بالإنجليزي" name="nameEn" defaultValue={b?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <Field label="جملة قصيرة بالعربي" name="tagline" defaultValue={b?.tagline} placeholder="جلد وكروشيه بإيدين بنات أسيوط" />
            <Field label="جملة قصيرة بالإنجليزي" name="taglineEn" defaultValue={b?.en?.tagline} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="القصة بالعربي" name="story" rows={4} defaultValue={b?.story} />
            <TextArea label="القصة بالإنجليزي" name="storyEn" rows={4} dir="ltr" defaultValue={b?.en?.story} />
          </Row>
          <Row>
            <Field label="المدينة بالعربي" name="city" defaultValue={b?.city} placeholder="أسيوط" />
            <Field label="المدينة بالإنجليزي" name="cityEn" defaultValue={b?.en?.city} dir="ltr" />
          </Row>
          <Row>
            <Field label="إنستجرام" name="instagram" defaultValue={b?.instagram} dir="ltr" placeholder="brand.name" />
            <Field label="نسبة العمولة %" name="commission" type="number" defaultValue={b ? Math.round(b.commissionRate * 100) : 20} hint="مش بتظهر للعميل" />
          </Row>
          <Field label="الرابط (slug)" name="slug" defaultValue={b?.slug} dir="ltr" hint="لو سبتيه فاضي بيتعمل من الاسم الإنجليزي." />
        </Section>
        <Section title="صورة البراند">
          <ImageField current={b?.cover} />
        </Section>
      </CatalogForm>

      {b && (
        <section className="bg-[#fffdf8] p-5 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)]">
          <h2 className="text-xl text-brand">منتجاتهم ({products.length})</h2>
          <p className="mt-1 text-sm text-muted">عشان تضيفي منتج للبراند ده، اختاريه من خانة &quot;البراند&quot; في صفحة المنتج.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/catalog/products/${p.id}`} className="chip border-line bg-white text-ink-2 hover:border-brand">{p.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
