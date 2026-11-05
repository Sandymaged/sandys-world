import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Field, ImageField, Row, Section, Select } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { cairoDay, listOccasions, listSeasons } from "@/lib/store-setup";
import { deleteSeason, saveSeason } from "@/lib/store-setup-actions";

export const instant = false;

export const metadata = { title: "موسم" };

export default async function AdminSeason({ params }: PageProps<"/[lang]/admin/catalog/seasons/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [seasons, occasions] = await Promise.all([listSeasons(), listOccasions()]);
  const s = id === "new" ? null : seasons.find((x) => x.id === id);
  if (id !== "new" && !s) notFound();
  const back = "/admin/catalog/seasons";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← المواسم</Link>
        <h1 className="text-3xl text-brand">{s ? s.name : "موسم جديد"}</h1>
      </div>
      <CatalogForm action={saveSeason.bind(null, s?.id ?? null)} backTo={back}>
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربي" name="name" defaultValue={s?.name} required placeholder="رمضان والعيد" />
            <Field label="الاسم بالإنجليزي" name="nameEn" defaultValue={s?.en?.name} dir="ltr" placeholder="Ramadan & Eid" />
          </Row>
          <Select
            label="المناسبة"
            name="occasionSlug"
            defaultValue={s?.occasionSlug}
            options={[{ value: "", label: "من غير مناسبة" }, ...occasions.map((o) => ({ value: o.slug, label: o.name }))]}
          />
        </Section>

        <Section title="المواعيد">
          <p className="-mt-2 text-sm text-muted">المواعيد كلها بتوقيت مصر. آخر ميعاد للطلب بيتقفل الساعة 9 بالليل في اليوم اللي تختاريه.</p>
          <Row>
            <Field label="يوم المناسبة" name="occasionDate" type="date" defaultValue={s?.occasionDate} required />
            <Field label="بيبدأ يظهر في الموقع من" name="visibleFrom" type="date" defaultValue={cairoDay(s?.visibleFrom)} required />
          </Row>
          <Row>
            <Field label="آخر ميعاد للهدايا المخصصة (بالاسم)" name="customDeadline" type="date" defaultValue={cairoDay(s?.customDeadline)} required />
            <Field label="آخر ميعاد للهدايا الجاهزة" name="readyDeadline" type="date" defaultValue={cairoDay(s?.readyDeadline)} required />
          </Row>
          <Field label="بيختفي من الموقع بعد" name="visibleUntil" type="date" defaultValue={cairoDay(s?.visibleUntil)} hint="لو سبتيه فاضي بيختفي بعد يوم المناسبة." />
        </Section>

        <Section title="البانر على الصفحة الرئيسية">
          <Row>
            <Field label="العنوان بالعربي" name="bannerTitle" defaultValue={s?.bannerTitle} placeholder="هدايا رمضان" />
            <Field label="العنوان بالإنجليزي" name="bannerTitleEn" defaultValue={s?.en?.bannerTitle} dir="ltr" />
          </Row>
          <Row>
            <Field label="جملة تحته بالعربي" name="bannerSubtitle" defaultValue={s?.bannerSubtitle} />
            <Field label="جملة تحته بالإنجليزي" name="bannerSubtitleEn" defaultValue={s?.en?.bannerSubtitle} dir="ltr" />
          </Row>
          <ImageField current={s?.bannerImage} />
        </Section>
      </CatalogForm>
      {s && <DeleteButton action={deleteSeason.bind(null, s.id)} backTo={back} what="الموسم" confirmText="متأكدة؟ الباكدجات اللي عليه هترجع باكدجات عادية." />}
    </div>
  );
}
