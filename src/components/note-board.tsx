import { Bow } from "./decor";

export interface BoardNote {
  title: string;
  body: string;
}

// كل ورقة: لون الإطار المخرّم، والميل، ونزلة بسيطة عشان الشكل يبان متلزق بإيد
const looks = [
  { frame: "bg-pink-mid", r: -3, y: "" },
  { frame: "bg-[#c9d98a]", r: 2.5, y: "md:mt-10" },
  { frame: "bg-periwinkle", r: -1.5, y: "" },
  { frame: "bg-[#c9d98a]", r: 2, y: "md:-mt-4" },
  { frame: "bg-pink-mid", r: -2.5, y: "md:mt-8" },
  { frame: "bg-periwinkle", r: 3, y: "" },
];

/** دبوس صغير فوق الورقة */
function PushPin({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 30" className="absolute -top-3 left-1/2 z-10 w-5 -translate-x-1/2 drop-shadow" aria-hidden>
      <path d="M12 16 L12 29" stroke="#9a8f86" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="9" r="8" fill={color} />
      <circle cx="9.5" cy="6.5" r="2.4" fill="#fff" opacity="0.55" />
    </svg>
  );
}

function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 30" className={className} aria-hidden>
      <path d="M16 29 C 6 21, 1 15, 1 9 A 7.5 7.5 0 0 1 16 6 A 7.5 7.5 0 0 1 31 9 C 31 15, 26 21, 16 29 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * لوحة بمربعات دهبي، وعليها ورق بحواف مخرّمة متثبت بدبابيس.
 * كل ورقة بتتنطط وتستقر على ميلها لما توصلي لها بالسكرول (CSS بس).
 */
export function NoteBoard({ notes }: { notes: BoardNote[] }) {
  return (
    <div className="panel relative overflow-hidden bg-board px-5 py-12 sm:px-10 sm:py-16">
      {/* ستيكرات على اللوحة */}
      <Bow className="absolute top-6 start-6 w-14 animate-float text-brand" />
      <Heart className="absolute end-8 bottom-10 w-10 animate-float text-candy [animation-delay:-3s]" />
      <svg viewBox="0 0 24 24" className="absolute end-[22%] top-8 w-7 animate-float text-gold [animation-delay:-1.5s]" aria-hidden>
        <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" />
      </svg>

      <div className="relative grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-10 md:gap-y-14">
        {notes.map((n, i) => {
          const l = looks[i % looks.length];
          return (
            <div key={n.title} className={`reveal-pop relative ${l.y}`} style={{ "--r": `${l.r}deg` } as React.CSSProperties}>
              <PushPin color={i % 2 ? "var(--color-blue)" : "var(--color-brand)"} />
              <div className={`scallop ${l.frame} transition-transform duration-300 hover:-translate-y-1 hover:rotate-1`}>
                <div className="bg-paper px-4 py-5 text-center sm:px-6 sm:py-7">
                  <span className="tabular mx-auto mb-2 grid size-8 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                  <p className="font-heading text-lg leading-snug text-ink sm:text-xl">{n.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-2 sm:text-[15px]">{n.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
