"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useT } from "@/i18n/client";
import { MAX_MESSAGE } from "@/lib/chat";
import type { OrderMessage } from "@/lib/db/types";

/**
 * الشات جوه الطلب. side = مين اللي فاتح (العميل من صفحة طلبه، أو المتجر من اللوحة).
 * مش لايف زي واتساب: الصفحة بتشيّك على رسايل جديدة كل شوية وهي مفتوحة.
 */
export function OrderChat({
  messages,
  side,
  send,
  markRead,
  title,
  placeholder,
}: {
  messages: OrderMessage[];
  side: "customer" | "store";
  send: (body: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  markRead?: () => Promise<void>;
  title: string;
  placeholder: string;
}) {
  const t = useT();
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLOListElement>(null);
  const count = messages.length;

  // أول ما الشات يتفتح الرسايل بتبقى مقروءة، وبعدين بنشيّك على الجديد كل ٢٠ ثانية
  useEffect(() => {
    void markRead?.();
    const timer = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(timer);
  }, [markRead, router]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [count]);

  const when = (iso: string) =>
    new Intl.DateTimeFormat(t.locale === "en" ? "en-GB" : "ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(iso));

  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-xl">{title}</h2>
      {count > 0 ? (
        <ol ref={listRef} className="max-h-80 space-y-2 overflow-y-auto pe-1">
          {messages.map((m) => {
            const mine = m.from === side;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-6 ${mine ? "bg-brand text-white" : "bg-bg text-ink"}`}>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={`mt-0.5 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>
                    {m.from === "store" ? t("المتجر") : t("العميل")} · {when(m.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted">{side === "customer" ? t("لو عندك سؤال أو عايز تغيّر حاجة، اكتبلنا هنا.") : "مفيش رسايل لسه. لو محتاجة تسألي العميل عن حاجة اكتبيله هنا."}</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const r = await send(text);
            if (r.ok) {
              setText("");
              router.refresh();
            } else setError(r.error);
          });
        }}
        className="space-y-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE))}
          rows={2}
          placeholder={placeholder}
          aria-label={placeholder}
          className="field h-auto py-3 leading-6"
        />
        {error && <p className="text-sm text-brand">{error}</p>}
        <button disabled={pending || !text.trim()} className="btn-primary btn-sm">
          {pending ? t("لحظة…") : t("ابعت")}
        </button>
      </form>
    </section>
  );
}
