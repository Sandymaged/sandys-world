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
            <Field label="الاسم بالعربية" name="name" defaultValue={s?.name} required placeholder="رمضان والعيد" />
            <Field label="الاسم بالإنجليزية" name="nameEn" defaultValue={s?.en?.name} dir="ltr" placeholder="Ramadan & Eid" />
          </Row>
          <Select
            label="المناسبة"
            name="occasionSlug"
            defaultValue={s?.occasionSlug}
            options={[{ value: "", label: "بدون مناسبة" }, ...occasions.map((o) => ({ value: o.slug, label: o.name }))]}
          />
        </Section>

        <Section title="المواعيد">
          <p className="-mt-2 text-sm text-muted">كل المواعيد بتوقيت مصر. يُغلق آخر موعد للطلب الساعة 9 مساءً في اليوم الذي تختاره.</p>
          <Row>
            <Field label="يوم المناسبة" name="occasionDate" type="date" defaultValue={s?.occasionDate} required />
            <Field label="يبدأ ظهوره في الموقع من" name="visibleFrom" type="date" defaultValue={cairoDay(s?.visibleFrom)} required />
          </Row>
          <Row>
            <Field label="آخر موعد للهدايا المخصصة (بالاسم)" name="customDeadline" type="date" defaultValue={cairoDay(s?.customDeadline)} required />
            <Field label="آخر موعد للهدايا الجاهزة" name="readyDeadline" type="date" defaultValue={cairoDay(s?.readyDeadline)} required />
          </Row>
          <Field label="يختفي من الموقع بعد" name="visibleUntil" type="date" defaultValue={cairoDay(s?.visibleUntil)} hint="إن تركته فارغاً يختفي بعد يوم المناسبة." />
        </Section>

        <Section title="البانر على الصفحة الرئيسية">
          <Row>
            <Field label="العنوان بالعربية" name="bannerTitle" defaultValue={s?.bannerTitle} placeholder="هدايا رمضان" />
            <Field label="العنوان بالإنجليزية" name="bannerTitleEn" defaultValue={s?.en?.bannerTitle} dir="ltr" />
          </Row>
          <Row>
            <Field label="جملة أسفله بالعربية" name="bannerSubtitle" defaultValue={s?.bannerSubtitle} />
            <Field label="جملة أسفله بالإنجليزية" name="bannerSubtitleEn" defaultValue={s?.en?.bannerSubtitle} dir="ltr" />
          </Row>
          <ImageField current={s?.bannerImage} />
        </Section>
      </CatalogForm>
      {s && <DeleteButton action={deleteSeason.bind(null, s.id)} backTo={back} what="الموسم" confirmText="هل أنت متأكد؟ ستعود الباقات المرتبطة به باقات عادية." />}
    </div>
  );
}
