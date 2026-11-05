"use client";

import { useEffect } from "react";

/*
 * الحركات بتبدأ لما الجزء بتاعها يظهر على الشاشة (مش أول ما الصفحة تفتح).
 * أي عنصر عليه واحدة من الكلاسات دي بيفضل مستني، وأول ما يدخل الشاشة بياخد data-in فالحركة تشتغل مرة واحدة.
 * React بيقارن الـ attributes وهو بيكمّل الصفحة (hydration)، فمبنحطش data-in على عنصر غير بعد ما React يمسكه
 * (بيبقى عليه مفتاح __reactFiber)، وإلا بنستنى شوية ونحاول تاني.
 * المتابعة شغالة كمان على اللي بيتضاف بعدين (التنقل بين الصفحات).
 */
const SELECTOR = ".reveal, .reveal-pop, .reveal-draw, .reveal-stagger, .animate-drop-in, .animate-pop-in, .animate-fade-up";

const hydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith("__reactFiber"));

export function ScrollAnimator() {
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const mark = (el: Element) => {
      if (hydrated(el)) {
        el.setAttribute("data-in", "");
        return;
      }
      const id = setTimeout(() => {
        timers.delete(id);
        mark(el);
      }, 120);
      timers.add(id);
    };
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(SELECTOR).forEach(mark);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          mark(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const watch = (root: ParentNode) => root.querySelectorAll(SELECTOR).forEach((el) => !el.hasAttribute("data-in") && io.observe(el));
    watch(document);
    const mo = new MutationObserver((list) => {
      for (const m of list) m.addedNodes.forEach((n) => n instanceof Element && (n.matches(SELECTOR) ? io.observe(n) : watch(n)));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      timers.forEach(clearTimeout);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
