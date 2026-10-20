"use server";

import { isLocale } from "@/i18n/config";
import { suggestGifts, type AssistantReply, type ChatTurn } from "./assistant";
import { getStorefront, localizeStorefront } from "./catalog";

/** رسالة للمساعد: المحادثة كلها بتتبعت (السيرفر مش بيحفظ حاجة) */
export async function askAssistant(history: ChatTurn[], locale: string): Promise<AssistantReply> {
  const lang = isLocale(locale) ? locale : "ar";
  const clean = history
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .map((m) => ({ role: m.role, text: m.text.slice(0, 1000) }))
    .slice(-12);
  if (!clean.some((m) => m.role === "user")) return { mode: "rules", reply: "", suggestions: [] };
  const sf = localizeStorefront(await getStorefront(), lang);
  return suggestGifts(sf, clean, lang);
}
