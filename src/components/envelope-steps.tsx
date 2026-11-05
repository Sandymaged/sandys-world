"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { Bow } from "./decor";

/**
 * خطوات «إزاي بتوصل الهدية» كجوابات حمرا مقفولة بختم.
 * لما تدوس على جواب: الغطا بيتقلب لفوق، والكارت بيطلع منه بالخطوة. ودوسة تانية بتقفله.
 */
export function EnvelopeSteps({ steps }: { steps: { title: string; body: string }[] }) {
  const t = useT();
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div>
      <p className="mb-8 text-center font-script text-xl text-blue-deep">{t("دوس على أي جواب يتفتح")}</p>
      <ol className="reveal-stagger grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => {
          const isOpen = open.has(i);
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-label={isOpen ? s.title : t("افتح الخطوة {n}", { n: i + 1 })}
                className="group relative mx-auto block w-full max-w-[18rem] overflow-hidden pt-[36%] text-center [perspective:900px]"
              >
                <div className="relative aspect-[4/3] transition-transform duration-300 group-hover:-translate-y-1">
                  {/* ضهر الظرف */}
                  <div className="absolute inset-0 rounded-lg bg-[#841a24]" />

                  {/* الكارت: مستخبي جوه، وبيطلع بعد ما الغطا يتفتح */}
                  <div
                    className={`absolute inset-x-[7%] bottom-[5%] z-10 h-[118%] rounded-md bg-paper px-4 pt-4 shadow-md transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "translate-y-0 delay-300" : "translate-y-full"}`}
                  >
                    <span className="tabular font-heading text-3xl leading-none text-brand">{i + 1}</span>
                    <p className="mt-1 font-heading text-lg leading-snug text-ink">{s.title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-2">{s.body}</p>
                  </div>

                  {/* جيب الظرف قدام الكارت */}
                  <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="absolute inset-0 z-[15] size-full" aria-hidden>
                    <path d="M0 150 L200 238 L400 150 L400 290 Q400 300 390 300 L10 300 Q0 300 0 290 Z" fill="var(--color-brand)" />
                    <path d="M0 150 L200 238 L400 150" fill="none" stroke="#7d1720" strokeWidth="3" opacity="0.5" />
                    <path d="M0 300 L170 214 M400 300 L230 214" stroke="#7d1720" strokeWidth="2" opacity="0.35" />
                  </svg>

                  {/* الغطا: مقفول لتحت فوق كل حاجة، ولما يتفتح بيتقلب لفوق ويبقى ورا الكارت (الترتيب: ضهر، غطا مفتوح، كارت، جيب، غطا مقفول، ختم) */}
                  <div
                    className={`absolute inset-x-0 top-0 h-[58%] origin-top transition-[transform,z-index] duration-500 ${isOpen ? "z-0 [transform:rotateX(180deg)]" : "z-20"}`}
                    style={{ transitionDelay: isOpen ? "0ms, 250ms" : "0ms, 0ms" }}
                  >
                    <div className="absolute inset-0 bg-maroon [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                  </div>

                  {/* ختم الشمع على طرف الغطا */}
                  <span
                    className={`absolute top-[58%] left-1/2 z-30 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper shadow transition-[opacity,scale] duration-300 ${isOpen ? "scale-75 opacity-0" : "group-hover:scale-110"}`}
                  >
                    <Bow className="w-7 text-brand" />
                  </span>

                  {/* رقم الخطوة على الجواب وهو مقفول */}
                  <span className={`absolute inset-x-0 bottom-3 z-30 font-heading text-lg text-maroon-ink transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`}>
                    {t("الخطوة {n}", { n: i + 1 })}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
