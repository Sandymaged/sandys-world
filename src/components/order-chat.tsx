"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useT } from "@/i18n/client";
import { MAX_MESSAGE } from "@/lib/chat";
import type { OrderMessage } from "@/lib/db/types";
import { waLink } from "@/lib/admin-format";

/**
 * الشات جوه الطلب. side = مين اللي فاتح (العميل من صفحة طلبه، أو المتجر من اللوحة).
 * مش لايف زي واتساب: الصفحة بتشيّك على رسايل جديدة كل شوية وهي مفتوحة.
 * `whatsapp` (للمتجر بس): زرار بيسجّل الرسالة في الشات ويفتح واتساب على رقم العميل بنفس الرسالة،
 * وتحتها لينك الطلب عشان العميل يقدر يرد من الموقع.
 */
export function OrderChat({
  messages,
  side,
  send,
  markRead,
  title,
  placeholder,
  whatsapp,
}: {
  messages: OrderMessage[];
  side: "customer" | "store";
  send: (body: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  markRead?: () => Promise<void>;
  title: string;
  placeholder: string;
  whatsapp?: { phone: string; footer?: string };
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

  const waUrl = (body: string) => (whatsapp ? waLink(whatsapp.phone, whatsapp.footer ? `${body}\n\n${whatsapp.footer}` : body) : "#");

  const submit = (alsoWhatsapp: boolean) => {
    const body = text.trim();
    if (!body) return;
    // واتساب لازم يتفتح مع الدوسة نفسها (وإلا المتصفح بيمنعه)، وبعدين الرسالة بتتسجل
    if (alsoWhatsapp && whatsapp) window.open(waUrl(body), "_blank", "noopener");
    setError(null);
    start(async () => {
      const r = await send(body);
      if (r.ok) {
        setText("");
        router.refresh();
      } else setError(r.error);
    });
  };

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
                    {whatsapp && m.from === "store" && (
                      <>
                        {" · "}
                        <a href={waUrl(m.body)} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">
                          ابعتها واتساب
                        </a>
                      </>
                    )}
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
          submit(false);
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
        <div className="flex flex-wrap gap-2">
          <button disabled={pending || !text.trim()} className="btn-primary btn-sm">
            {pending ? t("لحظة…") : t("ابعت")}
          </button>
          {whatsapp && (
            <button
              type="button"
              disabled={pending || !text.trim()}
              onClick={() => submit(true)}
              className="btn btn-sm bg-[#1f9d55] text-white hover:bg-[#178246]"
              title="بتتسجل في الشات وبيتفتح واتساب على رقم العميل بنفس الرسالة"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
              </svg>
              ابعت + واتساب
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
