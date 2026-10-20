"use server";

import { isLocale } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { isValidPhone } from "./cart";
import { addDays, cairoNow } from "./delivery";
import { supabaseConfigured } from "./supabase/public";
import { weddingTypes } from "./wedding";

export interface WeddingRequestInput {
  type: string;
  count: number;
  weddingDate: string;
  colors: string;
  names: string;
  notes: string;
  contactName: string;
  phone: string;
}

export type SpecialResult = { ok: true } | { ok: false; errors: string[] };

/** طلب فرح خاص: بيتراجع هنا، وبيتسجل في special_requests لما Supabase يتوصل */
export async function submitWeddingRequest(input: WeddingRequestInput, locale: string): Promise<SpecialResult> {
  const t = translator(isLocale(locale) ? locale : "ar");
  const errors: string[] = [];
  if (!weddingTypes.some((w) => w.id === input.type)) errors.push(t("اختاري نوع الطلب"));
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > 500) errors.push(t("العدد مش مظبوط"));
  if (!input.weddingDate) errors.push(t("اكتبي ميعاد الفرح"));
  else if (input.weddingDate < addDays(cairoNow().date, 1)) errors.push(t("ميعاد الفرح لازم يكون بعد النهارده"));
  if (!input.contactName.trim()) errors.push(t("اكتبي اسمك"));
  if (!isValidPhone(input.phone)) errors.push(t("رقم الواتساب مش مظبوط"));
  if (errors.length) return { ok: false, errors };

  return {
    ok: false,
    errors: [
      supabaseConfigured
        ? t("استقبال الطلبات الخاصة لسه بيتجهز. الطلب ده اتراجع وكل حاجة فيه سليمة.")
        : t("الموقع لسه مش متوصل بقاعدة البيانات، فالطلب اتراجع بس متسجلش."),
    ],
  };
}
