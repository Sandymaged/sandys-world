"use client";

import { MotionConfig } from "motion/react";
import { ScrollAnimator } from "./scroll-animator";

/** الحركة كلها بتقف لو المستخدم مفعّل "تقليل الحركة" في جهازه، وحركات الأجزاء بتبدأ لما توصلها */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <ScrollAnimator />
    </MotionConfig>
  );
}
