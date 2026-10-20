"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true بعد ما الصفحة تتحمل في المتصفح — عشان بيانات السلة المحفوظة متعملش hydration mismatch */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
