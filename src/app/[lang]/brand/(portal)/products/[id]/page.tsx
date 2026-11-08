import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, ChecksGroup, CustomizationFields, Field, Row, Section, TextArea } from "@/components/admin/form";
import { ProductImagesField } from "@/components/admin/product-images";
import { OptionsEditor } from "@/components/admin/options-editor";
import { requireBrand } from "@/lib/brand-auth";
import { deleteBrandProduct, saveBrandProduct } from "@/lib/brand-actions";
import { adminOptions } from "@/lib/admin-options";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "منتج" };

/** البراند بيضيف ويعدّل منتجاته (من غير التكلفة ولا البراند ولا الموافقة) */
export default async function BrandProduct({ params }: PageProps<"/[lang]/brand/products/[id]">) {
  const s = await requireBrand();
  const { id } = await params;
  const [d, opts] = await Promise.all([loadCatalogData(), adminOptions()]);
  const p = id === "new" ? null : d.products.find((x) => x.id === id && x.partnerId === s.partnerId);
  if (id !== "new" && !p) notFound();
  const back = "/brand/products";
  const pending = !p || p.reviewStatus === "pending";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm text-muted hover:text-brand">← منتجاتي</Link>
        <h1 className="text-3xl text-brand">{p ? p.name : "منتج جديد"}</h1>
      </div>
      {pending && (
        <p className="rounded-2xl bg-butter-soft p-4 text-sm leading-6 text-butter">
          {p ? "المنتج ده مستني موافقة المتجر، وهيظهر على الموقع أول ما يتوافق عليه." : "بعد الحفظ المنتج بيروح للمتجر يراجعه، وبيظهر على الموقع أول ما يوافق."}
        </p>
      )}
      <CatalogForm action={saveBrandProduct.bind(null, p?.id ?? null)} backTo={back}>
        <Section title="الأساسي">
          <Row>
            <Field label="الاسم بالعربي" name="name" defaultValue={p?.name} required />
            <Field label="الاسم بالإنجليزي (اختياري)" name="nameEn" defaultValue={p?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربي" name="description" defaultValue={p?.description} />
            <TextArea label="الوصف بالإنجليزي (اختياري)" name="descriptionEn" defaultValue={p?.en?.description} dir="ltr" />
          </Row>
          <Row>
            <Field label="السعر للعميل (ج.م)" name="price" type="number" defaultValue={p?.price} required hint="ده السعر اللي العميل بيشوفه بالظبط. عمولة المتجر بتبدأ بس لما مبيعاتك في الشهر تعدّي حد معين (شوف «حسابي مع المتجر»)." />
            <Field
              label="بتجهّزه في كام يوم؟"
              name="prepDays"
              type="number"
              defaultValue={p?.prepDays ?? ""}
              required
              hint="من ساعة ما الطلب يوصلك لحد ما تسلّمه للمتجر. صفر يعني جاهز ويتسلّم في نفس اليوم. العميل بيشوف على أساسه أقرب يوم توصيل وهو بيدفع."
            />
          </Row>
          <Row>
            <Field label="التصنيف بالعربي" name="category" defaultValue={p?.category} placeholder="مجات، شموع، إكسسوارات…" />
            <Field label="التصنيف بالإنجليزي (اختياري)" name="categoryEn" defaultValue={p?.en?.category} dir="ltr" />
          </Row>
        </Section>

        <Section title="الصور">
          <ProductImagesField current={p?.images ?? []} label="ارفع صور" />
        </Section>

        <Section title="مناسب لإيه ولمين">
          <ChecksGroup label="المناسبات" name="occasions" options={opts.occasions} selected={p?.occasions ?? []} />
          <ChecksGroup label="لمين" name="recipients" options={opts.recipients} selected={p?.recipients ?? []} />
          <Field label="الاهتمامات" name="interests" defaultValue={p?.interests.join("، ")} hint="مفصولة بفاصلة: قهوة، ديكور، قراية (بتساعد مساعد الهدايا يرشّح المنتج)" />
        </Section>

        <Section title="الألوان والمقاسات والريحة">
          <OptionsEditor initial={p?.options ?? []} />
        </Section>

        <Section title="المخزون والإعدادات">
          <div className="grid gap-3 sm:grid-cols-2">
            <Check label="متاح للبيع (شيله لو عايز توقف المنتج مؤقتاً)" name="isAvailable" defaultChecked={p?.isAvailable ?? true} />
            <Check label="ينفع يتحط في بوكس" name="boxEligible" defaultChecked={p?.boxEligible ?? true} />
          </div>
          <CustomizationFields
            defaultChecked={p?.isCustomizable ?? false}
            defaultMax={p?.customizationMaxChars ?? null}
            hint="لو المنتج بيتكتب عليه اسم أو جملة (زي مج بالاسم أو ميدالية محفورة)، العميل بيلاقي خانة يكتب فيها الكلام. الرقم ده أقصى عدد حروف يقدر يكتبه، على قد المساحة اللي على المنتج."
          />
          <Row>
            <Field
              label="العدد اللي عندك"
              name="stock"
              type="number"
              defaultValue={p?.stock ?? ""}
              hint="لازم يتكتب. لو المنتج ليه ألوان أو مقاسات، اكتب عدد كل واحد في الجدول فوق بدل هنا. العدد بيقل لوحده مع كل طلب، وأول ما يخلص المنتج بيتقفل «خلص». أي طلب بيوصلك لازم يتجهز، فخلّي العدد مظبوط أول بأول."
            />
          </Row>
        </Section>
      </CatalogForm>
      {p && <DeleteButton action={deleteBrandProduct.bind(null, p.id)} backTo={back} what="المنتج" confirmText="متأكد إنك عايز تمسح المنتج ده؟ مفيش رجوع." />}
    </div>
  );
}
