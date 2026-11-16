import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { Icon, type IconName } from "./icons";
import { Pill } from "./scrapbook";

/*
 * فكرة الموقع في سطر: إنت مش لازم تكون موجود.
 * تطلب من أي مكان، وإحنا نجهز الهدية ونوصّلها لحد باب اللي بتحبه باسمك.
 * ٣ محطات على خط متقطع (بالطول في الموبايل وبالعرض في الكمبيوتر).
 */

const stops: { icon: IconName; who: string; title: string; body: string; tone: string }[] = [
  {
    icon: "pin",
    who: "إنت",
    title: "من أي مكان",
    body: "في القاهرة، مسافر، أو مش فاضي تنزل. بتطلب من موبايلك في دقايق.",
    tone: "bg-blue-soft text-blue-deep",
  },
  {
    icon: "gift",
    who: "إحنا",
    title: "بنجهزها عنك",
    body: "بنغلّف الهدية، ونكتب كارتك بكلامك، ونبعتلك صورتها قبل ما تخرج.",
    tone: "bg-blush text-brand",
  },
  {
    icon: "home",
    who: "اللي بتحبه",
    title: "توصله لحد بابه",
    body: "في اليوم والفترة اللي اخترتها. باسمك، أو من غير اسمك لو عايزها سر. وتوصلك صورة وهي بتتسلم.",
    tone: "bg-butter-soft text-butter",
  },
];

export async function SendForYou() {
  const t = await getT();
  return (
    <section className="container-x">
      <div className="panel grain relative overflow-hidden border border-line bg-paper px-5 py-10 sm:px-10 sm:py-14">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Pill tone="blue">{t("فكرتنا ببساطة")}</Pill>
          <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{t("إنت بعيد؟ هديتك توصل برضه")}</h2>
          <p className="mt-3 text-lg leading-8 text-ink-2">
            {t("مش لازم تكون موجود ولا تلف على المحلات. اختار الهدية من هنا، وإحنا نوصّلها عنك للي بتحبه، كأنك سلّمتها بإيدك.")}
          </p>
        </div>

        <ol className="reveal-stagger relative mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-3 lg:gap-6">
          {/* الخط المتقطع اللي بيوصّل المحطات: بالطول في الموبايل، وبالعرض في الكمبيوتر */}
          <span aria-hidden className="absolute top-8 bottom-8 start-8 border-s-2 border-dashed border-brand/30 lg:hidden" />
          <span aria-hidden className="absolute inset-x-[17%] top-8 hidden border-t-2 border-dashed border-brand/30 lg:block" />
          {stops.map((s, i) => (
            <li key={s.who} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
              <span className={`relative z-10 grid size-16 shrink-0 place-items-center rounded-full border-4 border-paper shadow-md ${s.tone}`}>
                <Icon name={s.icon} className="size-7" />
                <span className="tabular absolute -top-1 -end-1 grid size-6 place-items-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
              </span>
              <div className="min-w-0 pt-1 lg:pt-0">
                <span className="font-script text-2xl text-brand">{t(s.who)}</span>
                <h3 className="font-heading text-2xl leading-tight">{t(s.title)}</h3>
                <p className="mt-1 text-[15px] leading-7 text-ink-2">{t(s.body)}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Link href="/shop" className="btn-primary">
            {t("ابعت هدية دلوقتي")}
          </Link>
        </div>
      </div>
    </section>
  );
}
