"use client";

import { MotionConfig } from "motion/react";

/** الحركة كلها بتقف لو المستخدم مفعّل "تقليل الحركة" في جهازه */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
