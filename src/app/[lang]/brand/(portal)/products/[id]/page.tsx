import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/catalog-ui";
import { CatalogForm, Check, ChecksGroup, CustomizationFields, Field, Row, Section, StockField, TextArea } from "@/components/admin/form";
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
          {p ? "هذا المنتج بانتظار موافقة المتجر، وسيظهر على الموقع فور الموافقة عليه." : "بعد الحفظ يُرسل المنتج إلى المتجر لمراجعته، ويظهر على الموقع فور الموافقة."}
        </p>
      )}
      <CatalogForm action={saveBrandProduct.bind(null, p?.id ?? null)} backTo={back}>
        <Section title="الأساسيات">
          <Row>
            <Field label="الاسم بالعربية" name="name" defaultValue={p?.name} required />
            <Field label="الاسم بالإنجليزية (اختياري)" name="nameEn" defaultValue={p?.en?.name} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الوصف بالعربية" name="description" defaultValue={p?.description} />
            <TextArea label="الوصف بالإنجليزية (اختياري)" name="descriptionEn" defaultValue={p?.en?.description} dir="ltr" />
          </Row>
          <Row>
            <Field label="السعر للعميل (ج.م)" name="price" type="number" defaultValue={p?.price} required hint="هذا هو السعر الذي يراه العميل تماماً. تبدأ عمولة المتجر فقط عندما تتجاوز مبيعاتك في الشهر حداً معيناً (راجع «حسابي مع المتجر»)." />
            <Field
              label="كم يوماً يستغرق تجهيزه؟"
              name="prepDays"
              type="number"
              defaultValue={p?.prepDays ?? ""}
              required
              hint="من لحظة وصول الطلب إليك حتى تسليمه للمتجر. صفر يعني أنه جاهز ويُسلَّم في اليوم نفسه. على أساسه يرى العميل أقرب يوم للتوصيل عند الدفع."
            />
          </Row>
          <Row>
            <Field label="التصنيف بالعربية" name="category" defaultValue={p?.category} placeholder="أكواب، شموع، إكسسوارات…" />
            <Field label="التصنيف بالإنجليزية (اختياري)" name="categoryEn" defaultValue={p?.en?.category} dir="ltr" />
          </Row>
        </Section>

        <Section title="الصور">
          <ProductImagesField current={p?.images ?? []} label="رفع الصور" />
        </Section>

        <Section title="المناسبات والفئات المناسبة">
          <ChecksGroup label="المناسبات" name="occasions" options={opts.occasions} selected={p?.occasions ?? []} />
          <ChecksGroup label="لمن" name="recipients" options={opts.recipients} selected={p?.recipients ?? []} />
          <Field label="الاهتمامات" name="interests" defaultValue={p?.interests.join("، ")} hint="مفصولة بفاصلة: قهوة، ديكور، قراءة (تساعد مساعد الهدايا على ترشيح المنتج)" />
        </Section>

        <Section title="الألوان والمقاسات والروائح">
          <OptionsEditor initial={p?.options ?? []} />
        </Section>

        <Section title="المخزون والإعدادات">
          <div className="grid gap-3 sm:grid-cols-2">
            <Check label="متاح للبيع (ألغِ التحديد لإيقاف المنتج مؤقتاً)" name="isAvailable" defaultChecked={p?.isAvailable ?? true} />
            <Check label="يمكن وضعه في صندوق" name="boxEligible" defaultChecked={p?.boxEligible ?? true} />
          </div>
          <CustomizationFields
            defaultChecked={p?.isCustomizable ?? false}
            defaultMax={p?.customizationMaxChars ?? null}
            defaultKind={p ? (opts.productCustomization[p.id] ?? "text") : "text"}
            hint="مثل كوب بالاسم، أو برواز بصورة. يكتب العميل النص أو يرفع الصورة في صفحة الدفع، ويصلك مع الطلب. عدد الحروف حسب المساحة المتاحة على المنتج."
          />
          <Row>
            <StockField
              label="الكمية المتوفرة لديك"
              defaultValue={p?.stock}
              hasOptions={Boolean(p?.options?.length)}
              hint="حقل مطلوب. تقل الكمية تلقائياً مع كل طلب، وعند نفادها يُغلق المنتج بحالة «نفد». كل طلب يصلك يجب تجهيزه، لذلك حدّث الكمية أولاً بأول."
            />
          </Row>
        </Section>
      </CatalogForm>
      {p && <DeleteButton action={deleteBrandProduct.bind(null, p.id)} backTo={back} what="المنتج" confirmText="هل تريد حذف هذا المنتج؟ لا يمكن التراجع عن ذلك." />}
    </div>
  );
}
