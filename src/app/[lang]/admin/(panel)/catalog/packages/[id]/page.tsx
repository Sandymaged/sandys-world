import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, ChecksGroup, Field, ImageField, PackageItemsPicker, Row, Section, Select, TextArea } from "@/components/admin/form";
import { requireAdmin } from "@/lib/admin-auth";
import { deletePackage, savePackage } from "@/lib/admin-catalog-actions";
import { adminOptions } from "@/lib/admin-options";
import { costOf, loadCatalogData } from "@/lib/db/catalog-store";
import { loadStoreConfig } from "@/lib/store-config";

export const instant = false;

export const metadata = { title: "باقة" };

/** إنشاء باكدج باختيار منتجاته، والنظام بيحسب التكلفة ويقترح سعر ويعرض الهامش (FR-111/112/113) */
export default async function AdminPackage({ params }: PageProps<"/[lang]/admin/catalog/packages/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [d, opts, config] = await Promise.all([loadCatalogData(), adminOptions(), loadStoreConfig()]);
  const boxes = config.boxSizes.filter((b) => b.isActive !== false);
  const pk = id === "new" ? null : d.packages.find((x) => x.id === id);
  if (id !== "new" && !pk) notFound();
  const back = "/admin/catalog/packages";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← الباقات</Link>
        <h1 className="text-3xl text-brand">{pk ? pk.name : "باقة جديدة"}</h1>
      </div>
      <CatalogForm action={savePackage.bind(null, pk?.id ?? null)} backTo={back}>
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربية" name="name" defaultValue={pk?.name} required />
            <Field label="الاسم بالإنجليزية" name="nameEn" defaultValue={pk?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربية" name="description" defaultValue={pk?.description} />
            <TextArea label="الوصف بالإنجليزية" name="descriptionEn" defaultValue={pk?.en?.description} dir="ltr" />
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
            <Select label="الموسم (تظهر وتختفي مع الموسم)" name="seasonId" defaultValue={pk?.seasonId ?? ""} options={opts.seasons} />
          </Row>
          <Field label="الرابط (slug)" name="slug" defaultValue={pk?.slug} dir="ltr" hint="إن تركته فارغاً يُنشأ من الاسم الإنجليزي." />
        </Section>

        <Section title="المحتويات والسعر">
          <PackageItemsPicker
            products={d.products.map((p) => {
              // البراند بياخد سعر منتجه كامل حتى جوه الباكدج (والعمولة ممكن تبقى صفر تحت حد الشهر)، فتكلفته سعره
              const brand = p.partnerId ? (d.partners.find((x) => x.id === p.partnerId)?.name ?? null) : null;
              return { id: p.id, name: p.name, price: p.price, cost: brand ? p.price : costOf(p, d), available: p.isAvailable, brand };
            })}
            initial={pk?.items ?? []}
            initialPrice={pk?.price ?? 0}
            minMargin={opts.minPackageMargin}
          />
        </Section>

        <Section title="الصندوق (اختياري للعميل)">
          {boxes.length === 0 ? (
            <p className="text-sm text-muted">لا توجد مقاسات صناديق مفعّلة. أضفها من «الصناديق والتغليف».</p>
          ) : (
            <>
              <ChecksGroup label="مقاسات الصندوق المناسبة لهذه الباقة" name="boxSizeIds" options={boxes.map((b) => ({ value: b.id, label: `${b.name} (+${b.price} ج.م)` }))} selected={opts.packageBoxes[pk?.id ?? ""] ?? []} />
              <p className="-mt-2 text-xs leading-5 text-muted">
                يختار العميل «بدون صندوق» أو أحد هذه المقاسات، ويُضاف سعر الصندوق إلى سعر الباقة. إن لم تحدد أي مقاس، تُباع الباقة بدون صندوق.
              </p>
            </>
          )}
        </Section>

        <Section title="الصورة">
          <ImageField current={pk?.images[0]} />
        </Section>

        <Section title="لأي مناسبة ولمن">
          <ChecksGroup label="المناسبات" name="occasions" options={opts.occasions} selected={pk?.occasions ?? []} />
          <ChecksGroup label="لمن" name="recipients" options={opts.recipients} selected={pk?.recipients ?? []} />
          <Check label="متاح للبيع" name="isAvailable" defaultChecked={pk?.isAvailable ?? true} />
        </Section>
      </CatalogForm>
      {pk && <DeleteButton action={deletePackage.bind(null, pk.id)} backTo={back} what="الباقة" />}
    </div>
  );
}
