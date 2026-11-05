"use client";

import { useT } from "@/i18n/client";
import { Bow } from "./decor";
import { openGiftAssistant } from "./gift-assistant";

const examples = ["هدية لماما بـ 600", "عيد ميلاد صاحبتي بـ 800، بتحب الشموع", "حاجة لزميلي في الشغل بـ 400"];

/** قسم في الرئيسية بيعرّف بمساعد الهدايا، وكل مثال بيفتح الشات بالرسالة دي */
export function AssistantPromo() {
  const t = useT();
  return (
    // شريط عريض وقصير: العنوان على جنب، والأمثلة والزرار على الجنب التاني
    <div className="reveal panel relative mx-auto grid max-w-6xl items-center gap-6 bg-paper px-6 py-8 shadow-[0_16px_28px_-22px_rgb(60_20_25/0.55)] sm:px-10 lg:grid-cols-[auto_1fr] lg:gap-12">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-soft">
          <Bow className="w-10 text-brand" />
        </span>
        <div>
          <p className="font-script text-2xl text-candy">{t("محتارة تجيبي إيه؟")}</p>
          <h2 className="text-3xl leading-tight text-brand sm:text-4xl">{t("اسألي مساعد الهدايا")}</h2>
          <p className="mt-1 text-ink-2">{t("قوليله الهدية لمين وميزانيتك كام، وهو يقترحلك.")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:items-end">
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {examples.map((e) => (
            <button key={e} type="button" onClick={() => openGiftAssistant(t(e))} className="chip border-brand/40 bg-bg text-brand transition-colors hover:bg-brand-soft">
              «{t(e)}»
            </button>
          ))}
        </div>
        <button type="button" onClick={() => openGiftAssistant()} className="btn-primary self-start lg:self-end">
          {t("ابدئي المحادثة")}
        </button>
      </div>
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
