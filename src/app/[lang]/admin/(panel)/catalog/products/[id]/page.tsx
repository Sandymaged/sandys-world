import Link from "next/link";
import { OptionsEditor } from "@/components/admin/options-editor";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, ChecksGroup, CustomizationFields, Field, PriceCostBrand, Row, Section, StockField, TextArea } from "@/components/admin/form";
import { ProductImagesField } from "@/components/admin/product-images";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteProduct, saveProduct } from "@/lib/admin-catalog-actions";
import { adminOptions } from "@/lib/admin-options";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "منتج" };

/** إضافة وتعديل منتج (FR-110) */
export default async function AdminProduct({ params }: PageProps<"/[lang]/admin/catalog/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [d, opts] = await Promise.all([loadCatalogData(), adminOptions()]);
  const p = id === "new" ? null : d.products.find((x) => x.id === id);
  if (id !== "new" && !p) notFound();
  const save = saveProduct.bind(null, p?.id ?? null);
  const back = "/admin/catalog/products";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← المنتجات</Link>
        <h1 className="text-3xl text-brand">{p ? p.name : "منتج جديد"}</h1>
      </div>
      <CatalogForm action={save} backTo={back}>
        {p?.reviewStatus === "pending" && (
          <section className="space-y-3 bg-butter-soft p-5">
            <h2 className="text-xl text-butter">أضافت العلامة التجارية هذا المنتج وهو بانتظار موافقتك</h2>
            <p className="text-sm leading-6 text-butter">راجع الصورة والسعر والوصف، وحدد الموافقة ثم احفظ. سيظهر المنتج على الموقع إن كان «متاح للبيع» محدداً.</p>
            <Check label="موافقة: عرض المنتج على الموقع" name="approve" defaultChecked={false} />
          </section>
        )}
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربية" name="name" defaultValue={p?.name} required />
            <Field label="الاسم بالإنجليزية" name="nameEn" defaultValue={p?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربية" name="description" defaultValue={p?.description} />
            <TextArea label="الوصف بالإنجليزية" name="descriptionEn" defaultValue={p?.en?.description} dir="ltr" />
          </Row>
          <PriceCostBrand price={p?.price} cost={p?.cost} partnerId={p?.partnerId} partners={d.partners.map((b) => ({ id: b.id, name: b.name }))} prepDays={p?.prepDays ?? 0} />
          <Row>
            <Field label="التصنيف بالعربية" name="category" defaultValue={p?.category} placeholder="مجات، شموع، ورد…" />
            <Field label="التصنيف بالإنجليزية" name="categoryEn" defaultValue={p?.en?.category} dir="ltr" />
          </Row>
          <Field label="الرابط (slug)" name="slug" defaultValue={p?.slug} dir="ltr" hint="بالإنجليزية دون مسافات. إن تركته فارغاً يُنشأ من الاسم الإنجليزي." />
        </Section>

        <Section title="الصور">
          <ProductImagesField current={p?.images ?? []} />
        </Section>

        <Section title="لأي مناسبة ولمن (للتصفح ومساعد الهدايا)">
          <ChecksGroup label="المناسبات" name="occasions" options={opts.occasions} selected={p?.occasions ?? []} />
          <ChecksGroup label="لمن" name="recipients" options={opts.recipients} selected={p?.recipients ?? []} />
          <Field label="الاهتمامات" name="interests" defaultValue={p?.interests.join("، ")} hint="مفصولة بفاصلة: قهوة، ديكور، قراءة" />
        </Section>

        <Section title="الألوان والمقاسات والروائح">
          <OptionsEditor initial={p?.options ?? []} />
        </Section>

        <Section title="الإعدادات">
          <div className="grid gap-3 sm:grid-cols-2">
            <Check label="متاح للبيع (إن أُلغي، يختفي المنتج وكل باقة تضمه)" name="isAvailable" defaultChecked={p ? p.reviewStatus === "pending" || p.isAvailable : true} />
            <Check label="يمكن وضعه في صندوق" name="boxEligible" defaultChecked={p?.boxEligible ?? true} />
            <Check label="إضافة على الباقات (ورد، بالون…)" name="isAddon" defaultChecked={p?.isAddon ?? false} />
          </div>
          <CustomizationFields
            defaultChecked={p?.isCustomizable ?? false}
            defaultMax={p?.customizationMaxChars ?? null}
            defaultKind={p ? (opts.productCustomization[p.id] ?? "text") : "text"}
            hint="مثل مج بالاسم، أو برواز بصورة. يكتب العميل النص أو يرفع الصورة في صفحة الدفع، ونخبره بذلك عند إضافة المنتج إلى السلة. عدد الأحرف حسب المساحة المتاحة على المنتج: مثلاً 15 للمج، وأكثر للوسادة."
          />
          <Row>
            <StockField
              label="العدد في المخزن"
              defaultValue={p?.stock}
              hasOptions={Boolean(p?.options?.length)}
              hint="اختياري. اتركه فارغاً إن لم ترد العدّ. إن كتبته يقلّ تلقائياً مع كل طلب، وعند نفاده يظهر المنتج «نفد»."
            />
          </Row>
        </Section>
      </CatalogForm>
      {p && <DeleteButton action={deleteProduct.bind(null, p.id)} backTo={back} what="المنتج" />}
    </div>
  );
}
