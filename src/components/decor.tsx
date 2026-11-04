"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/* زينة بأسلوب ورق الدعوات: الفيونكة، والشريطة الكاروهات، وإطار متموج */

// شكل الفيونكة: حلقتين، وطرفين مقصوصين V، وعقدة في النص (مساحة 120×100)
const bow = {
  loopL: "M60 36 C 44 12, 12 4, 8 24 C 5 42, 34 48, 60 36 Z",
  loopR: "M60 36 C 76 12, 108 4, 112 24 C 115 42, 86 48, 60 36 Z",
  foldL: "M60 36 C 46 26, 26 22, 15 26 C 25 35, 44 39, 60 36 Z",
  foldR: "M60 36 C 74 26, 94 22, 105 26 C 95 35, 76 39, 60 36 Z",
  tailL: "M55 40 C 50 58, 42 76, 31 96 L 40 91 L 46 99 C 54 80, 60 60, 63 42 Z",
  tailR: "M65 40 C 70 58, 78 76, 89 96 L 80 91 L 74 99 C 66 80, 60 60, 57 42 Z",
};

/** فيونكة مليانة بلون الخط (currentColor) وفيها ضل خفيف جوه الحلقات */
export function Bow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} fill="currentColor" aria-hidden>
      <path d={bow.tailL} />
      <path d={bow.tailR} />
      <path d={bow.loopL} />
      <path d={bow.loopR} />
      <path d={bow.foldL} fill="#000" opacity="0.18" />
      <path d={bow.foldR} fill="#000" opacity="0.18" />
      <path d="M18 18 C 28 12, 42 16, 52 28 M102 18 C 92 12, 78 16, 68 28" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <rect x="51" y="28" width="18" height="17" rx="6" />
      <rect x="51" y="28" width="18" height="17" rx="6" fill="#000" opacity="0.12" />
    </svg>
  );
}

// فيونكة بأربع حلقات زي فيونكة الورد (مساحة 240×210، العقدة عند 120,86)
const fourLoop = {
  backL: "M120 84 C 104 46, 70 18, 52 32 C 38 44, 52 76, 120 84 Z",
  backR: "M120 84 C 136 46, 170 18, 188 32 C 202 44, 188 76, 120 84 Z",
  frontL: "M120 86 C 92 66, 40 62, 30 86 C 22 108, 60 120, 120 86 Z",
  frontR: "M120 86 C 148 66, 200 62, 210 86 C 218 108, 180 120, 120 86 Z",
  tailL: "M114 96 C 108 130, 96 166, 78 198 L 92 190 L 100 204 C 116 170, 124 134, 124 98 Z",
  tailR: "M126 96 C 136 130, 150 164, 172 194 L 158 188 L 152 202 C 132 168, 122 132, 116 98 Z",
};

/** نسبة مكان العقدة من عرض الفيونكة (عشان الشريطة اللي بالعرض تعدي من تحتها بالظبط) */
export const BOW_KNOT_Y = (86 / 240) as number;

/**
 * الفيونكة بأربع حلقات، أحمر سادة بنفس لون خيط اللوجو، وبتتربط وإحنا بنفتح الصفحة:
 * الطرفين بينزلوا، بعدين الحلقات بتتفتح، وفي الآخر العقدة بتتشد. (CSS بس، والحركة بتتلغي مع "تقليل الحركة")
 */
