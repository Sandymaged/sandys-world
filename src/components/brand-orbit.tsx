import Image from "next/image";
import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import type { Brand } from "@/lib/types";

/*
 * براندات أسيوط بتطفو حوالين صورة هدية في النص: كل براند دايرة باسمه (أو صورته)،
 * ألوانها بتتبادل، وبتطفو بمواعيد مختلفة. على الموبايل الدواير بتترص تحت الصورة.
 */

const spots = [
  "top-[4%] start-[8%]",
  "top-[0%] end-[14%]",
  "top-[30%] start-[0%]",
  "top-[28%] end-[2%]",
  "bottom-[18%] start-[6%]",
  "bottom-[14%] end-[8%]",
  "bottom-[0%] start-[30%]",
  "bottom-[2%] end-[32%]",
];
const tones = ["bg-brand text-white", "bg-blue-soft text-blue-deep", "bg-blush text-brand-dark", "bg-blue-deep text-white"];

function Bubble({ b, i }: { b: Brand; i: number }) {
  return (
    <Link
      href={`/brands/${b.slug}`}
      className={`group grid size-24 place-items-center overflow-hidden rounded-full border-4 border-paper p-2 text-center shadow-[0_14px_24px_-16px_rgb(60_20_25/0.6)] transition-transform hover:scale-105 sm:size-28 ${tones[i % tones.length]}`}
    >
      <span className="font-heading text-[15px] leading-tight sm:text-base">{b.name}</span>
    </Link>
  );
}

export async function BrandOrbit({ brands, image }: { brands: Brand[]; image: string | null }) {
  const t = await getT();
  const list = brands.slice(0, spots.length);
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* الكمبيوتر: الدواير حوالين الصورة */}
      <div className="relative hidden aspect-[16/10] md:block">
        <div className="absolute inset-x-[28%] inset-y-[8%] -rotate-2">
          <div className="polaroid h-full">
            <div className="relative h-[86%] overflow-hidden bg-surface">
              {image && <Image src={image} alt="" fill sizes="420px" className="object-cover" />}
            </div>
            <p className="mt-2 text-center font-script text-xl text-ink-2">{t("معمول بإيد ناس من بلدنا")}</p>
          </div>
        </div>
        {list.map((b, i) => (
          <div key={b.id} className={`absolute ${spots[i]}`}>
            <div className="animate-float" style={{ animationDelay: `${-i * 0.9}s` }}>
              <div className="reveal-pop" style={{ ["--r" as string]: `${i % 2 ? 6 : -6}deg` }}>
                <Bubble b={b} i={i} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* الموبايل */}
      <div className="md:hidden">
        {image && (
          <div className="polaroid mx-auto w-64 -rotate-2">
            <div className="relative aspect-[4/3] overflow-hidden bg-surface">
              <Image src={image} alt="" fill sizes="256px" className="object-cover" />
            </div>
            <p className="mt-2 text-center font-script text-lg text-ink-2">{t("معمول بإيد ناس من بلدنا")}</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {list.map((b, i) => (
            <div key={b.id} className="reveal-pop" style={{ ["--r" as string]: `${i % 2 ? 5 : -5}deg` }}>
              <Bubble b={b} i={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
