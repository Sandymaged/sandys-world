"use client";

import { useT } from "@/i18n/client";
import { Bow } from "./decor";
import { openGiftAssistant } from "./gift-assistant";

const examples = ["هدية لماما بـ 600", "عيد ميلاد صاحبتي بـ 800، بتحب الشموع", "حاجة لزميلي في الشغل بـ 400"];

/** قسم في الرئيسية بيعرّف بمساعد الهدايا، وكل مثال بيفتح الشات بالرسالة دي */
export function AssistantPromo() {
  const t = useT();
  return (
    <div className="reveal panel relative bg-paper px-6 py-10 sm:px-12 sm:py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-soft">
          <Bow className="w-10 text-brand" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-script text-2xl text-candy">{t("محتارة تجيبي إيه؟")}</p>
          <h2 className="text-3xl leading-tight text-brand sm:text-4xl">{t("اسألي مساعد الهدايا")}</h2>
        </div>
      </div>
      <p className="mt-4 leading-8 text-ink-2">
        {t("اكتبيله بالعامي أو بالفرانكو: الهدية لمين، بتحب إيه، وميزانيتك كام. وهو يجمعلك بوكسات من البراندات المحلية في حدود الميزانية، وتضيفيها للسلة بدوسة.")}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {examples.map((e) => (
          <button key={e} type="button" onClick={() => openGiftAssistant(t(e))} className="chip border-brand/40 bg-bg text-brand transition-colors hover:bg-brand-soft">
            «{t(e)}»
          </button>
        ))}
      </div>
      <button type="button" onClick={() => openGiftAssistant()} className="btn-primary mt-6">
        {t("ابدئي المحادثة")}
      </button>
    </div>
  );
}

/** زرار المساعد في الهيدر */
export function AssistantHeaderButton() {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => openGiftAssistant()}
      aria-label={t("مساعد الهدايا")}
      className="flex h-9 items-center gap-1.5 rounded-full border-2 border-dashed border-brand px-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
    >
      <Bow className="w-5 text-brand" />
      <span className="hidden lg:inline">{t("مساعد الهدايا")}</span>
    </button>
  );
}
