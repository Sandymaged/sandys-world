"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link, useDir, useT } from "@/i18n/client";
import { useEffect, useSyncExternalStore } from "react";
import { giftTotals } from "@/lib/cart";
import { egp } from "@/lib/format";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { useCart } from "@/store/cart";
import { GiftArt } from "./gift-art";
import { GiftCardArt } from "./gift-card-art";
import { Icon } from "./icons";

const colors = ["#e5306c", "#ffd34d", "#9b7bff", "#3fd18b", "#ffffff"];

const desktopQuery = "(min-width: 768px)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(desktopQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useDesktop = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(desktopQuery).matches, () => false);

/** درج بيطلع لما هدية تتضاف: احتفال صغير، وتكمّل تسوّق أو تروح للسلة */
export function CartDrawer() {
  const t = useT();
  const { justAdded, gifts, giftCards, closeDrawer } = useCart();
  const reduce = useReducedMotion();
  const desktop = useDesktop();
  // موبايل: درج من تحت يتسحب لتحت يقفل. كمبيوتر: لوحة من الشمال
  const rtl = useDir() === "rtl";
  const hidden = desktop ? { x: rtl ? "-100%" : "100%" } : { y: "100%" };
  // اللي اتضاف: هدية أو كارت هدية
  const g = gifts.find((x) => x.id === justAdded);
  const c = giftCards.find((x) => x.id === justAdded);
  const added = g
    ? { card: null, image: g.image, title: g.title, sub: [...g.lines, ...g.addons].map((l) => l.name).join(" · "), price: giftTotals(g, DEFAULT_SETTINGS).total }
    : c
      ? { card: c, image: null, title: t("كارت هدية"), sub: c.asGift ? t("هيتبعت لـ {name} على واتساب", { name: c.toName }) : t("الكود هيوصلك على واتساب"), price: c.amount }
      : null;
  const open = Boolean(added);
  const count = gifts.length + giftCards.length;
  const subtotal = gifts.reduce((s, x) => s + giftTotals(x, DEFAULT_SETTINGS).total, 0) + giftCards.reduce((s, x) => s + x.amount, 0);

  useEffect(() => {
    if (!open || reduce) return;
    const burst = (x: number, angle: number) =>
      confetti({ particleCount: 70, spread: 70, startVelocity: 42, angle, origin: { x, y: 0.75 }, colors, scalar: 0.9, zIndex: 70 });
    burst(0.15, 60);
    burst(0.85, 120);
  }, [open, reduce]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  return (
    <AnimatePresence>
      {added && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t("اتضافت للسلة")}
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[1.75rem] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl md:inset-x-auto md:top-0 md:end-0 md:w-[400px] md:rounded-none md:rounded-s-[1.75rem] md:p-7"
            initial={hidden}
            animate={{ x: 0, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            drag={desktop ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 90 && closeDrawer()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line md:hidden" />
            <div className="flex items-center gap-3">
              <motion.span
                className="grid size-11 place-items-center rounded-full bg-success text-white"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.15 }}
              >
                <Icon name="check" className="size-6" />
              </motion.span>
              <div>
                <p className="font-heading text-xl">{t("اتضافت للسلة!")}</p>
                <p className="text-sm text-muted">{added.card ? t("من غير توصيل، بيتبعت على واتساب") : t("فاضل تحدد المستلم وميعاد التوصيل")}</p>
              </div>
              <button onClick={closeDrawer} aria-label={t("قفل")} className="ms-auto grid size-9 place-items-center rounded-full hover:bg-surface">
                <Icon name="plus" className="size-5 rotate-45" />
              </button>
            </div>

            <motion.div
              className="mt-5 flex items-center gap-3 rounded-2xl bg-surface p-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {added.card ? (
                <GiftCardArt design={added.card.design} title="" storeName="" className="w-20 shrink-0 !rounded-lg !shadow-none" />
              ) : (
                <GiftArt image={added.image} label={added.title} className="size-16 shrink-0 rounded-xl" sizes="64px" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{added.title}</p>
                <p className="truncate text-xs text-muted">{added.sub}</p>
              </div>
              <p className="tabular shrink-0 font-semibold">{egp(added.price, t)}</p>
            </motion.div>

            <p className="mt-4 flex justify-between text-sm">
              <span className="text-muted">{count === 1 ? t("في السلة هدية واحدة") : t("في السلة {n} هدايا", { n: count })}</span>
              <span className="tabular font-semibold">{egp(subtotal, t)}</span>
            </p>

            <div className="mt-5 grid gap-2">
              <Link href="/cart" onClick={closeDrawer} className="btn-primary">
                {t("كمّل الطلب")}
              </Link>
              <button onClick={closeDrawer} className="btn-outline">
                {t("كمّل تسوّق")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
