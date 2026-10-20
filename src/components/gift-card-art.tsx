import type { GiftCardDesign } from "@/lib/gift-card";

const looks: Record<GiftCardDesign, { bg: string; ink: string; dots?: string }> = {
  classic: { bg: "#f3d5db", ink: "#2e2421" },
  birthday: { bg: "#fbe7b5", ink: "#8f1b22", dots: "#e8899a" },
  bridal: { bg: "#f6f0e6", ink: "#a8864f" },
  graduation: { bg: "#dbe5f4", ink: "#2f4a7a" },
};

/** شريطة وفيونكة بخط مزدوج (خط غامق وجواه خط بلون الكارت) زي الرسم بالإيد */
function RibbonBow({ ink, bg }: { ink: string; bg: string }) {
  const paths = [
    // الشريطة اللي نازلة من فوق للفيونكة
    "M150 -10 C 170 40, 175 70, 120 105",
    // الحلقة الكبيرة فوق
    "M120 105 C 40 60, 20 -20, 95 -15 C 150 -10, 160 60, 120 105",
    // الحلقة اللي على الشمال
    "M120 105 C 60 130, -10 120, 5 85 C 20 50, 90 80, 120 105",
    // الطرفين النازلين
    "M120 105 C 105 150, 60 190, 45 260",
    "M120 105 C 150 150, 140 200, 175 260",
    // الشريطة اللي رايحة يمين على عرض الكارت
    "M120 105 C 200 120, 300 95, 420 120",
  ];
  return (
    <svg viewBox="0 0 420 260" className="absolute inset-0 size-full" preserveAspectRatio="xMinYMin slice" aria-hidden>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {paths.map((d) => (
          <path key={d} d={d} stroke={ink} strokeWidth="9" />
        ))}
        {paths.map((d) => (
          <path key={`i${d}`} d={d} stroke={bg} strokeWidth="4.5" />
        ))}
        <ellipse cx="120" cy="105" rx="9" ry="7" fill={bg} stroke={ink} strokeWidth="3" />
      </g>
    </svg>
  );
}

/**
 * الكارت نفسه (بنسبة كارت البنك). نفس الشكل في صفحة الشراء والرئيسية وصفحة الطلب.
 * المبلغ والأسامي اختيارية؛ الكود بيظهر بس بعد الدفع.
 */
export function GiftCardArt({
  design,
  amount,
  amountLabel,
  title,
  storeName,
  toName,
  code,
  className = "",
}: {
  design: GiftCardDesign;
  amount?: number;
  amountLabel?: string;
  title: string;
  storeName: string;
  toName?: string;
  code?: string | null;
  className?: string;
}) {
  const l = looks[design];
  return (
    <div
      className={`relative aspect-[1.586] overflow-hidden rounded-[1.4rem] shadow-[0_30px_50px_-30px_rgb(60_30_20/0.55)] ${className}`}
      style={{
        backgroundColor: l.bg,
        backgroundImage: l.dots ? `radial-gradient(${l.dots} 2px, transparent 2.5px)` : undefined,
        backgroundSize: l.dots ? "26px 26px" : undefined,
      }}
    >
      <RibbonBow ink={l.ink} bg={l.bg} />
      {/* الأماكن ثابتة (شمال/يمين) عشان الكلام ميركبش على الشريطة في العربي والإنجليزي */}
      <div className="absolute inset-0" style={{ color: l.ink }}>
        <p className="absolute top-[36%] right-[6%] left-[38%] text-center font-script text-[clamp(1.5rem,6.5vw,3rem)] leading-none">{title}</p>
        <div className="absolute bottom-[8%] left-[42%] max-w-[34%]" dir="auto">
          {toName && <p className="truncate text-[clamp(0.7rem,2.2vw,0.95rem)] opacity-80">{toName}</p>}
          {amount != null && <p className="tabular text-[clamp(0.95rem,3vw,1.35rem)] font-semibold tracking-wide">{amountLabel ?? amount}</p>}
          {code && (
            <p className="tabular mt-1 text-[clamp(0.7rem,2.2vw,0.95rem)] font-bold tracking-[0.14em] whitespace-nowrap" dir="ltr">
              {code}
            </p>
          )}
        </div>
        <p className="absolute right-[6%] bottom-[8%] font-script text-[clamp(1.1rem,4vw,1.8rem)] leading-none">{storeName}</p>
      </div>
    </div>
  );
}
