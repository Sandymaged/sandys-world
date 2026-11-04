"use client";

import { GiftRibbon } from "./decor";

/*
 * عناصر الـ scrapbook بنسخة هادية: شريط لاصق صغير، ورقة ملاحظات، بولارويد، وعناوين.
 * الميل خفيف والزينة قليلة عشان المنتجات هي اللي تبان.
 */

/** شريط لاصق صغير فوق صورة أو ورقة */
export function Tape({ className = "", tone = "pink" }: { className?: string; tone?: "pink" | "lilac" | "butter" | "mint" }) {
  const colors = {
    pink: "bg-[#f4b9c9]/60",
    lilac: "bg-[#c9cff5]/60",
    butter: "bg-[#fbe6a2]/70",
    mint: "bg-[#c8ead6]/70",
  };
  return <span aria-hidden className={`pointer-events-none absolute z-10 h-4 w-14 ${colors[tone]} ${className}`} />;
}

/** ورقة ملاحظات بلون هادي */
export function StickyNote({
  children,
  tone = "butter",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "butter" | "pink" | "lilac" | "mint" | "white";
  rotate?: number;
  delay?: number;
  className?: string;
}) {
  const bg = {
    butter: "bg-[#fff6d6]",
    pink: "bg-[#fdebef]",
    lilac: "bg-[#eef0fc]",
    mint: "bg-[#e6f5ec]",
    white: "bg-[#fffdf8]",
  };
  return (
    <div className="reveal">
      <div className={`relative rounded-xl p-4 ${bg[tone]} ${className}`}>{children}</div>
    </div>
  );
}

/** صورة بولارويد: إطار أبيض وميل بسيط */
export function Polaroid({
  children,
  caption,
  rotate = -3,
  delay = 0,
  tape = "pink",
  className = "",
}: {
  children: React.ReactNode;
  caption?: string;
  rotate?: number;
  delay?: number;
  tape?: "pink" | "lilac" | "butter" | "mint" | null;
  className?: string;
}) {
  return (
    <div
      className={`animate-drop-in ${className}`}
      // الميل ثلث اللي كان، عشان الشكل يفضل مرتب
      style={{ "--r": `${(rotate / 3).toFixed(2)}deg`, animationDelay: `${delay}s` } as React.CSSProperties}
    >
      <figure className="polaroid relative transition-transform duration-300 hover:-translate-y-1">
        {tape && <Tape tone={tape} className="-top-2 left-1/2 -translate-x-1/2" />}
        {children}
        {caption && <figcaption className="mt-2 text-center font-script text-lg leading-none text-ink-2">{caption}</figcaption>}
      </figure>
    </div>
  );
}

/** شريط كلام بيلف */
export function TextMarquee({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <div className={`group overflow-hidden ${className}`} aria-label={items.join(" · ")}>
      <div className="marquee flex w-max animate-[marquee_34s_linear_infinite] group-hover:[animation-play-state:paused]" aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {items.map((it) => (
              <span key={it} className="flex items-center gap-5 px-5 font-script text-2xl whitespace-nowrap">
                {it}
                <span className="text-base not-italic">·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const headerBg = {
  pink: "bg-blush",
  lilac: "bg-blue-soft",
  grid: "bg-paper",
  stripes: "bg-blush",
};

/** هيدر الصفحات: صفحة مدورة بلون هادي، وعنوان واضح في النص */
export function PageHeader({
  kicker,
  title,
  subtitle,
  tone = "pink",
  children,
  aside,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  tone?: keyof typeof headerBg;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="container-x pt-5 sm:pt-8">
      <div className={`panel relative overflow-hidden ${headerBg[tone]} px-6 py-10 sm:px-12 sm:pt-28 sm:pb-14`}>
        {/* الشريطة الكاروهات على الجنب: توقيع الهوية */}
        <GiftRibbon className="end-14 hidden sm:block" strip="w-5" bowSize="w-32" cross />
        <div className="flex items-center justify-center gap-8">
          <div className="w-full max-w-2xl animate-fade-up text-center">
            {kicker && <Pill>{kicker}</Pill>}
            <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
            {subtitle && <p className="mx-auto mt-3 max-w-lg text-lg leading-8 text-ink-2">{subtitle}</p>}
            {children}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}

/** ليبل صغير مدور فوق العناوين */
export function Pill({ children, tone = "brand", className = "" }: { children: React.ReactNode; tone?: "brand" | "blue" | "light" | "paper"; className?: string }) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    blue: "bg-blue-soft text-blue-deep",
    light: "bg-white/15 text-maroon-ink",
    paper: "bg-paper text-blue-deep",
  };
  return <span className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}

/** عنوان قسم: ليبل صغير فوق، وعنوان كبير، وسطر شرح اختياري */
export function ScrapTitle({
  kicker,
  title,
  subtitle,
  className = "",
  ink = "text-ink",
  kickerTone = "brand",
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  className?: string;
  ink?: string;
  kickerInk?: string;
  kickerTone?: "brand" | "blue" | "light";
}) {
  return (
    <div className={`reveal text-center ${className}`}>
      {kicker && <Pill tone={kickerTone}>{kicker}</Pill>}
      <h2 className={`mt-3 text-4xl leading-tight sm:text-5xl ${ink}`}>{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-lg leading-8 text-ink-2">{subtitle}</p>}
    </div>
  );
}

/** اقتباس كبير بين الأقسام: علامة تنصيص، والجملة بخط مكتوب باليد */
export function Quote({ children, by, tone = "paper" }: { children: React.ReactNode; by?: string; tone?: "paper" | "red" | "blue" }) {
  const tones = {
    paper: "bg-paper text-ink",
    red: "bg-brand text-maroon-ink",
    blue: "bg-blue text-white",
  };
  return (
    <figure className={`reveal panel relative mx-auto max-w-4xl overflow-hidden px-8 py-12 text-center sm:px-16 sm:py-16 ${tones[tone]}`}>
      {/* دواير هادية بتطفو ورا الكلام */}
      <span aria-hidden className="absolute -top-10 -end-8 size-36 animate-float rounded-full bg-current opacity-[0.07]" />
      <span aria-hidden className="absolute -bottom-12 start-[12%] size-28 animate-float rounded-full bg-current opacity-[0.06] [animation-delay:-2.5s]" />
      <span aria-hidden className="absolute top-[30%] start-[4%] size-10 animate-float rounded-full bg-current opacity-[0.08] [animation-delay:-5s]" />
      <span aria-hidden className="absolute top-4 start-6 font-heading text-7xl leading-none opacity-25 sm:text-8xl">”</span>
      <blockquote className="relative font-script text-3xl leading-[1.6] sm:text-4xl">{children}</blockquote>
      {by && <figcaption className="relative mt-5 text-sm font-semibold tracking-wide opacity-80">{by}</figcaption>}
    </figure>
  );
}
