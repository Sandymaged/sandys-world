"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Link, useT } from "@/i18n/client";
import { useHydrated } from "@/lib/use-hydrated";
import { GiftRibbon } from "./decor";
import { Icon } from "./icons";
import { Pill } from "./scrapbook";

export interface HeroSticker {
  src: string;
  alt: string;
  /** ورقة صغيرة جنب الصورة (لمين / بتاعة إيه) */
  chip?: string;
}

const words = ["لماما", "لصاحبتك", "لأختك", "لحبيبتك", "لبابا", "لنفسك"];
const ease = [0.22, 1, 0.36, 1] as const;

/*
 * أماكن الستيكرز حوالين العنوان: صور منتجات بإطار أبيض تخين ومايلة، بتنزل واحدة ورا التانية وبتطفو.
 * اللي «round» دايرة وجنبها ورقة صغيرة. على الموبايل بيبان أول ٤ بس وأصغر.
 */
const spots = [
  { pos: "top-6 start-[4%] sm:top-10 sm:start-[7%]", size: "w-20 sm:w-32", r: "-8deg", round: true, chipAt: "-bottom-3 -end-10" },
  { pos: "top-4 end-[5%] sm:top-12 sm:end-[16%]", size: "w-20 sm:w-28", r: "7deg" },
  { pos: "bottom-5 start-[6%] sm:bottom-auto sm:top-[62%] sm:start-[9%]", size: "w-[4.5rem] sm:w-28", r: "6deg" },
  { pos: "bottom-6 end-[6%] sm:bottom-16 sm:end-[13%]", size: "w-20 sm:w-32", r: "-6deg", round: true, chipAt: "-top-3 -start-10" },
  { pos: "hidden lg:block top-[42%] start-[2%]", size: "w-24", r: "-12deg" },
  { pos: "hidden lg:block top-[38%] end-[6%]", size: "w-24", r: "10deg" },
];

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
}

/**
 * أول الصفحة: عنوان كبير في النص «هدية تفرّح» وكلمة بخط الإيد معدية فوقه بتقول الهدية لمين،
 * وحواليه ستيكرز من منتجاتنا، والشريطة الكاروهات بالفيونكة على الطرف (توقيع الهوية).
 */
export function Hero({
  stickers,
  seasonName,
  seasonHref,
  deadline,
  showBox = true,
}: {
  stickers: HeroSticker[];
  seasonName: string | null;
  seasonHref: string;
  deadline: string | null;
  /** لو قسم البوكس اتقفل من اللوحة، زراره بيختفي */
  showBox?: boolean;
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
      <div className="panel grain relative overflow-hidden border border-line bg-paper">
        <GiftRibbon className="end-[3%] hidden xl:block" strip="w-5" bowSize="w-32" />

        {/* الستيكرز */}
        {stickers.slice(0, spots.length).map((s, i) => {
          const spot = spots[i];
          return (
            <div key={s.src} className={`pointer-events-none absolute z-0 ${spot.pos}`} aria-hidden>
              <div className="animate-float" style={{ animationDelay: `${-i * 1.3}s` }}>
                <div className={`relative animate-drop-in ${spot.size}`} style={{ ["--r" as string]: spot.r, animationDelay: `${250 + i * 140}ms` }}>
                  <div className={`relative aspect-square overflow-hidden border-[5px] border-white shadow-[0_14px_26px_-14px_rgb(60_20_25/0.55)] sm:border-[6px] ${spot.round ? "rounded-full" : "rounded-[1.4rem]"}`}>
                    <Image src={s.src} alt="" fill sizes="140px" className="object-cover" priority={i < 2} />
                  </div>
                  {spot.round && s.chip && (
                    <span className={`absolute ${spot.chipAt} hidden rotate-[-4deg] rounded-full bg-white px-3 py-1 text-sm font-semibold whitespace-nowrap text-ink shadow-md sm:block`}>
                      {t(s.chip)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-32 pb-36 text-center sm:px-12 sm:py-24 lg:py-28">
          <Pill tone="blue">{t("هدايا متغلفة من براندات أسيوط")}</Pill>

          <h1 className="relative mt-6 pb-[0.55em] text-[clamp(3.6rem,12vw,8.5rem)] leading-[1.05] text-ink">
            <span className="animate-fade-up block">{t("هدية تفرّح")}</span>
            {/* الكلمة بخط الإيد معدية على العنوان */}
            <span className="absolute inset-x-0 -bottom-[0.12em] flex justify-center text-[0.6em] leading-[1.4]" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={words[word]}
                  className="block -rotate-6 font-script text-brand drop-shadow-[0_2px_0_var(--color-paper)]"
                  initial={{ y: "70%", opacity: 0, rotate: -14 }}
                  animate={{ y: 0, opacity: 1, rotate: -6 }}
                  exit={{ y: "-70%", opacity: 0, rotate: 2 }}
                  transition={{ duration: 0.6, ease }}
                >
                  {t(words[word])}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-lg leading-8 text-ink-2">
            {t("باكدجات متغلفة، بوكس على ذوقك، وهدايا من براندات أسيوط المحلية. بتوصل لحد البيت في اليوم والفترة اللي تختارها.")}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href={seasonHref} className="btn-primary">
              {t("اختار هديتك")}
            </Link>
            {showBox && (
              <Link href="/box" className="btn border border-ink/15 bg-bg text-ink hover:border-brand hover:text-brand">
                {t("اعمل البوكس بنفسك")}
              </Link>
            )}
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] text-ink-2">
            {["توصيل في نفس اليوم في أسيوط", "صورة الهدية قبل ما تخرج", "كارت برسالتك مع كل هدية"].map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Icon name="check" className="size-4 text-brand" />
                {t(x)}
              </li>
            ))}
          </ul>
          {seasonName && (
            <Link
              href={seasonHref}
              className="mt-7 inline-flex -rotate-2 animate-pop-in items-center gap-3 rounded-2xl bg-brand px-5 py-2.5 text-maroon-ink shadow-lg transition-transform [animation-delay:1.2s] hover:rotate-0"
            >
              <span className="text-sm">{seasonName}</span>
              {daysLeft !== null && <span className="tabular font-heading text-xl">{t("فاضل {n} يوم", { n: daysLeft })}</span>}
            </Link>
          )}
        </div>

      </div>
    </section>
  );
}
