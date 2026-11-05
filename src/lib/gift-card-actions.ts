"use server";

import { isLocale } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { repo } from "@/lib/db";
import { normalizeGiftCardCode } from "@/lib/gift-card";

// شراء كارت الهدية نفسه بقى من السلة والدفع زي أي منتج (checkout-actions.ts)

/** في صفحة الدفع: الكود ده صالح وفيه كام؟ */
export async function checkGiftCard(code: string, locale: string) {
  const t = translator(isLocale(locale) ? locale : "ar");
  const c = await repo().getGiftCard(normalizeGiftCardCode(code));
  if (!c) return { ok: false as const, message: t("كارت الهدية ده مش موجود") };
  if (Date.parse(c.expiresAt) < Date.now()) return { ok: false as const, message: t("كارت الهدية ده انتهت صلاحيته") };
  if (c.balance <= 0) return { ok: false as const, message: t("رصيد كارت الهدية خلص") };
  return { ok: true as const, code: c.code, balance: c.balance };
}
