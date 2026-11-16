import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, Field, Row, Section, Select } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { listZones } from "@/lib/store-setup";
import { deleteZone, saveZone } from "@/lib/store-setup-actions";

export const instant = false;

export const metadata = { title: "منطقة توصيل" };

export default async function AdminZone({ params }: PageProps<"/[lang]/admin/zones/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const zones = await listZones();
  const z = id === "new" ? null : zones.find((x) => x.id === id);
  if (id !== "new" && !z) notFound();
  const back = "/admin/zones";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← المناطق</Link>
        <h1 className="text-3xl text-brand">{z ? z.name : "منطقة جديدة"}</h1>
      </div>
      <CatalogForm action={saveZone.bind(null, z?.id ?? null)} backTo={back}>
        <Section title="المنطقة">
          <Row>
            <Field label="الاسم بالعربية" name="name" defaultValue={z?.name} required placeholder="أسيوط الجديدة" />
            <Field label="الاسم بالإنجليزية" name="nameEn" defaultValue={z?.en?.name} dir="ltr" placeholder="New Assiut" />
          </Row>
          <Row>
            <Select
              label="النوع"
              name="kind"
              defaultValue={z?.kind ?? "city"}
              options={[
                { value: "city", label: "مدينة أسيوط" },
                { value: "markaz", label: "مركز في أسيوط" },
                { value: "governorate", label: "محافظة أخرى (شركة شحن)" },
              ]}
            />
            <Field label="رسوم التوصيل التي يدفعها العميل (ج.م)" name="fee" type="number" defaultValue={z?.fee ?? ""} required />
          </Row>
          <Row>
            <Field label="أيام إضافية للتوصيل" name="extraDays" type="number" defaultValue={z?.extraDays ?? 0} hint="للمحافظات الأخرى: يتأخر أقرب يوم توصيل بهذا العدد." />
            <Field label="الترتيب" name="sort" type="number" defaultValue={z?.sort ?? zones.length + 1} hint="الأصغر يظهر أولاً في القائمة." />
          </Row>
          <div className="flex flex-wrap gap-6">
            <Check label="التوصيل في اليوم نفسه متاح" name="sameDay" defaultChecked={z?.sameDay ?? false} />
            <Check label="مفعّلة (تظهر للعميل)" name="isActive" defaultChecked={z?.isActive ?? true} />
          </div>
        </Section>
      </CatalogForm>
      {z && <DeleteButton action={deleteZone.bind(null, z.id)} backTo={back} what="المنطقة" />}
    </div>
  );
}
