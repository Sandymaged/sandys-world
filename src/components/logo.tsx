/**
 * لوجو Sandy's World: "sandy's" بخط مكتوب باليد، و"world" صغيرة ومتباعدة تحتها.
 * المقاس كله بيتبع حجم الخط (em) فبيتظبط بـ text-* من برا، وهو إنجليزي في الصفحتين.
 */
export function Logo({ className = "", accent = "text-brand" }: { className?: string; accent?: string }) {
  return (
    <span dir="ltr" className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="font-logo text-[2.5em] leading-[0.95]">sandy&rsquo;s</span>
      <span className={`mt-[0.2em] ps-[0.6em] text-[0.62em] font-medium tracking-[0.6em] uppercase ${accent}`}>world</span>
    </span>
  );
}
