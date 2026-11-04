/**
 * لوجو giftful: الاسم بخط Instrument Serif وتحته «الخيط اللي بيجمع» بلفّة صغيرة في آخره،
 * والخيط بيترسم أول ما الصفحة تفتح. المقاس كله بيتبع حجم الخط (em) فبيتظبط بـ text-* من برا.
 */
export function Logo({ className = "", accent = "text-brand" }: { className?: string; accent?: string }) {
  return (
    <span dir="ltr" className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="font-logo text-[2.3em] leading-[0.95] font-semibold italic tracking-[-0.01em]">giftful</span>
      <Thread className={`-mt-[0.1em] w-[6.2em] ${accent}`} />
    </span>
  );
}

// خيط متموج وفيه لفّة قرب آخره (مساحة 200×30)
const threadPath = "M3 19 C 28 12, 50 23, 78 18 S 124 12, 146 17 C 158 20, 166 20, 170 13 C 174 5, 162 3, 162 11 C 162 19, 178 22, 197 18";

/** الخيط لوحده: فاصل بين الأقسام أو تحت عنوان. لونه من currentColor */
export function Thread({ className = "", draw = true }: { className?: string; draw?: boolean }) {
  return (
    <svg viewBox="0 0 200 30" className={`overflow-visible ${className}`} fill="none" aria-hidden>
      <path d={threadPath} pathLength={1} className={draw ? "thread-draw" : undefined} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** ختم دايري: «giftful» في النص، وحواليه الكلام ماشي على الدايرة */
export function Seal({ className = "", text = "LOCAL GIFTS · HANDMADE KITS · MADE IN EGYPT · " }: { className?: string; text?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} direction="ltr" aria-hidden>
      <defs>
        <path id="seal-ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <text fill="currentColor" fontSize="7.6" style={{ fontFamily: "var(--font-body), sans-serif" }}>
        <textPath href="#seal-ring" textLength="272" lengthAdjust="spacing">{text}</textPath>
      </text>
      <text x="60" y="66" textAnchor="middle" fill="currentColor" fontSize="19" style={{ fontFamily: "var(--font-hand-en), serif" }}>
        giftful
      </text>
    </svg>
  );
}
