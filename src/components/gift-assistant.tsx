"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Link, useDir, useT } from "@/i18n/client";
import type { AssistantReply, ChatTurn, Suggestion } from "@/lib/assistant";
import { askAssistant } from "@/lib/assistant-actions";
import { egp } from "@/lib/format";
import { useCart } from "@/store/cart";
import { Bow } from "./decor";
import { Icon } from "./icons";

interface Msg extends ChatTurn {
  suggestions?: Suggestion[];
  quickReplies?: string[];
}

// المحادثة بتفضل لو قفل الشات أو نقل لصفحة تانية (لحد ما يقفل التاب)
const STORE_KEY = "giftful-chat";
function loadChat(): Msg[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "[]");
    return Array.isArray(v) ? v.slice(-30) : [];
  } catch {
    return [];
  }
}
function saveChat(msgs: Msg[]) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-30)));
  } catch {
    // مش مشكلة: المحادثة بس مش هتتحفظ
  }
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
  const line = (it: Suggestion["items"][number], unitPrice: number) => ({
    productId: it.productId,
    name: it.name,
    unitPrice,
    quantity: it.quantity,
    customizable: it.isCustomizable,
    maxChars: it.maxChars,
    customKind: it.customKind,
    customization: "",
  });
  function add() {
    if (s.kind === "box" && s.box) {
      addGift({
        kind: "box",
        title: t("بوكس {name}", { name: s.box.name }),
        refId: s.box.id,
        image: s.items[0]?.image ?? undefined,
        basePrice: s.box.price,
        lines: s.items.map((it) => line(it, it.price)),
        addons: [],
        prepDays: Math.max(0, ...s.items.map((it) => it.prepDays)),
      });
    } else if (s.ref) {
      addGift({
        kind: s.kind === "package" ? "package" : "product",
        title: s.ref.name,
        slug: s.ref.slug,
        refId: s.ref.id,
        image: s.ref.image ?? undefined,
        // الباكدج بسعره الثابت، والمنتج لوحده سعره على السطر
        basePrice: s.kind === "package" ? s.total : 0,
        lines: s.items.map((it) => line(it, s.kind === "package" ? 0 : it.price)),
        addons: [],
        prepDays: s.ref.prepDays,
      });
    }
    setAdded(true);
  }
  const kindLabel = s.kind === "box" ? t("بوكس متركّبلك") : s.kind === "package" ? t("باكدج جاهز") : t("هدية لوحدها");
  const page = s.ref ? `/${s.kind === "package" ? "packages" : "products"}/${s.ref.slug}` : null;
  return (
    <motion.div
      className={`rounded-2xl border border-line bg-paper p-3`}
      initial={{ opacity: 0, y: 20, rotate: index % 2 ? 4 : -4 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1 : -1 }}
      transition={{ type: "spring", stiffness: 200, damping: 16, delay: index * 0.12 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex -space-x-3 rtl:space-x-reverse">
          {s.kind === "box" ? (
            s.items.map((it, i) => (
              <div key={it.productId} className={`relative size-14 shrink-0 overflow-hidden border-2 border-white bg-blush shadow ${i % 2 ? "rotate-6" : "-rotate-6"}`}>
                {it.image && <Image src={it.image} alt={it.name} fill sizes="56px" className="object-cover" />}
              </div>
            ))
          ) : (
            <div className="relative size-16 shrink-0 -rotate-3 overflow-hidden border-2 border-white bg-blush shadow">
              {s.ref?.image && <Image src={s.ref.image} alt={s.ref.name} fill sizes="64px" className="object-cover" />}
            </div>
          )}
        </div>
        <span className="chip shrink-0 border-line bg-bg text-[11px] text-ink-2">{kindLabel}</span>
      </div>
      <p className="mt-2 font-heading text-lg leading-tight text-brand">{s.title}</p>
      <p className="mt-0.5 text-xs leading-5 text-ink-2">
        {s.kind === "product" ? s.ref?.name : s.items.map((it) => (it.quantity > 1 ? `${it.quantity}× ${it.name}` : it.name)).join(" · ")}
      </p>
      <p className="mt-1 font-script text-base leading-6 text-lilac">{s.reason}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="tabular text-sm">
          <span className="font-semibold text-brand">{egp(s.total, t)}</span>
          <span className="text-[11px] text-muted"> · {t("مبدئي")}</span>
        </p>
        {s.needsChoice && page ? (
          // فيه لون أو مقاس: يختار من صفحة الهدية الأول
          <Link href={page} className="btn-sm btn bg-brand text-white hover:bg-brand-dark">
            {t("اختار اللون أو المقاس")}
          </Link>
        ) : (
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
            ) : s.kind === "box" ? (
              t("ضيفيه بوكس")
            ) : (
              t("ضيف للسلة")
            )}
          </motion.button>
        )}
      </div>
      {page && !s.needsChoice && (
        <Link href={page} className="mt-1.5 inline-block text-xs text-muted underline underline-offset-4 hover:text-brand">
          {t("شوف التفاصيل")}
        </Link>
      )}
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
  const loaded = useRef(false);

  // بنرجّع المحادثة القديمة بعد أول رسم (sessionStorage مش موجود على السيرفر)
  useEffect(() => {
    const old = loadChat();
    loaded.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (old.length) setMsgs(old);
  }, []);
  useEffect(() => {
    if (loaded.current) saveChat(msgs);
  }, [msgs]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pending, open]);

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
    // اللي اتعرض قبل كده: عشان «اقتراحات تانية» تجيب حاجات جديدة
    const shown = [...new Set(msgs.flatMap((m) => m.suggestions ?? []).flatMap((s) => [...s.items.map((i) => i.productId), ...(s.ref ? [s.ref.id] : [])]))];
    start(async () => {
      let r: AssistantReply;
      try {
        r = await askAssistant(next.map(({ role, text }) => ({ role, text })), t.locale, shown);
      } catch {
        r = { mode: "rules", reply: t("حصلت مشكلة صغيرة، جرّبي تاني."), suggestions: [] };
      }
      setMsgs((m) => [...m, { role: "assistant", text: r.reply, suggestions: r.suggestions, quickReplies: r.quickReplies }]);
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
                <p className="font-logo text-2xl leading-tight font-semibold text-brand italic">giftful</p>
                <p className="font-script text-sm text-candy">{t("قوليلي لمين ومناسبة إيه وميزانيتك")}</p>
              </div>
              {msgs.length > 0 && (
                <button type="button" onClick={() => setMsgs([])} disabled={pending} className="rounded-full px-2.5 py-1 text-xs text-muted hover:bg-surface hover:text-brand">
                  {t("محادثة جديدة")}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label={t("قفل")} className="grid size-9 place-items-center rounded-full hover:bg-surface">
                <Icon name="plus" className="size-5 rotate-45" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {msgs.length === 0 && (
                <div className="space-y-3">
                  <p className="font-script text-xl leading-8 text-ink-2">
                    {t("أهلاً، أنا giftful! اكتبيلي بالعامي أو بالفرانكو: الهدية لمين، بتحب إيه، وميزانيتك كام. هدوّر في كل الهدايا اللي عندنا وأقترحلك باكدج جاهز، أو هدية لوحدها، أو أركّبلك بوكس.")}
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
                    {/* ردود جاهزة تحت آخر رد بس */}
                    {i === msgs.length - 1 && !pending && m.quickReplies?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {m.quickReplies.map((q) => (
                          <button key={q} type="button" onClick={() => send(q)} className="chip border-dashed border-brand bg-bg text-brand hover:bg-brand-soft">
                            {q}
                          </button>
                        ))}
                      </div>
                    ) : null}
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
