import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { Icon, type IconName } from "./icons";
import { Pill } from "./scrapbook";

/*
 * فكرة الموقع وإزاي بتوصل الهدية، في مكان واحد (كانت متكررة في ٣ أقسام، ومنها ظروف لازم تدوس عليها).
 * ٤ خطوات مكتوبة على طول، وتحتها ٣ مميزات قصيرة مش متكررة في حتة تانية.
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
    <section className="container-x">
      <div className="panel grain relative overflow-hidden border border-line bg-paper px-5 py-10 sm:px-10 sm:py-12">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Pill tone="blue">{t("فكرتنا ببساطة")}</Pill>
          <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("إنت بعيد؟ هديتك توصل برضه")}</h2>
          <p className="mt-3 text-lg leading-8 text-ink-2">
            {t("مش لازم تكون موجود ولا تلف على المحلات. اختار الهدية من هنا، وإحنا نوصّلها عنك للي بتحبه، كأنك سلّمتها بإيدك.")}
          </p>
        </div>

        <ol className="reveal-stagger mx-auto mt-9 grid max-w-5xl gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3.5 lg:flex-col lg:items-center lg:text-center">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon name={s.icon} className="size-6" />
                <span className="tabular absolute -top-1 -end-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{i + 1}</span>
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-snug">{t(s.title)}</h3>
                <p className="mt-0.5 text-[15px] leading-7 text-ink-2">{t(s.body)}</p>
              </div>
            </li>
          ))}
        </ol>

        <ul className="mt-9 flex flex-wrap justify-center gap-2">
          {perks.map((p) => (
            <li key={p.text} className="flex items-center gap-1.5 rounded-full bg-bg px-3.5 py-1.5 text-sm font-medium text-ink-2">
              <Icon name={p.icon} className="size-4 text-brand" />
              {t(p.text)}
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link href="/shop" className="btn-primary">
            {t("ابعت هدية دلوقتي")}
          </Link>
        </div>
      </div>
    </section>
  );
}
