import { getT } from "@/i18n/server";
import { SectionClosed } from "@/components/closed-screens";
import { sectionOpen } from "@/lib/site-settings";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/client";
import { Grid, PackageCard, SectionHeading } from "@/components/cards";
import { getLocalizedStorefront } from "@/lib/catalog";
import { PageHeader, Polaroid } from "@/components/scrapbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ابعت هدية لأهلك في أسيوط"), description: t("من القاهرة أو الخليج أو برا مصر: اختار الهدية وادفع أونلاين، وإحنا نوصّلها لأهلك في أسيوط ونبعتلك صورة التسليم.") };
}

const steps = [
  ["اختار الهدية واكتب الكارت", "اكتب رسالتك، وإحنا نطبعها على كارت جوه الهدية."],
  ["حدد عنوان أهلك والميعاد", "اليوم والفترة اللي تناسبهم، ورقم حد هناك نكلمه."],
  ["ادفع بإنستاباي", "من أي بنك في مصر أو من تطبيق إنستاباي، والتأكيد بيوصلك على واتساب."],
  ["شوف الهدية وهي بتوصل", "صورة الهدية قبل ما تخرج، وصورة وهي في إيد أهلك."],
];

export default async function SendToAssiutPage() {
  // القسم ده ممكن يتقفل من إعدادات الموقع في اللوحة
  if (!(await sectionOpen("sendToAssiut"))) return <SectionClosed title="ابعت لأهلك في أسيوط" />;
  const t = await getT();
  const sf = await getLocalizedStorefront();
  const heroImage = sf.packages.find((p) => p.slug === "get-well-soon")?.images[0];
  const family = sf.packages.filter((p) => p.recipients.some((r) => r === "mom" || r === "dad"));

  return (
    <div className="pb-4">
      <PageHeader
        tone="lilac"
        kicker={t("لأبناء أسيوط برا المحافظة")}
        title={t("إنت بعيد، بس هديتك توصل في ميعادها")}
        subtitle={t("من القاهرة أو الخليج أو أي مكان: اختار الهدية وادفع أونلاين، وإحنا نوصّلها لأهلك في أسيوط ونبعتلك صورة وهي بتتسلم.")}
        aside={
          heroImage ? (
            <div className="hidden w-52 shrink-0 md:block">
              <Polaroid caption={t("وصلت!")} rotate={6} tape="pink">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image src={heroImage} alt="" fill sizes="208px" className="object-cover" priority />
                </div>
              </Polaroid>
            </div>
          ) : null
        }
      >
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Link href="/shop?for=mom" className="btn-primary">{t("هدايا لماما")}</Link>
          <Link href="/shop?for=dad" className="btn border-2 border-brand bg-bg text-brand hover:bg-brand-soft">{t("هدايا لبابا")}</Link>
        </div>
      </PageHeader>

      <section className="container-x py-10">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, body], i) => (
            <li key={title} className={`rounded-2xl border border-line bg-paper p-5 ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
              <span className="tabular font-heading text-5xl text-brand">0{i + 1}</span>
              <p className="mt-3 font-bold">{t(title)}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-x">
        <SectionHeading title={t("هدايا للعيلة")} subtitle={t("الأكتر طلباً من اللي برا أسيوط")} href="/shop" />
        <Grid>
          {family.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </Grid>
      </section>

      <section className="container-x mt-10">
        <div className="space-y-3 rounded-3xl border border-line bg-paper p-6 text-sm leading-7 shadow-[0_16px_28px_-20px_rgb(60_20_25/0.55)] sm:p-8">
          <h2 className="text-xl">{t("أسئلة بتتسأل كتير")}</h2>
          <p><b>{t("بدفع إزاي من برا مصر؟")}</b> {t("الدفع حالياً بإنستاباي بس. لو معندكش، حد من أهلك في مصر يقدر يحوّل.")}</p>
          <p><b>{t("أهلي هيعرفوا السعر؟")}</b> {t("لأ، الاختيار الافتراضي إن السعر مش بيتكتب على أي حاجة في الهدية.")}</p>
          <p><b>{t("عايزها مفاجأة؟")}</b> {t("اختار «مفاجأة» في السلة، والمندوب مش هيكلم المستلم غير وهو على الباب.")}</p>
        </div>
      </section>
    </div>
  );
}
