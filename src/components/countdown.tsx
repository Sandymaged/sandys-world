"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";

/** عداد تنازلي لآخر ميعاد طلب في الموسم */
export function Countdown({ until }: { until: string }) {
  const t = useT();
  const target = Date.parse(until);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const s = now === null ? 0 : Math.max(0, Math.floor((target - now) / 1000));
  const cells = [
    { v: Math.floor(s / 86400), l: "يوم" },
    { v: Math.floor((s % 86400) / 3600), l: "ساعة" },
    { v: Math.floor((s % 3600) / 60), l: "دقيقة" },
  ];
  return (
    <div className="flex gap-2" aria-live="off">
      {cells.map((c) => (
        <div key={c.l} className="min-w-14 rounded-lg bg-white/12 px-2 py-1.5 text-center ring-1 ring-white/20 backdrop-blur">
          <div className="tabular text-lg leading-tight font-semibold">{now === null ? "–" : String(c.v).padStart(2, "0")}</div>
          <div className="text-[11px] opacity-80">{t(c.l)}</div>
        </div>
      ))}
    </div>
  );
}