export function TiedBow({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const shade = `url(#bow-shade-${id})`;
  const loop = (d: string) => (
    <>
      <path d={d} fill="var(--color-brand)" stroke="#6e1018" strokeWidth="2.2" strokeLinejoin="round" />
      <path d={d} fill={shade} />
    </>
  );
  return (
    <svg viewBox="0 0 240 210" className={`bow-tie overflow-visible ${className}`} aria-hidden>
      <defs>
        <radialGradient id={`bow-shade-${id}`} cx="50%" cy="45%" r="62%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#3d0509" stopOpacity="0.38" />
        </radialGradient>
      </defs>
      <g className="tail tail-l">{loop(fourLoop.tailL)}</g>
      <g className="tail tail-r">{loop(fourLoop.tailR)}</g>
      <g className="loop loop-l">{loop(fourLoop.backL)}</g>
      <g className="loop loop-r">{loop(fourLoop.backR)}</g>
      <g className="loop loop-l">
        {loop(fourLoop.frontL)}
        <path d="M112 86 C 86 80, 56 80, 40 88" fill="none" stroke="#3d0509" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      </g>
      <g className="loop loop-r">
        {loop(fourLoop.frontR)}
        <path d="M128 86 C 154 80, 184 80, 200 88" fill="none" stroke="#3d0509" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      </g>
      <g className="knot">
        <circle cx="120" cy="86" r="15" fill="var(--color-brand)" stroke="#6e1018" strokeWidth="2.2" />
        <circle cx="120" cy="86" r="15" fill={shade} />
        <path d="M111 80 C 116 76, 123 76, 128 79" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const tw = (cls: string, fallback: number) => {
  const m = /w-(\d+(?:\.\d+)?)/.exec(cls);
  return m ? Number(m[1]) * 0.25 : fallback;
};

/**
 * الشريطة الكاروهات اللي نازلة على طرف الصفحة وفوقها الفيونكة. مكانها بيتحدد من className.
 * `cross`: شريطة تانية بالعرض بتعدي من تحت الفيونكة (زي الهدية المربوطة)، والأب لازم يكون relative.
 * الحركة بتبدأ بعد ما الصفحة تجهز، وبتتعاد مع كل فتح للصفحة أو تنقّل بين الصفحات.
 */
export function GiftRibbon({ className = "", strip = "w-6", bowSize = "w-40", cross = false }: { className?: string; strip?: string; bowSize?: string; cross?: boolean }) {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const stripRem = tw(strip, 1.5);
  // العقدة على BOW_KNOT_Y من عرض الفيونكة، والفيونكة نازلة 1.5rem من فوق
  const knot = 1.5 + tw(bowSize, 10) * BOW_KNOT_Y;
  const hide = className.includes("hidden") ? className.match(/\b(?:sm|md|lg|xl):block\b/)?.[0] ?? "" : "";
  return (
    <div key={path} className={`contents ${ready ? "" : "ribbon-wait"}`}>
      {cross && (
        <div aria-hidden className={`pointer-events-none absolute inset-x-0 z-[9] ${hide ? `hidden ${hide}` : ""}`} style={{ top: `${knot - stripRem / 2}rem` }}>
          <span
            className="ribbon ribbon-slide block w-full"
            style={{ height: `${stripRem}rem`, backgroundImage: "linear-gradient(rgb(255 255 255 / 0) 20%, rgb(255 255 255 / 0.18) 50%, rgb(255 255 255 / 0) 80%)", boxShadow: "inset 0 2px 0 rgb(110 16 24 / 0.55), inset 0 -2px 0 rgb(110 16 24 / 0.55), 0 4px 10px -4px rgb(60 10 15 / 0.35)" }}
          />
        </div>
      )}
      <div aria-hidden className={`pointer-events-none absolute inset-y-0 z-10 ${className}`}>
        <span className={`ribbon ribbon-drop block h-full ${strip}`} />
        <TiedBow className={`absolute top-6 left-1/2 -translate-x-1/2 drop-shadow-[0_8px_8px_rgb(60_10_15/0.28)] ${bowSize}`} />
      </div>
    </div>
  );
}

/** مسار مستطيل بزوايا مدوّرة، وحافته متموجة بعدد موجات صحيح عشان اللفة تقفل نضيف */
function wavyPath(w: number, h: number, pad: number, amp: number, wave: number) {
  const x0 = pad, y0 = pad, x1 = w - pad, y1 = h - pad;
  const r = Math.min(x1 - x0, y1 - y0) * 0.22;
  const pts: { x: number; y: number; nx: number; ny: number }[] = [];
  const line = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number) => {
    const len = Math.hypot(bx - ax, by - ay);
    for (let d = 0; d < len; d += 2) pts.push({ x: ax + ((bx - ax) * d) / len, y: ay + ((by - ay) * d) / len, nx, ny });
  };
  const arc = (cx: number, cy: number, a0: number) => {
    for (let a = 0; a < Math.PI / 2; a += 2 / r) {
      const t = a0 + a;
      pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t), nx: Math.cos(t), ny: Math.sin(t) });
    }
  };
  line(x0 + r, y0, x1 - r, y0, 0, -1);
  arc(x1 - r, y0 + r, -Math.PI / 2);
  line(x1, y0 + r, x1, y1 - r, 1, 0);
  arc(x1 - r, y1 - r, 0);
  line(x1 - r, y1, x0 + r, y1, 0, 1);
  arc(x0 + r, y1 - r, Math.PI / 2);
  line(x0, y1 - r, x0, y0 + r, -1, 0);
  arc(x0 + r, y0 + r, Math.PI);

  let total = 0;
  const s = pts.map((p, i) => (i === 0 ? 0 : (total += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y))));
  const k = Math.max(6, Math.round(total / wave));
  return (
    pts
      .map((p, i) => {
        const o = amp * Math.sin((2 * Math.PI * k * s[i]) / total);
        return `${i ? "L" : "M"}${(p.x + p.nx * o).toFixed(1)} ${(p.y + p.ny * o).toFixed(1)}`;
      })
      .join("") + "Z"
  );
}

/** إطار كريمي بحافة متموجة وخط أحمر، زي كارت الدعوة */
export function ScallopFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {size && (
        <svg className="pointer-events-none absolute inset-0 -z-0 size-full overflow-visible" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden>
          <path d={wavyPath(size.w, size.h, 8, 6, 64)} fill="var(--color-bg)" stroke="var(--color-brand)" strokeWidth="5" strokeLinejoin="round" />
          <path d={wavyPath(size.w, size.h, 20, 4, 64)} fill="none" stroke="var(--color-candy)" strokeWidth="1.2" strokeDasharray="1 6" strokeLinecap="round" />
        </svg>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
