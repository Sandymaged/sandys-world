import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, ChecksGroup, Field, ImageField, PackageItemsPicker, Row, Section, Select, TextArea } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { deletePackage, savePackage } from "@/lib/admin-catalog-actions";
import { adminOptions } from "@/lib/admin-options";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "باكدج" };

/** إنشاء باكدج باختيار منتجاته، والنظام بيحسب التكلفة ويقترح سعر ويعرض الهامش (FR-111/112/113) */
export default async function AdminPackage({ params }: PageProps<"/[lang]/admin/catalog/packages/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [d, opts] = await Promise.all([loadCatalogData(), adminOptions()]);
  const pk = id === "new" ? null : d.packages.find((x) => x.id === id);
  if (id !== "new" && !pk) notFound();
  const back = "/admin/catalog/packages";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← الباكدجات</Link>
        <h1 className="text-3xl text-brand">{pk ? pk.name : "باكدج جديد"}</h1>
      </div>
      <CatalogForm action={savePackage.bind(null, pk?.id ?? null)} backTo={back}>
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربي" name="name" defaultValue={pk?.name} required />
            <Field label="الاسم بالإنجليزي" name="nameEn" defaultValue={pk?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربي" name="description" defaultValue={pk?.description} />
            <TextArea label="الوصف بالإنجليزي" name="descriptionEn" defaultValue={pk?.en?.description} dir="ltr" />
          </Row>
          <Row>
            <Select
              label="المستوى"
              name="tier"
              defaultValue={pk?.tier ?? "latif"}
              options={[
                { value: "latif", label: "لطيف" },
                { value: "momayaz", label: "مميز" },
                { value: "fakher", label: "فاخر" },
              ]}
            />
            <Select label="الموسم (بيظهر ويختفي مع الموسم)" name="seasonId" defaultValue={pk?.seasonId ?? ""} options={opts.seasons} />
          </Row>
          <Field label="الرابط (slug)" name="slug" defaultValue={pk?.slug} dir="ltr" hint="لو سبتيه فاضي بيتعمل من الاسم الإنجليزي." />
        </Section>

        <Section title="المحتويات والسعر">
          <PackageItemsPicker
            products={d.products.map((p) => ({ id: p.id, name: p.name, price: p.price, cost: p.cost, available: p.isAvailable }))}
            initial={pk?.items ?? []}
            initialPrice={pk?.price ?? 0}
            minMargin={opts.minPackageMargin}
          />
        </Section>

        <Section title="الصورة">
          <ImageField current={pk?.images[0]} />
        </Section>

        <Section title="مناسب لإيه ولمين">
          <ChecksGroup label="المناسبات" name="occasions" options={opts.occasions} selected={pk?.occasions ?? []} />
          <ChecksGroup label="لمين" name="recipients" options={opts.recipients} selected={pk?.recipients ?? []} />
          <Check label="متاح للبيع" name="isAvailable" defaultChecked={pk?.isAvailable ?? true} />
        </Section>
      </CatalogForm>
      {pk && <DeleteButton action={deletePackage.bind(null, pk.id)} backTo={back} what="الباكدج" />}
    </div>
  );
}
