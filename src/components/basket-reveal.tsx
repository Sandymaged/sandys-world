import Image from "next/image";

/*
 * «استني… إيه اللي جوه؟»: السلة السلك من فوق، والمنتجات متكومة جواها،
 * وكل حاجة عليها سهم مرسوم بالإيد واسم البراند والمنتج.
 * من غير hooks، فبيشتغل في صفحات السيرفر وجوه البوكس بيلدر كمان.
 * كل الأماكن محسوبة في مساحة إحداثيات واحدة: السلة في 0..100، والليبلز على الجنبين برا السلة،
 * فالـ SVG والصور والكلام بيتطابقوا.
 */

export interface BasketItem {
  key: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  quantity?: number;
}

type Spot = { x: number; y: number; r: number };

const X0 = -14; // أول اللوحة من الشمال (عمود الليبلز)
const BW = 128; // عرض اللوحة كلها
const H = 130;
const px = (x: number) => ((x - X0) / BW) * 100;

// أماكن المنتجات حسب عددها، وحجم كل كارت
const layouts: { w: number; spots: Spot[] }[] = [
  { w: 0, spots: [] },
  { w: 44, spots: [{ x: 50, y: 67, r: -4 }] },
  { w: 36, spots: [{ x: 39, y: 58, r: -7 }, { x: 61, y: 77, r: 6 }] },
  { w: 32, spots: [{ x: 36, y: 52, r: -6 }, { x: 64, y: 55, r: 7 }, { x: 50, y: 82, r: -3 }] },
  { w: 30, spots: [{ x: 36, y: 51, r: -6 }, { x: 64, y: 49, r: 8 }, { x: 37, y: 81, r: 5 }, { x: 63, y: 83, r: -5 }] },
  {
    w: 28,
    spots: [{ x: 34, y: 48, r: -7 }, { x: 64, y: 47, r: 8 }, { x: 31, y: 77, r: 5 }, { x: 51, y: 66, r: -3 }, { x: 69, y: 83, r: -6 }],
  },
  {
    w: 26,
    spots: [{ x: 32, y: 47, r: -8 }, { x: 56, y: 44, r: 6 }, { x: 70, y: 63, r: -5 }, { x: 33, y: 72, r: 6 }, { x: 53, y: 70, r: -4 }, { x: 45, y: 92, r: 4 }],
  },
  {
    w: 25,
    spots: [
      { x: 32, y: 46, r: -8 }, { x: 56, y: 43, r: 6 }, { x: 70, y: 61, r: -5 }, { x: 32, y: 70, r: 6 },
      { x: 52, y: 67, r: -4 }, { x: 40, y: 92, r: 4 }, { x: 66, y: 89, r: -7 },
    ],
  },
  {
    w: 24,
    spots: [
      { x: 31, y: 45, r: -8 }, { x: 54, y: 42, r: 6 }, { x: 71, y: 56, r: -5 }, { x: 31, y: 69, r: 6 },
      { x: 50, y: 63, r: -4 }, { x: 69, y: 78, r: 7 }, { x: 38, y: 92, r: 4 }, { x: 59, y: 93, r: -6 },
    ],
  },
];
const MAX = layouts.length - 1;

/** بيوزع الليبلز على العمود من غير ما يركبوا على بعض */
function spread(ys: number[], gap = 21, min = 22, max = 126) {
  const out = [...ys];
  for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i], i ? out[i - 1] + gap : min);
  for (let i = out.length - 1; i >= 0; i--) out[i] = Math.min(out[i], i < out.length - 1 ? out[i + 1] - gap : max);
  return out;
}

/** سهم بخط الإيد: بينزل من تحت الليبل ويلف لحد المنتج، ورأسه مفتوح. dir = ناحية السلة */
function arrowPath(sx: number, sy: number, ex: number, ey: number, dir: 1 | -1) {
  const c1x = sx + dir * 1.5;
  const c1y = sy + 11;
  const c2x = ex - dir * 10;
  const c2y = ey - 1;
  const a = Math.atan2(ey - c2y, ex - c2x);
  const len = 2.6;
  const h1 = `${ex - len * Math.cos(a - 0.5)} ${ey - len * Math.sin(a - 0.5)}`;
  const h2 = `${ex - len * Math.cos(a + 0.5)} ${ey - len * Math.sin(a + 0.5)}`;
  return { line: `M${sx} ${sy} C${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`, head: `M${h1} L${ex} ${ey} L${h2}` };
}

