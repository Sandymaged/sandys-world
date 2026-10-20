"use client";

import { motion } from "motion/react";

/**
 * بيظهر لما يدخل الشاشة (fade-up مربوط بالسكرول، CSS بس).
 * مش بيستنى الجافاسكريبت: لو المتصفح مبيدعمش الحركة، أو الصفحة لسه بتتحمل، المحتوى ظاهر عادي.
 * delay و y فاضلين عشان التوافق، والتتابع بيجي طبيعي من مكان كل كارت في الصفحة.
 */
export function Reveal({
  children,
  className = "",
  outerClassName = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  /** على العنصر اللي جوه (ميل، hover، ألوان): حركة الظهور بتبقى على الغلاف بره فمش بتلغيهم */
  className?: string;
  /** على الغلاف بره (مكانه في الصف أو الشبكة) */
  outerClassName?: string;
}) {
  const fill = className.split(" ").includes("h-full") ? "h-full" : "";
  return (
    <div className={`reveal ${fill} ${outerClassName}`}>
      {className ? <div className={className}>{children}</div> : children}
    </div>
  );
}

/** خط متعرّج تحت عنوان القسم، بيترسم لما يظهر */
export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={`h-3 w-24 ${className}`} fill="none" aria-hidden>
      <path
        className="reveal-draw"
        d="M2 8 C 12 2, 22 2, 32 7 S 52 12, 62 7 S 82 2, 92 7 S 110 11, 118 5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
      />
    </svg>
  );
}

/** الكارت بيترفع رفعة خفيفة لما الماوس يقف عليه */
export function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
      {children}
    </motion.div>
  );
}
