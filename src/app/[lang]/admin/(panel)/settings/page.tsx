import { Check, ChecksGroup, Field, Row, Section, TextArea } from "@/components/admin/form";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllOccasions } from "@/lib/catalog";
import { loadCatalogData } from "@/lib/db/catalog-store";
import { saveSiteSettings } from "@/lib/site-actions";
import { loadSiteSettingsFresh, sections } from "@/lib/site-settings";

export const instant = false;

export const metadata = { title: "إعدادات الموقع" };

const quoteSlots = [
  { id: "red", label: "الاقتباس الأول (الأحمر، تحت «نختار الهدية سوا»)" },
  { id: "blue", label: "الاقتباس التاني (الأزرق، بعد «جرّب تكتب كارتك»)" },
  { id: "paper", label: "الاقتباس الأخير (الأبيض، في آخر الصفحة)" },
] as const;

/** إعدادات شكل الموقع: الاقتباسات، اللي ظاهر من المناسبات والتصنيفات، الأقسام، وقفل الموقع */
export default async function SiteSettingsPage() {
  await requireAdmin();
  const [site, occasions, catalog] = await Promise.all([loadSiteSettingsFresh(), getAllOccasions(), loadCatalogData()]);
  const categories = [...new Set(catalog.products.map((p) => p.category).filter(Boolean))].sort();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-brand">إعدادات الموقع</h1>
        <p className="mt-1 text-sm text-muted">أي تغيير هنا بيظهر على الموقع أول ما تدوسي «حفظ».</p>
      </div>

      {site.maintenance.enabled && (
        <p className="rounded-2xl border-2 border-brand bg-brand-soft p-4 font-semibold text-brand">
          الموقع مقفول دلوقتي والناس شايفة رسالة «{site.maintenance.title}». شيلي العلامة من «اقفل الموقع» واحفظي عشان يرجع.
        </p>
      )}

      <SiteSettingsForm action={saveSiteSettings}>
        <Section title="قفل الموقع مؤقتاً">
          <Check label="اقفل الموقع واعرض رسالة للناس (لوحة التحكم بتفضل شغالة)" name="m_enabled" defaultChecked={site.maintenance.enabled} />
          <Row>
            <Field label="العنوان" name="m_title" defaultValue={site.maintenance.title} />
            <Field label="العنوان بالإنجليزي" name="m_titleEn" defaultValue={site.maintenance.titleEn} dir="ltr" />
          </Row>
          <Row>
            <TextArea label="الرسالة" name="m_message" defaultValue={site.maintenance.message} />
            <TextArea label="الرسالة بالإنجليزي" name="m_messageEn" defaultValue={site.maintenance.messageEn} dir="ltr" />
          </Row>
        </Section>

        <Section title="الاقتباسات في الرئيسية">
          <p className="-mt-2 text-sm text-muted">لو سيبتي الاقتباس فاضي مش هيظهر. السطر الصغير بيظهر تحت الاقتباس (زي اسم القايل أو جملة قصيرة)، وهو اختياري.</p>
          {quoteSlots.map((q) => (
            <div key={q.id} className="space-y-3 border-t border-dashed border-line pt-4 first:border-0 first:pt-0">
              <p className="font-semibold">{q.label}</p>
              <Row>
                <TextArea label="الاقتباس" name={`q_${q.id}_text`} defaultValue={site.quotes[q.id].text} rows={2} />
                <TextArea label="الاقتباس بالإنجليزي" name={`q_${q.id}_textEn`} defaultValue={site.quotes[q.id].textEn} rows={2} dir="ltr" />
              </Row>
              <Row>
                <Field label="السطر الصغير تحته" name={`q_${q.id}_sub`} defaultValue={site.quotes[q.id].sub} />
                <Field label="السطر الصغير بالإنجليزي" name={`q_${q.id}_subEn`} defaultValue={site.quotes[q.id].subEn} dir="ltr" />
              </Row>
            </div>
          ))}
        </Section>

        <Section title="أقسام الموقع">
          <p className="-mt-2 text-sm text-muted">القسم المقفول بيختفي من المينيو والرئيسية، وصفحته بتقول إنه مقفول مؤقتاً.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((s) => (
              <Check key={s.id} label={s.label} name={`sec_${s.id}`} defaultChecked={site.sections[s.id]} />
            ))}
          </div>
        </Section>

        <Section title="المناسبات الظاهرة">
          {occasions.map((o) => (
            <input key={o.slug} type="hidden" name="occ_all" value={o.slug} />
          ))}
          <ChecksGroup
            label="المتعلّم عليها ظاهرة. المخفية بتختفي من الرئيسية والفلاتر والمينيو، وصفحتها بتتقفل."
            name="occ"
            options={occasions.map((o) => ({ value: o.slug, label: o.name }))}
            selected={occasions.filter((o) => !site.hiddenOccasions.includes(o.slug)).map((o) => o.slug)}
          />
        </Section>

        <Section title="تصنيفات المنتجات الظاهرة">
          {categories.map((c) => (
            <input key={c} type="hidden" name="cat_all" value={c} />
          ))}
          <ChecksGroup
            label="المتعلّم عليها ظاهرة. التصنيف المخفي منتجاته كلها بتختفي، ومعاها أي باكدج فيه منتج منه."
            name="cat"
            options={categories.map((c) => ({ value: c, label: c }))}
            selected={categories.filter((c) => !site.hiddenCategories.includes(c))}
          />
        </Section>
      </SiteSettingsForm>
    </div>
  );
}
