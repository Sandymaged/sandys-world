import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { Icon } from "./icons";

/** سطر واضح جنب المنتجات: لو العميل مااختارش صندوق، الهدايا بتتغلّف في التغليف الأساسي بتاعنا */
export async function WrapNote({ className = "" }: { className?: string }) {
  const t = await getT();
  return (
    <p className={`flex items-start gap-3 rounded-2xl border border-dashed border-brand/30 bg-brand-soft/60 px-4 py-3 text-sm leading-7 text-ink-2 ${className}`}>
      <Icon name="gift" className="mt-1 size-5 shrink-0 text-brand" />
      <span>
        <b className="text-ink">{t("لا تريد صندوقاً؟")}</b> {t("نغلّف هديتك بتغليفنا الأساسي: ورق وشريطة تناسب المناسبة.")}{" "}
        <Link href="/box" className="font-semibold text-brand underline underline-offset-4">
          {t("أو صمّم صندوقك بنفسك")}
        </Link>
      </span>
    </p>
  );
}
