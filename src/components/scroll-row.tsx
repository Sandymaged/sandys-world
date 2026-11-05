"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * صف واحد بيتحرك يمين وشمال: بالسحب أو بالأسهم اللي على الجناب.
 * السهم بيختفي لو مفيش حاجة تانية في الناحية دي.
 */
export function ScrollRow({ children, label }: { children: React.ReactNode[]; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    // في العربي scrollLeft بيبقى بالسالب، فبنقيس المسافة من الناحيتين بالقيمة المطلقة
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos < 4, end: pos + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const move = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow = (dir: 1 | -1, hidden: boolean) => (
    <button
      type="button"
      onClick={() => move(dir)}
      aria-label={dir === 1 ? "التالي" : "السابق"}
      className={`absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper text-ink shadow-[0_10px_18px_-10px_rgb(60_20_25/0.5)] transition hover:border-brand hover:text-brand sm:grid ${
        dir === 1 ? "-end-3" : "-start-3"
      } ${hidden ? "pointer-events-none opacity-0" : ""}`}
    >
      <Icon name="chevron" className={`size-5 ${dir === 1 ? "" : "rotate-180"}`} />
    </button>
  );

  return (
    <div className="relative" role="region" aria-label={label}>
      {arrow(-1, edges.start)}
      <div ref={ref} onScroll={update} className="reveal-stagger scroll-x snap-x snap-mandatory py-2">
        {children.map((c, i) => (
          <div key={i} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]">
            {c}
          </div>
        ))}
      </div>
      {arrow(1, edges.end)}
    </div>
  );
}
