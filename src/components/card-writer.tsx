"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { Bow } from "./decor";

const MAX = 160;

/** «اكتب كارتك»: تكتب رسالتك وتشوفها على الكارت اللي بيتبعت مع الهدية، وهي بتتكتب */
export function CardWriter() {
  const t = useT();
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [from, setFrom] = useState("");

  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <label className="block">
          <span className="label">{t("لمين؟")}</span>
          <input value={to} onChange={(e) => setTo(e.target.value.slice(0, 30))} placeholder={t("ماما")} className="field" />
        </label>
        <label className="block">
          <span className="label">{t("رسالتك")}</span>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value.slice(0, MAX))}
            rows={4}
            placeholder={t("كل سنة وإنتي أحلى حاجة في حياتي")}
            className="field h-auto py-3 leading-7"
          />
          <span className="tabular mt-1 block text-end text-xs text-muted">
            {msg.length}/{MAX}
          </span>
        </label>
        <label className="block">
          <span className="label">{t("من مين؟")}</span>
          <input value={from} onChange={(e) => setFrom(e.target.value.slice(0, 30))} placeholder={t("بنتك اللي بتحبك")} className="field" />
        </label>
      </div>

      {/* الكارت نفسه */}
      <div className="relative order-first mx-auto w-full max-w-sm -rotate-1 md:order-last">
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl bg-pink-mid" aria-hidden />
        <div className="relative rounded-2xl border border-line bg-paper px-7 pt-10 pb-8 shadow-[0_24px_40px_-28px_rgb(60_30_20/0.5)]">
          <Bow className="absolute -top-6 left-1/2 w-14 -translate-x-1/2 text-brand" />
          <p className="font-script text-2xl text-brand">
            {t("إلى")} {to || t("ماما")}،
          </p>
          <p className="mt-3 min-h-[6rem] font-script text-2xl leading-[1.7] break-words whitespace-pre-line text-ink">
            {msg || t("كل سنة وإنتي أحلى حاجة في حياتي")}
          </p>
          <p className="mt-4 text-end font-script text-xl text-ink-2">— {from || t("بنتك اللي بتحبك")}</p>
        </div>
      </div>
    </div>
  );
}
