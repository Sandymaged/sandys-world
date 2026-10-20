"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

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

// فيونكة القماش (مساحة 200×170، العقدة عند 100,58): الحلقات والأطراف "شريطة" بعرض ثابت
// (خط تخين متلوّن بالكاروهات) عشان تبان قماش ملفوف وفيه فتحة في نص كل حلقة زي الفيونكة الحقيقية
const ribbonPath = {
  loopL: "M100 58 C 76 28, 30 6, 15 30 C 3 52, 32 78, 100 58",
  loopR: "M100 58 C 124 28, 170 6, 185 30 C 197 52, 168 78, 100 58",
  tailL: "M97 66 C 90 94, 72 122, 52 160",
  tailR: "M103 66 C 113 96, 128 124, 142 162",
};

/**
 * فيونكة قماش كاروهات بتتربط وإحنا بنفتح الصفحة: الطرفين بينزلوا، بعدين الحلقتين بيتفتحوا واحدة ورا التانية،
 * وفي الآخر العقدة بتتشد. (CSS بس، والحركة بتتلغي مع "تقليل الحركة")
 */
export function TiedBow({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const check = `url(#check-${id})`;
  const shade = `url(#shade-${id})`;
  // الشريطة: حرف غامق تحت، وفوقه الكاروهات، وفوقها ضل عند العقدة
  const band = (d: string, w: number) => (
    <>
      <path d={d} stroke="#7a0d16" strokeWidth={w + 3} />
      <path d={d} stroke={check} strokeWidth={w} />
      <path d={d} stroke={shade} strokeWidth={w} />
    </>
  );
  return (
    <svg viewBox="0 0 200 175" className={`bow-tie overflow-visible ${className}`} aria-hidden>
      <defs>
        <pattern id={`check-${id}`} width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <rect width="11" height="11" fill="#fff8f6" />
          <rect width="5.5" height="11" fill="#c21f2c" opacity="0.6" />
          <rect width="11" height="5.5" fill="#c21f2c" opacity="0.6" />
        </pattern>
        <radialGradient id={`shade-${id}`} cx="100" cy="58" r="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3d0509" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="#3d0509" stopOpacity="0.12" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#3d0509" stopOpacity="0.15" />
        </radialGradient>
        {/* قصّة V في آخر كل طرف */}
        <mask id={`cut-${id}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="220">
          <rect x="-20" y="-20" width="240" height="220" fill="#fff" />
          <polygon points="58.5,147.6 61.6,171.8 36.8,158.8" fill="#000" />
          <polygon points="137.2,148.9 157.2,162.8 131,172.4" fill="#000" />
        </mask>
      </defs>
      <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
        <g mask={`url(#cut-${id})`}>
          <g className="tail tail-l">{band(ribbonPath.tailL, 21)}</g>
          <g className="tail tail-r">{band(ribbonPath.tailR, 21)}</g>
        </g>
        <g className="loop loop-l">{band(ribbonPath.loopL, 23)}</g>
        <g className="loop loop-r">{band(ribbonPath.loopR, 23)}</g>
        <g className="knot">
          <rect x="87" y="44" width="26" height="28" rx="9" fill={check} stroke="#7a0d16" strokeWidth="1.6" />
          <rect x="87" y="44" width="26" height="28" rx="9" fill="#3d0509" opacity="0.22" />
          <path d="M92 50 C 98 47, 104 47, 108 50" stroke="#fff" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/** الشريطة الكاروهات اللي نازلة على طرف الصفحة وفوقها الفيونكة. مكانها بيتحدد من className */
export function GiftRibbon({ className = "", strip = "w-6", bowSize = "w-40" }: { className?: string; strip?: string; bowSize?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-y-0 z-10 ${className}`}>
      <span className={`ribbon ribbon-drop block h-full ${strip}`} />
      <TiedBow className={`absolute top-6 left-1/2 -translate-x-1/2 drop-shadow-[0_8px_8px_rgb(60_10_15/0.28)] ${bowSize}`} />
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
