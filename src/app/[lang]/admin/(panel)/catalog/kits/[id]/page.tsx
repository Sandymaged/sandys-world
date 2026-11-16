import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, Field, ImageField, Row, Section, Select, TextArea } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteKit, saveKit } from "@/lib/admin-catalog-actions";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "طقم" };

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
        <Link href={back} className="text-sm text-muted hover:text-brand">← الأطقم</Link>
        <h1 className="text-3xl text-brand">{k ? k.name : "طقم جديد"}</h1>
      </div>
      <CatalogForm action={saveKit.bind(null, k?.id ?? null)} backTo={back}>
        <Section title="النوع">
          <Row>
            <Select
              label="القسم"
              name="category"
              defaultValue={k?.category ?? "workshop"}
              options={[
                { value: "workshop", label: "ورشة مع الأصدقاء" },
                { value: "bridal", label: "العروس ووصيفاتها" },
              ]}
            />
            <Select
              label="لمن (للعروس فقط)"
              name="role"
              defaultValue={k?.role ?? ""}
              options={[
                { value: "", label: "—" },
                { value: "bride", label: "العروس" },
                { value: "bridesmaid", label: "الوصيفات" },
                { value: "mother", label: "أم العروس" },
                { value: "flower-girl", label: "حاملة الورد" },
              ]}
            />
          </Row>
        </Section>

        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربية" name="name" defaultValue={k?.name} required />
            <Field label="الاسم بالإنجليزية" name="nameEn" defaultValue={k?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <Field label="جملة قصيرة بالعربية" name="tagline" defaultValue={k?.tagline} placeholder="كل واحدة ترسم فرشاتها على ذوقها" />
            <Field label="جملة قصيرة بالإنجليزية" name="taglineEn" defaultValue={k?.en?.tagline} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربية" name="description" defaultValue={k?.description} />
            <TextArea label="الوصف بالإنجليزية" name="descriptionEn" defaultValue={k?.en?.description} dir="ltr" />
          </Row>
          <Field label="الرابط (slug)" name="slug" defaultValue={k?.slug} dir="ltr" hint="إن تركته فارغاً يُنشأ من الاسم الإنجليزي." />
        </Section>

        <Section title="السعر والعدد">
          <Row>
            <Field label="سعر الفرد (ج.م)" name="pricePerPerson" type="number" defaultValue={k?.pricePerPerson} required />
            <Field label="مدة التجهيز (أيام)" name="prepDays" type="number" defaultValue={k?.prepDays ?? 3} />
          </Row>
          <Row>
            <Field label="أقل عدد" name="minPeople" type="number" defaultValue={k?.minPeople ?? 3} hint="لصندوق شخص واحد (مثل صندوق العروس) اجعل الأقل والأكبر 1" />
            <Field label="أكبر عدد" name="maxPeople" type="number" defaultValue={k?.maxPeople ?? 25} />
          </Row>
          <Row>
            <Field label="مدة الورشة بالعربية" name="duration" defaultValue={k?.duration} placeholder="ساعة تقريباً" />
            <Field label="مدة الورشة بالإنجليزية" name="durationEn" defaultValue={k?.en?.duration} dir="ltr" />
          </Row>
        </Section>

        <Section title="المحتويات (كل عنصر في سطر)">
          <Row>
            <TextArea label="بالعربية" name="contents" rows={7} defaultValue={k?.contents.join("\n")} />
            <TextArea label="بالإنجليزية" name="contentsEn" rows={7} dir="ltr" defaultValue={k?.en?.contents?.join("\n")} />
          </Row>
        </Section>

        <Section title="الصورة">
          <ImageField current={k?.images[0]} />
          <Check label="متاح للبيع" name="isAvailable" defaultChecked={k?.isAvailable ?? true} />
        </Section>
      </CatalogForm>
      {k && <DeleteButton action={deleteKit.bind(null, k.id)} backTo={back} what="الطقم" />}
    </div>
  );
}
