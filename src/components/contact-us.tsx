import { getT } from "@/i18n/server";
import { getContact } from "@/lib/contact";

const WaIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
  </svg>
);

const PhoneIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);

/**
 * «عندك سؤال؟» بزرارين: واتساب واتصال. بيظهر في صفحة المنتج والسلة والدفع،
 * عشان اللي بيحب يتصل قبل ما يدفع يلاقي الرقم قدامه. ولو الرقم متحطش من اللوحة مش بيظهر.
 */
export async function ContactUs({ className = "" }: { className?: string }) {
  const [t, c] = await Promise.all([getT(), getContact()]);
  if (!c.phone) return null;
  return (
    <div className={`rounded-2xl border border-line bg-paper p-4 ${className}`}>
      <p className="font-semibold">{t("عندك سؤال قبل الطلب؟")}</p>
      <p className="mt-0.5 text-sm text-ink-2">{t("كلّمنا وسنرد عليك بسرعة.")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={c.whatsapp} target="_blank" rel="noreferrer" className="btn btn-sm bg-[#1f8f4e] text-white hover:bg-[#187a42]">
          <WaIcon className="size-4" />
          {t("واتساب")}
        </a>
        <a href={c.tel} className="btn btn-sm border border-ink/15 bg-bg text-ink hover:border-brand hover:text-brand">
          <PhoneIcon className="size-4" />
          <span className="tabular" dir="ltr">{c.phoneDisplay}</span>
        </a>
      </div>
    </div>
  );
}

/** نفس الأزرار بشكل الفوتر (على خلفية غامقة) */
export async function FooterContact() {
  const [t, c] = await Promise.all([getT(), getContact()]);
  if (!c.phone) return null;
  return (
    <ul className="space-y-3 leading-6">
      <li>
        <a href={c.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
          <WaIcon className="size-5 text-pink-mid" />
          {t("واتساب")}
        </a>
      </li>
      <li>
        <a href={c.tel} className="inline-flex items-center gap-2 hover:text-white">
          <PhoneIcon className="size-5 text-pink-mid" />
          <span className="tabular" dir="ltr">{c.phoneDisplay}</span>
        </a>
      </li>
      {c.instagram && (
        <li>
          <a href={c.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
            {t("إنستجرام")}
          </a>
        </li>
      )}
    </ul>
  );
}
