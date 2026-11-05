import type { GiftCardDesign } from "@/lib/gift-card";

export const giftCardLooks: Record<GiftCardDesign, { bg: string; ink: string; dots?: string }> = {
  classic: { bg: "#f3d5db", ink: "#2e2421" },
  birthday: { bg: "#fbe7b5", ink: "#8f1b22", dots: "#e8899a" },
  bridal: { bg: "#f6f0e6", ink: "#a8864f" },
  graduation: { bg: "#dbe5f4", ink: "#2f4a7a" },
};
const looks = giftCardLooks;

/** خطوط الشريطة والفيونكة (مساحة 420×260)، والعقدة عند 120,105 */
export const ribbonPaths = [
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

/** شريطة وفيونكة بخط مزدوج (خط غامق وجواه خط بلون الكارت) زي الرسم بالإيد */
function RibbonBow({ ink, bg }: { ink: string; bg: string }) {
  const paths = ribbonPaths;
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
      // @container: مقاس الكلام بيتحسب من عرض الكارت نفسه (cqw)، فالكارت الصغير كلامه صغير ومش بيركب على بعضه
      className={`@container relative aspect-[1.586] overflow-hidden rounded-[1.4rem] shadow-[0_30px_50px_-30px_rgb(60_30_20/0.55)] ${className}`}
      style={{
        backgroundColor: l.bg,
        backgroundImage: l.dots ? `radial-gradient(${l.dots} 2px, transparent 2.5px)` : undefined,
        backgroundSize: l.dots ? "26px 26px" : undefined,
      }}
    >
      <RibbonBow ink={l.ink} bg={l.bg} />
      {/* الأماكن ثابتة (شمال/يمين) عشان الكلام ميركبش على الشريطة في العربي والإنجليزي */}
      <div className="absolute inset-0" style={{ color: l.ink }}>
        <p className="absolute top-[40%] right-[6%] left-[38%] text-center font-script text-[11cqw] leading-tight whitespace-nowrap">{title}</p>
        {/* لمين والمبلغ والكود: تحت على اليمين بعيد عن الشريطة، ومتظبطين على نفس الحافة */}
        <div className="absolute right-[6%] bottom-[8%] flex max-w-[50%] flex-col items-end" dir="ltr">
          {toName && <p className="max-w-full truncate text-[3.2cqw] leading-snug opacity-80" dir="auto">{toName}</p>}
          {amount != null && <p className="tabular text-[4.8cqw] leading-tight font-semibold tracking-wide" dir="auto">{amountLabel ?? amount}</p>}
          {code && (
            // الكود في كبسولة متقطعة زي الكوبون
            <p
              className="tabular mt-[1.4cqw] rounded-full border-[0.25cqw] border-dashed bg-[#fffdf9]/75 px-[2.2cqw] py-[1cqw] text-[2.6cqw] leading-none font-bold tracking-[0.12em] whitespace-nowrap"
              style={{ borderColor: l.ink }}
            >
              {code}
            </p>
          )}
        </div>
        {/* اسم المتجر فوق على اليمين (المساحة اللي تحت للمبلغ والكود) */}
        <p className="absolute top-[7%] right-[6%] font-script text-[6cqw] leading-none" dir="ltr">{storeName}</p>
      </div>
    </div>
  );
}
