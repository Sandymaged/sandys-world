"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { useDir, useT } from "@/i18n/client";
import type { AssistantReply, ChatTurn, Suggestion } from "@/lib/assistant";
import { askAssistant } from "@/lib/assistant-actions";
import { egp } from "@/lib/format";
import { useCart } from "@/store/cart";
import { Bow } from "./decor";
import { Icon } from "./icons";

interface Msg extends ChatTurn {
  suggestions?: Suggestion[];
}

export const OPEN_EVENT = "open-gift-assistant";

/** يفتح مساعد الهدايا من أي مكان */
export function openGiftAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { prompt } }));
}

const starters = ["هدية لماما بـ 600", "عيد ميلاد صاحبتي بـ 800، بتحب الشموع", "حاجة لزميلي في الشغل بـ 400", "mama birthday b 500"];

/** اقتراح: كولاج صور صغيرة، والسبب، والسعر المبدئي، وزرار يضيفه بوكس */
function SuggestionCard({ s, index }: { s: Suggestion; index: number }) {
  const t = useT();
  const addGift = useCart((st) => st.addGift);
  const [added, setAdded] = useState(false);
  function add() {
    addGift({
      kind: "box",
      title: t("بوكس {name}", { name: s.box.name }),
      refId: s.box.id,
      image: s.items[0]?.image ?? undefined,
      basePrice: s.box.price,
      lines: s.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        unitPrice: it.price,
        quantity: 1,
        customizable: it.isCustomizable,
        maxChars: it.maxChars,
        customization: "",
      })),
      addons: [],
      prepDays: Math.max(0, ...s.items.map((it) => it.prepDays)),
    });
    setAdded(true);
  }
  return (
    <motion.div
      className={`rounded-2xl border border-line bg-paper p-3`}
      initial={{ opacity: 0, y: 20, rotate: index % 2 ? 4 : -4 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1 : -1 }}
      transition={{ type: "spring", stiffness: 200, damping: 16, delay: index * 0.12 }}
    >
      <div className="flex -space-x-3 rtl:space-x-reverse">
        {s.items.map((it, i) => (
          <div key={it.productId} className={`relative size-14 shrink-0 overflow-hidden border-2 border-white bg-blush shadow ${i % 2 ? "rotate-6" : "-rotate-6"}`}>
            {it.image && <Image src={it.image} alt={it.name} fill sizes="56px" className="object-cover" />}
          </div>
        ))}
      </div>
      <p className="mt-2 font-heading text-lg leading-tight text-brand">{s.title}</p>
      <p className="mt-0.5 text-xs leading-5 text-ink-2">{s.items.map((it) => it.name).join(" · ")}</p>
      <p className="mt-1 font-script text-base leading-6 text-lilac">{s.reason}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="tabular text-sm">
          <span className="font-semibold text-brand">{egp(s.total, t)}</span>
          <span className="text-[11px] text-muted"> · {t("مبدئي")}</span>
        </p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={add}
          disabled={added}
          className={`btn-sm btn ${added ? "bg-success text-white" : "bg-brand text-white hover:bg-brand-dark"}`}
        >
          {added ? (
            <>
              <Icon name="check" className="size-4" /> {t("اتضاف")}
            </>
          ) : (
            t("ضيفيه بوكس")
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

/** مساعد الهدايا: زرار عائم بيفتح ورقة كشكول فيها الشات */
export function GiftAssistant() {
  const t = useT();
  const rtl = useDir() === "rtl";
  const [open, setOpen] = useState(false);
  // في الموبايل الصفحات اللي فيها زرار شراء ثابت تحت: الزرار العائم بيستخبى عشان ميغطيش عليه
  const path = usePathname().replace(/^\/en(?=\/|$)/, "") || "/";
  const busyBottom = /^\/(cart|checkout|box|products\/|packages\/|kits\/)/.test(path);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pending]);

  // أي زرار في الموقع يقدر يفتح المساعد (ومعاه رسالة جاهزة لو حابب)
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const prompt = (e as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) setTimeout(() => sendRef.current(prompt), 50);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sendRef = useRef<(v: string) => void>(() => {});
  useEffect(() => {
    sendRef.current = send;
  });

  function send(value: string) {
    const v = value.trim();
    if (!v || pending) return;
    const next: Msg[] = [...msgs, { role: "user", text: v }];
    setMsgs(next);
    setText("");
    start(async () => {
      let r: AssistantReply;
      try {
        r = await askAssistant(next.map(({ role, text }) => ({ role, text })), t.locale);
      } catch {
        r = { mode: "rules", reply: t("حصلت مشكلة صغيرة، جرّبي تاني."), suggestions: [] };
      }
      setMsgs((m) => [...m, { role: "assistant", text: r.reply, suggestions: r.suggestions }]);
    });
  }

  return (
    <>
      {/* الزرار العائم */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("مساعد الهدايا")}
            className={`fixed start-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 items-center gap-2 rounded-full border-2 border-brand bg-bg py-2 ps-2 pe-4 md:bottom-6 md:flex ${busyBottom ? "hidden" : "flex"}`}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand-soft">
              <Bow className="w-7 animate-sway text-brand" />
            </span>
            <span className="font-heading text-base text-brand">{t("محتارة؟ اسأليني")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* الشات */}
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label={t("مساعد الهدايا")}
            className="fixed inset-x-0 bottom-0 z-[55] flex h-[min(85dvh,44rem)] flex-col bg-[#fffdf6] shadow-2xl md:inset-x-auto md:start-6 md:bottom-6 md:h-[40rem] md:w-[25rem] md:rotate-[-0.6deg]"
            style={{ backgroundImage: "repeating-linear-gradient(transparent 0 31px, rgb(169 179 224 / 0.35) 31px 32px)" }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <header className="flex items-center gap-3 border-b-2 border-dashed border-line bg-[#fffdf6] px-4 pt-5 pb-3">
              <Bow className="w-10 text-brand" />
              <div className="min-w-0 flex-1">
                <p className="font-heading text-xl leading-tight text-brand">{t("مساعد الهدايا")}</p>
                <p className="font-script text-sm text-candy">{t("قوليلي لمين ومناسبة إيه وميزانيتك")}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("قفل")} className="grid size-9 place-items-center rounded-full hover:bg-surface">
                <Icon name="plus" className="size-5 rotate-45" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {msgs.length === 0 && (
                <div className="space-y-3">
                  <p className="font-script text-xl leading-8 text-ink-2">
                    {t("أهلاً! اكتبيلي بالعامي أو بالفرانكو: الهدية لمين، بتحب إيه، وميزانيتك كام، وأنا أجمعلك بوكسات من البراندات المحلية.")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {starters.map((s) => (
                      <button key={s} type="button" onClick={() => send(t(s))} className="chip border-dashed border-brand bg-bg text-brand hover:bg-brand-soft">
                        {t(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <motion.p
                    key={i}
                    className="ms-auto w-fit max-w-[85%] -rotate-1 bg-brand-soft px-3 py-2 text-sm leading-6 text-ink shadow-sm"
                    initial={{ opacity: 0, x: rtl ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {m.text}
                  </motion.p>
                ) : (
                  <div key={i} className="space-y-4">
                    {m.text && (
                      <motion.p className="max-w-[92%] text-sm leading-7 text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {m.text}
                      </motion.p>
                    )}
                    {m.suggestions?.map((s, j) => (
                      <SuggestionCard key={j} s={s} index={j} />
                    ))}
                  </div>
                ),
              )}

              {pending && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="font-script text-lg">{t("بدوّرلك…")}</span>
                </div>
              )}
            </div>

            <form
              className="flex gap-2 border-t-2 border-dashed border-line bg-[#fffdf6] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
              onSubmit={(e) => {
                e.preventDefault();
                send(text);
              }}
            >
              <input
                className="field h-11 flex-1 rounded-full"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("مثلاً: هدية لأختي بـ 700، بتحب القهوة")}
                aria-label={t("رسالتك")}
                maxLength={500}
              />
              <button type="submit" disabled={pending || !text.trim()} className="btn h-11 rounded-full bg-brand px-4 text-white" aria-label={t("ابعت")}>
                <Icon name="chevron" className="size-5" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