// على الأحمر كريمي، وفي الكروت الفاتحة بيتغير من برا بـ --basket-wire
const wire = "var(--basket-wire, #efe4d8)";

/** السلة السلك من فوق: الإيدين، والحيطان، والشبكة */
function BasketBack() {
  return (
    <g fill="none" style={{ stroke: wire }} strokeLinecap="round" strokeLinejoin="round" opacity="0.92">
      {/* الإيد اللي فوق */}
      <path d="M37 31 C 37 14, 63 14, 63 31" strokeWidth="1.3" />
      <path d="M40 31 C 40 18, 60 18, 60 31" strokeWidth="0.7" />
      {/* البرواز اللي برا والقاع */}
      <rect x="18" y="30" width="64" height="74" rx="5" strokeWidth="1.3" />
      <rect x="25" y="37" width="50" height="60" rx="3" strokeWidth="0.9" />
      {/* الحيطان المايلة */}
      <path d="M18.8 31 L25.5 37.5 M81.2 31 L74.5 37.5 M18.8 103 L25.5 96.5 M81.2 103 L74.5 96.5" strokeWidth="0.9" />
      {/* شبكة السلك */}
      <path
        d="M37 37 V97 M50 37 V97 M63 37 V97 M25 52 H75 M25 67 H75 M25 82 H75 M18 52 H25 M75 52 H82 M18 67 H25 M75 67 H82 M18 82 H25 M75 82 H82 M37 30 V37 M50 30 V37 M63 30 V37 M37 97 V104 M50 97 V104 M63 97 V104"
        strokeWidth="0.6"
      />
    </g>
  );
}

/** الحافة اللي قدام والإيد اللي تحت: بيترسموا فوق المنتجات عشان تحس إنها جوه السلة */
function BasketFront() {
  return (
    <g fill="none" style={{ stroke: wire }} strokeLinecap="round" opacity="0.95">
      <path d="M18 98 V99 Q18 104 23 104 H77 Q82 104 82 99 V98" strokeWidth="1.3" />
      <path d="M37 104 C 37 119, 63 119, 63 104" strokeWidth="1.3" />
      <path d="M40 104 C 40 115, 60 115, 60 104" strokeWidth="0.7" />
    </g>
  );
}

