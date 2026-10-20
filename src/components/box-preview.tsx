"use client";

import { useDir, useT } from "@/i18n/client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Basket, BasketReveal, type BasketItem } from "./basket-reveal";

/**
 * على الشاشات الصغيرة (من غير العمود الجانبي): السلة الحمرا الصغيرة بتطلع من الجنب أول ما تختاري أول حاجة،
 * ولو دوستي عليها بتفتح السلة الكبيرة بالأسهم والأسامي.
 */
export function BoxPreviewDock({ items }: { items: BasketItem[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  // بيطلع من ناحية بداية السطر: يمين في العربي، شمال في الإنجليزي
  const off = useDir() === "rtl" ? "110%" : "-110%";
  return (
    <>
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            className="fixed start-0 bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] z-30 lg:hidden"
            initial={{ x: off }}
            animate={{ x: 0 }}
            exit={{ x: off }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("شوفي إيه اللي جوه بوكسك")}
              className="block w-36 overflow-hidden rounded-s-[1.25rem] border-2 border-e-0 border-[#fff6ec] bg-[#8f1b22] pt-2"
            >
              <span className="block text-center font-script text-sm text-[#fff6ec]">{t("بصي من قريب")}</span>
              <Basket compact items={items} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-4 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm"
              initial={{ scale: 0.9, rotate: -3 }}
              animate={{ scale: 1, rotate: -1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <BasketReveal title={t("استني… إيه اللي جوه بوكسك؟")} subtitle={t("بصي من قريب")} items={items}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#fff6ec] px-8 py-2.5 font-heading text-lg text-[#8f1b22] shadow-[0_6px_0_rgb(0_0_0/0.18)]"
                >
                  {t("كمّلي اختيار")}
                </button>
              </BasketReveal>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
