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
            <h2 className="text-xl text-butter">البراند ضاف المنتج ده ومستني موافقتك</h2>
            <p className="text-sm leading-6 text-butter">راجعي الصورة والسعر والوصف، وعلّمي الموافقة واحفظي. المنتج هيظهر على الموقع لو «متاح للبيع» متعلّم.</p>
            <Check label="موافقة: اعرضي المنتج على الموقع" name="approve" defaultChecked={false} />
          </section>
        )}
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربي" name="name" defaultValue={p?.name} required />
            <Field label="الاسم بالإنجليزي" name="nameEn" defaultValue={p?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربي" name="description" defaultValue={p?.description} />
            <TextArea label="الوصف بالإنجليزي" name="descriptionEn" defaultValue={p?.en?.description} dir="ltr" />
          </Row>
          <PriceCostBrand price={p?.price} cost={p?.cost} partnerId={p?.partnerId} partners={d.partners.map((b) => ({ id: b.id, name: b.name }))} prepDays={p?.prepDays ?? 0} />
          <Row>
            <Field label="التصنيف بالعربي" name="category" defaultValue={p?.category} placeholder="مجات، شموع، ورد…" />
            <Field label="التصنيف بالإنجليزي" name="categoryEn" defaultValue={p?.en?.category} dir="ltr" />
          </Row>
          <Field label="الرابط (slug)" name="slug" defaultValue={p?.slug} dir="ltr" hint="بالإنجليزي من غير مسافات. لو سبتيه فاضي بيتعمل من الاسم الإنجليزي." />
        </Section>

        <Section title="الصور">
          <ProductImagesField current={p?.images ?? []} />
        </Section>

        <Section title="مناسب لإيه ولمين (للتصفح ومساعد الهدايا)">
          <ChecksGroup label="المناسبات" name="occasions" options={opts.occasions} selected={p?.occasions ?? []} />
          <ChecksGroup label="لمين" name="recipients" options={opts.recipients} selected={p?.recipients ?? []} />
          <Field label="الاهتمامات" name="interests" defaultValue={p?.interests.join("، ")} hint="مفصولة بفاصلة: قهوة، ديكور، قراية" />
        </Section>

        <Section title="الألوان والمقاسات والريحة">
          <OptionsEditor initial={p?.options ?? []} />
        </Section>

        <Section title="الإعدادات">
          <div className="grid gap-3 sm:grid-cols-2">
            <Check label="متاح للبيع (لو اتشال، المنتج وكل باكدج فيه بيختفوا)" name="isAvailable" defaultChecked={p ? p.reviewStatus === "pending" || p.isAvailable : true} />
            <Check label="ينفع يتحط في بوكس" name="boxEligible" defaultChecked={p?.boxEligible ?? true} />
            <Check label="إضافة على الباكدجات (ورد، بالونة…)" name="isAddon" defaultChecked={p?.isAddon ?? false} />
          </div>
          <CustomizationFields
            defaultChecked={p?.isCustomizable ?? false}
            defaultMax={p?.customizationMaxChars ?? null}
            hint="لو المنتج بيتكتب عليه اسم أو جملة (زي مج بالاسم أو ميدالية محفورة)، العميل بيلاقي خانة يكتب فيها الكلام. الرقم ده أقصى عدد حروف يقدر يكتبه، على قد المساحة اللي على المنتج: مثلاً 15 للمج، وأكتر للكوشن أو البرواز."
          />
          <Row>
            <StockField
              label="العدد في المخزن"
              defaultValue={p?.stock}
              hasOptions={Boolean(p?.options?.length)}
              hint="اختياري. سيبيه فاضي لو مش عايزة تعدّي. لو كتبتيه بيقل لوحده مع كل طلب، وأول ما يخلص المنتج بيبان «خلص»."
            />
          </Row>
        </Section>
      </CatalogForm>
      {p && <DeleteButton action={deleteProduct.bind(null, p.id)} backTo={back} what="المنتج" />}
    </div>
  );
}
