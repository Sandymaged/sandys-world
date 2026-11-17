import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { Icon, type IconName } from "./icons";
import { Pill } from "./scrapbook";

/*
 * فكرة الموقع وإزاي بتوصل الهدية، في مكان واحد.
 * شكله مختلف عن العنوان اللي فوقه (كانوا كارتين كريمي شبه بعض): شريط أزرق غامق بعرض الصفحة،
 * الكلام على جنب والخطوات على الجنب التاني كخط متوصل.
 */

const steps: { icon: IconName; title: string; body: string }[] = [
  { icon: "gift", title: "اختر الهدية", body: "باقة جاهزة، أو منتج واحد، أو صندوق تصمّمه بنفسك." },
  { icon: "pin", title: "حدّد المستلم والموعد", body: "العنوان واليوم والفترة ورسالة البطاقة، واسمك يظهر عليها أو لا." },
  { icon: "camera", title: "نجهّزها ونرسل لك صورتها", body: "نغلّفها ونكتب بطاقتك، وتصلك صورتها على واتساب قبل خروجها." },
  { icon: "home", title: "تصل إلى بابه", body: "في الموعد الذي اخترته، وتصلك صورة التسليم إن أردت." },
];

const perks: { icon: IconName; text: string }[] = [
  { icon: "truck", text: "توصيل في اليوم نفسه" },
  { icon: "store", text: "من براندات أسيوط" },
  { icon: "route", text: "تتابع طلبك خطوة بخطوة" },
];

export async function SendForYou() {
  const t = await getT();
  return (
    <section className="relative overflow-hidden bg-blue-deep py-14 text-white sm:py-20">
      {/* لمسة خفيفة في الخلفية */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -end-24 size-72 rounded-full bg-white/5" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -start-16 size-80 rounded-full bg-white/5" />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="reveal text-center lg:text-start">
          <Pill tone="light">{t("فكرتنا ببساطة")}</Pill>
          <h2 className="mt-4 text-4xl leading-tight text-white sm:text-5xl">{t("إنت بعيد؟ هديتك توصل برضه")}</h2>
          <p className="mt-4 text-lg leading-8 text-white/80">
            {t("مش لازم تكون موجود ولا تلف على المحلات. اختار الهدية من هنا، وإحنا نوصّلها عنك للي بتحبه، كأنك سلّمتها بإيدك.")}
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {perks.map((p) => (
              <li key={p.text} className="flex items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-white/90">
                <Icon name={p.icon} className="size-4 text-pink-mid" />
                {t(p.text)}
              </li>
            ))}
          </ul>
          <Link href="/shop" className="btn-primary mt-8">
            {t("ابعت هدية دلوقتي")}
          </Link>
        </div>

        {/* الخطوات: خط متوصل بالطول */}
        <ol className="reveal-stagger relative space-y-7">
          <span aria-hidden className="absolute top-6 bottom-6 start-6 border-s-2 border-dashed border-white/25" />
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4">
              <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-white text-blue-deep shadow-lg">
                <Icon name={s.icon} className="size-6" />
                <span className="tabular absolute -top-1 -end-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{i + 1}</span>
              </span>
              <div className="min-w-0 pt-1">
                <h3 className="text-lg font-semibold leading-snug text-white">{t(s.title)}</h3>
                <p className="mt-0.5 text-[15px] leading-7 text-white/75">{t(s.body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