function Tile({ it, s, w, i, more, priority }: { it: BasketItem; s: Spot; w: number; i: number; more: number; priority?: boolean }) {
  return (
    <div
      className="absolute animate-drop-in rounded-[5px] bg-[#fffdf8] p-[3%] shadow-[0_8px_14px_-6px_rgb(20_0_0/0.65)] transition-[left,top,width] duration-500"
      style={{
        left: `${px(s.x - w / 2)}%`,
        top: `${((s.y - w / 2) / H) * 100}%`,
        width: `${(w / BW) * 100}%`,
        ["--r" as string]: `${s.r}deg`,
        animationDelay: `${120 + i * 90}ms`,
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[3px] bg-blush">
        {it.image && (
          <Image src={it.image} alt={it.name} fill sizes="160px" priority={priority} unoptimized={it.image.startsWith("/media/")} className="object-cover" />
        )}
        {more > 0 && <span className="absolute inset-0 grid place-items-center bg-maroon/70 font-heading text-lg text-white">+{more}</span>}
      </div>
      {(it.quantity ?? 1) > 1 && (
        <span className="tabular absolute -top-2 -end-2 grid size-6 place-items-center rounded-full bg-butter text-[11px] font-bold text-maroon shadow">
          ×{it.quantity}
        </span>
      )}
    </div>
  );
}

/** السلة والمنتجات. compact: من غير أسهم وليبلز، ومكبّرة على قد مربع (للكروت) */
export function Basket({ items, compact = false, priority }: { items: BasketItem[]; compact?: boolean; priority?: boolean }) {
  const shown = items.slice(0, MAX);
  const more = items.length - shown.length;
  const { w, spots } = layouts[shown.length];

  // كل منتج ليبله في الناحية الأقرب له، واللي في النص بيروح للناحية الأفضى
  const sides: (1 | -1)[] = [];
  let left = 0;
  let right = 0;
  spots.forEach((s) => {
    const side: 1 | -1 = s.x < 50 ? -1 : s.x > 50 ? 1 : left <= right ? -1 : 1;
    if (side < 0) left++;
    else right++;
    sides.push(side);
  });
  const labelY: number[] = [];
  for (const side of [-1, 1] as const) {
    const idx = spots.map((_, i) => i).filter((i) => sides[i] === side).sort((a, b) => spots[a].y - spots[b].y);
    // الليبل فوق والسهم نازل منه للمنتج
    spread(idx.map((i) => spots[i].y - 8)).forEach((y, k) => (labelY[idx[k]] = y));
  }

  const board = (
    <div className="relative w-full select-none" style={{ aspectRatio: `${BW} / ${H}` }}>
      <svg viewBox={`${X0} 0 ${BW} ${H}`} className="absolute inset-0 size-full" aria-hidden>
        <BasketBack />
      </svg>

      {shown.map((it, i) => (
        <Tile key={it.key} it={it} s={spots[i]} w={w} i={i} more={i === shown.length - 1 ? more : 0} priority={priority} />
      ))}

      <svg viewBox={`${X0} 0 ${BW} ${H}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        <BasketFront />
        {!compact &&
          shown.map((it, i) => {
            const s = spots[i];
            const side = sides[i];
            const a = arrowPath(side < 0 ? 1 : 99, labelY[i] + 2, s.x + side * (w / 2 - 1), s.y, side < 0 ? 1 : -1);
            return (
              <g key={it.key} fill="none" stroke="#fff6ec" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round">
                <path
                  d={a.line}
                  pathLength={1}
                  strokeDasharray="1"
                  className="animate-[draw_0.9s_ease-out_both]"
                  style={{ animationDelay: `${500 + i * 120}ms` }}
                />
                <path d={a.head} className="animate-fade-up" style={{ animationDelay: `${1100 + i * 120}ms` }} />
              </g>
            );
          })}
      </svg>

      {!compact &&
        shown.map((it, i) => {
          const leftSide = sides[i] < 0;
          return (
            <p
              key={it.key}
              className="absolute animate-fade-up text-center text-[10px] leading-tight text-[#fff6ec] sm:text-xs"
              style={{
                [leftSide ? "left" : "right"]: "0",
                width: `${(27 / BW) * 100}%`,
                top: `${(labelY[i] / H) * 100}%`,
                translate: "0 -100%",
                animationDelay: `${700 + i * 120}ms`,
              }}
            >
              {it.brand && <span className="line-clamp-1 font-bold tracking-wide uppercase">{it.brand}</span>}
              <span className={it.brand ? "line-clamp-1 opacity-85" : "line-clamp-2 font-bold"}>{it.name}</span>
            </p>
          );
        })}
    </div>
  );

  if (!compact) return board;
  // في الكارت: المربع بيقص على السلة بس ويكبّرها
  return (
    <div className="relative aspect-square overflow-hidden">
      {/* بيبان من x=8 لـ x=92 تقريباً، فالسلة بتملا المربع */}
      <div className="absolute" style={{ width: `${(BW / 84) * 100}%`, left: `${(-(8 - X0) / 84) * 100}%`, top: `${(-25 / 84) * 100}%` }}>
        {board}
      </div>
    </div>
  );
}

/** الكارت الأحمر الكامل زي البوستر: عنوان فوق، والسلة، وتحت أي حاجة (سعر أو زرار) */
export function BasketReveal({
  items,
  title,
  subtitle,
  children,
  className = "",
}: {
  items: BasketItem[];
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[1.25rem] bg-[#8f1b22] bg-[radial-gradient(circle_at_50%_38%,rgb(255_255_255/0.12),transparent_62%)] px-3 pt-7 pb-6 text-center text-[#fff6ec] shadow-[0_24px_40px_-26px_rgb(60_10_15/0.8)] sm:px-5 ${className}`}
    >
      <h2 className="mx-auto max-w-[16ch] font-heading text-3xl leading-[1.1] uppercase sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm tracking-wide uppercase opacity-90">{subtitle}</p>}
      <div className="mx-auto mt-1 max-w-md">
        <Basket items={items} />
      </div>
      {children && <div className="mt-1 flex flex-col items-center gap-3">{children}</div>}
    </section>
  );
}
