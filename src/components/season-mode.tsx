import { modeById, type ModeDef, type ModeSettings } from "@/lib/modes";

/*
 * مود المناسبة على واجهة المتجر: الألوان، والشريط اللي فوق، والتأثير المتحرك.
 * بيترسم من السيرفر (من غير جافاسكريبت)، وبيتشال لوحده لما المود يتقفل من اللوحة.
 */

/** ألوان المود: بتغطي على ألوان globals.css في صفحات المتجر بس */
export function ModeStyle({ settings }: { settings: ModeSettings }) {
  const m = modeById(settings.id);
  const vars = Object.entries(m.colors);
  if (!vars.length) return null;
  return <style>{`:root{${vars.map(([k, v]) => `${k}:${v}`).join(";")}}`}</style>;
}

function BarIcon({ m }: { m: ModeDef }) {
  const cls = "size-5 shrink-0";
  if (m.particle === "heart")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.4 2.6h1.8c.8-1.4 2.3-2.6 4.4-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
    );
  if (m.particle === "star")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M15.5 3.2A8.8 8.8 0 1 0 20.8 16 7 7 0 0 1 15.5 3.2z" />
        <path d="M18.5 4.5l.7 1.6 1.7.2-1.3 1.1.4 1.7-1.5-.9-1.5.9.4-1.7-1.3-1.1 1.7-.2z" />
      </svg>
    );
  // شجرة الكريسماس بنجمة
  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden>
      <path d="M12 2l1 2.2 2.3.3-1.7 1.6.4 2.3L12 7.3 10 8.4l.4-2.3-1.7-1.6 2.3-.3z" fill="#e0b43a" />
      <path d="M12 7l4 5h-2l4 5h-2.5l3.5 4H5l3.5-4H6l4-5H8z" fill="currentColor" />
      <rect x="11" y="20" width="2" height="2.5" fill="currentColor" />
    </svg>
  );
}

/** أنوار الكريسماس: سلك متعرّج تحت الشريط ولمبات ملوّنة بتنور وتطفي بالتبادل */
function Lights() {
  const colors = ["#e0b43a", "#d64550", "#6fbf8f", "#7fa8e0"];
  const n = 28;
  return (
    <svg className="pointer-events-none absolute inset-x-0 -bottom-3 h-4 w-full" viewBox={`0 0 ${n * 40} 16`} preserveAspectRatio="none" aria-hidden>
      <path d={`M0 2 ${Array.from({ length: n }, (_, i) => `Q${i * 40 + 20} 9 ${i * 40 + 40} 2`).join(" ")}`} stroke="#1a3d2c" strokeWidth="1.5" fill="none" />
      {Array.from({ length: n }, (_, i) => (
        <ellipse key={i} cx={i * 40 + 20} cy={9.5} rx={3.2} ry={4.5} fill={colors[i % colors.length]} className="mode-bulb" style={{ animationDelay: `${(i % 4) * 0.45}s` }} />
      ))}
    </svg>
  );
}

/** الشريط اللي فوق الهيدر بجملة المناسبة */
export function ModeBanner({ settings, lang }: { settings: ModeSettings; lang: string }) {
  const m = modeById(settings.id);
  if (m.id === "off" || !settings.showBanner) return null;
  const saved = settings.banners[m.id];
  const text = lang === "en" ? saved?.en || m.banner.en : saved?.ar || m.banner.ar;
  if (!text) return null;
  return (
    <div className="relative z-40 print:hidden" style={{ background: m.bar.bg, color: m.bar.fg }}>
      <p className="container-x flex items-center justify-center gap-2.5 py-2 text-center text-sm font-semibold leading-6">
        <BarIcon m={m} />
        <span>{text}</span>
        <BarIcon m={m} />
      </p>
      {m.id === "christmas" && <Lights />}
    </div>
  );
}

// أماكن ثابتة (مش عشوائية) عشان السيرفر والمتصفح يرسموا نفس الشكل
const spots = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 6 + ((i * 7) % 9),
  dur: 11 + ((i * 5) % 9),
  delay: -((i * 3.7) % 18),
  drift: ((i % 5) - 2) * 14,
}));

/** التأثير المتحرك: ثلج أو قلوب أو نجوم بتنزل بهدوء، من غير ما تمنع الضغط على أي حاجة */
export function ModeEffects({ settings }: { settings: ModeSettings }) {
  const m = modeById(settings.id);
  if (!m.particle || !settings.effects) return null;
  const color = m.particle === "snow" ? "#b9c9d9" : m.particle === "heart" ? "#e08aa5" : "#e0b43a";
  return (
    <div className="mode-effects pointer-events-none fixed inset-0 z-[5] overflow-hidden print:hidden" aria-hidden>
      {spots.map((s, i) => (
        <span
          key={i}
          className="mode-flake absolute -top-6"
          style={{
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            color,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            ["--drift" as string]: `${s.drift}px`,
          }}
        >
          {m.particle === "snow" ? (
            <span className="block size-full rounded-full bg-current opacity-80" />
          ) : m.particle === "heart" ? (
            <svg viewBox="0 0 24 24" className="size-full opacity-70" fill="currentColor">
              <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.4 2.6h1.8c.8-1.4 2.3-2.6 4.4-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-full opacity-75" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}
