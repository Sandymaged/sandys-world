import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, Field, ImageField, Row, Section, Select, TextArea } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteKit, saveKit } from "@/lib/admin-catalog-actions";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "كيت" };

/** كيت ثابت بسعر للفرد: كيتات الورش، وبوكسات العروسة والإشبينات */
export default async function AdminKit({ params }: PageProps<"/[lang]/admin/catalog/kits/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const d = await loadCatalogData();
  const k = id === "new" ? null : d.kits.find((x) => x.id === id);
  if (id !== "new" && !k) notFound();
  const back = "/admin/catalog/kits";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← الكيتات</Link>
        <h1 className="text-3xl text-brand">{k ? k.name : "كيت جديد"}</h1>
      </div>
      <CatalogForm action={saveKit.bind(null, k?.id ?? null)} backTo={back}>
        <Section title="النوع">
          <Row>
            <Select
              label="القسم"
              name="category"
              defaultValue={k?.category ?? "workshop"}
              options={[
                { value: "workshop", label: "ورشة مع الصحاب" },
                { value: "bridal", label: "العروسة والإشبينات" },
              ]}
            />
            <Select
              label="لمين (للعروسة بس)"
              name="role"
              defaultValue={k?.role ?? ""}
              options={[
                { value: "", label: "—" },
                { value: "bride", label: "العروسة" },
                { value: "bridesmaid", label: "الإشبينات" },
                { value: "mother", label: "أم العروسة" },
                { value: "flower-girl", label: "الفلاور جيرل" },
              ]}
            />
          </Row>
        </Section>

        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربي" name="name" defaultValue={k?.name} required />
            <Field label="الاسم بالإنجليزي" name="nameEn" defaultValue={k?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <Field label="جملة قصيرة بالعربي" name="tagline" defaultValue={k?.tagline} placeholder="كل واحدة ترسم فرشتها على ذوقها" />
            <Field label="جملة قصيرة بالإنجليزي" name="taglineEn" defaultValue={k?.en?.tagline} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربي" name="description" defaultValue={k?.description} />
            <TextArea label="الوصف بالإنجليزي" name="descriptionEn" defaultValue={k?.en?.description} dir="ltr" />
          </Row>
          <Field label="الرابط (slug)" name="slug" defaultValue={k?.slug} dir="ltr" hint="لو سبتيه فاضي بيتعمل من الاسم الإنجليزي." />
        </Section>

        <Section title="السعر والعدد">
          <Row>
            <Field label="سعر الفرد (ج.م)" name="pricePerPerson" type="number" defaultValue={k?.pricePerPerson} required />
            <Field label="مدة التجهيز (أيام)" name="prepDays" type="number" defaultValue={k?.prepDays ?? 3} />
          </Row>
          <Row>
            <Field label="أقل عدد" name="minPeople" type="number" defaultValue={k?.minPeople ?? 3} hint="لبوكس شخص واحد (زي بوكس العروسة) خلي الأقل والأكبر 1" />
            <Field label="أكبر عدد" name="maxPeople" type="number" defaultValue={k?.maxPeople ?? 25} />
          </Row>
          <Row>
            <Field label="مدة الورشة بالعربي" name="duration" defaultValue={k?.duration} placeholder="ساعة تقريباً" />
            <Field label="مدة الورشة بالإنجليزي" name="durationEn" defaultValue={k?.en?.duration} dir="ltr" />
          </Row>
        </Section>

        <Section title="المحتويات (كل حاجة في سطر)">
          <Row>
            <TextArea label="بالعربي" name="contents" rows={7} defaultValue={k?.contents.join("\n")} />
            <TextArea label="بالإنجليزي" name="contentsEn" rows={7} dir="ltr" defaultValue={k?.en?.contents?.join("\n")} />
          </Row>
        </Section>

        <Section title="الصورة">
          <ImageField current={k?.images[0]} />
          <Check label="متاح للبيع" name="isAvailable" defaultChecked={k?.isAvailable ?? true} />
        </Section>
      </CatalogForm>
      {k && <DeleteButton action={deleteKit.bind(null, k.id)} backTo={back} what="الكيت" />}
    </div>
  );
}
