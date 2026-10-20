"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Link, useT } from "@/i18n/client";
import { useHydrated } from "@/lib/use-hydrated";
import { GiftRibbon } from "./decor";
import { Icon } from "./icons";
import { Pill } from "./scrapbook";

interface HeroImage {
  src: string;
  alt: string;
  caption: string;
}

const words = ["لماما", "لصاحبتك", "لأختك", "لحبيبتك", "لبابا", "لنفسك"];
const ease = [0.22, 1, 0.36, 1] as const;

// نجمة بـ ١٢ شعاع طويل ورفيع (زي البوستر)
const starburst = Array.from({ length: 24 }, (_, i) => {
  const a = (Math.PI / 12) * i - Math.PI / 2;
  const r = i % 2 ? 16 : 100;
  return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
}

/**
 * أول الصفحة: صفحة زرقا هادية فيها الكلام والزراير، وصور بولارويد على الجنب،
 * وشريطة كاروهات حمرا بفيونكة (توقيع الهوية). الكلمة اللي بتتغير بتقول الهدية لمين.
 */
export function Hero({
  images,
  seasonName,
  seasonHref,
  deadline,
}: {
  images: HeroImage[];
  seasonName: string | null;
  seasonHref: string;
  deadline: string | null;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const [word, setWord] = useState(0);
  const daysLeft = hydrated && deadline ? daysUntil(deadline) : null;

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setWord((w) => (w + 1) % words.length), 2800);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <section className="container-x pt-4 sm:pt-6">
      <div className="panel relative overflow-hidden border border-line bg-paper">
        {/* الشريطة والفيونكة */}
        <GiftRibbon className="end-[12%] hidden lg:block" />

        <div className="grid items-center gap-10 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:pe-[18%]">
          <div className="animate-fade-up">
            <Pill tone="blue">{t("هدايا متغلفة من براندات أسيوط")}</Pill>
            <h1 className="mt-4 text-5xl leading-[1.25] text-ink sm:text-6xl ltr:sm:text-[3.4rem]">
              {t("هدية تفرّح")}
              <span className="relative block h-[1.3em] overflow-hidden text-brand">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={words[word]}
                    className="block"
                    initial={{ y: "80%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-80%", opacity: 0 }}
                    transition={{ duration: 0.6, ease }}
                  >
                    {t(words[word])}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            <p className="mt-3 max-w-md text-lg leading-8 text-ink-2">
              {t("باكدجات متغلفة، بوكس على ذوقك، وهدايا من براندات أسيوط المحلية. بتوصل لحد البيت في اليوم والفترة اللي تختارها.")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={seasonHref} className="btn-primary">
                {t("اختار هديتك")}
              </Link>
              <Link href="/box" className="btn border border-ink/15 bg-bg text-ink hover:border-brand hover:text-brand">
                {t("اعمل البوكس بنفسك")}
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-ink-2">
              {["توصيل في نفس اليوم في أسيوط", "صورة الهدية قبل ما تخرج", "كارت برسالتك مع كل هدية"].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <Icon name="check" className="size-4 text-brand" />
                  {t(x)}
                </li>
              ))}
            </ul>
          </div>

          {/* صور بولارويد على نجمة زرقا بتلف بالراحة، وسهم مرسوم بالإيد */}
          <div className="relative mx-auto h-[22rem] w-full max-w-sm sm:h-[26rem]">
            <svg viewBox="-100 -100 200 200" className="absolute -inset-[18%] animate-spin-slow text-periwinkle" aria-hidden>
              <polygon points={starburst} fill="currentColor" opacity="0.55" />
            </svg>

            {images[0] && (
              <div className="absolute top-0 end-0 w-[60%] animate-float">
                <figure className="polaroid animate-drop-in [--r:3deg] [animation-delay:200ms]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image src={images[0].src} alt={images[0].alt} fill sizes="240px" className="object-cover" priority />
                  </div>
                  <figcaption className="mt-2 text-center font-script text-lg leading-none text-ink-2">{t(images[0].caption)}</figcaption>
                </figure>
              </div>
            )}
            {images[1] && (
              <div className="absolute bottom-0 start-0 w-[54%] animate-float [animation-delay:-3.5s]">
                <figure className="polaroid animate-drop-in [--r:-4deg] [animation-delay:450ms]">
                  <div className="relative aspect-square overflow-hidden">
                    <Image src={images[1].src} alt={images[1].alt} fill sizes="220px" className="object-cover" priority />
                  </div>
                  <figcaption className="mt-2 text-center font-script text-lg leading-none text-ink-2">{t(images[1].caption)}</figcaption>
                </figure>
              </div>
            )}

            {/* ملاحظة بخط الإيد وسهمها بيترسم */}
            <div className="absolute top-4 start-0 w-[38%] text-center">
              <p className="animate-fade-up font-script text-xl leading-tight text-blue-deep [animation-delay:900ms]">{t("متغلفة بحب")}</p>
              <svg viewBox="0 0 120 60" className="mx-auto mt-1 w-24 rtl:-scale-x-100" fill="none" aria-hidden>
                <path
                  d="M10 8 C 20 40, 60 52, 104 40"
                  stroke="var(--color-blue-deep)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  className="animate-[draw_1s_ease-out_1.1s_both]"
                />
                <path d="M94 31 L105 40 L93 48" stroke="var(--color-blue-deep)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-up [animation-delay:1.9s]" />
              </svg>
            </div>

            {seasonName && (
              <div className="absolute end-2 bottom-4 z-10 w-36 animate-pop-in rounded-2xl bg-brand p-3 text-center text-maroon-ink shadow-lg [animation-delay:1.2s]">
                <p className="text-sm leading-tight">{seasonName}</p>
                {daysLeft !== null && <p className="tabular mt-0.5 font-heading text-2xl">{t("فاضل {n} يوم", { n: daysLeft })}</p>}
                <p className="text-xs opacity-80">{t("على آخر ميعاد للطلب")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
