"use server";

import { isLocale } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { repo } from "./db";

const MAX = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export type CustomImageResult = { ok: true; file: string } | { ok: false; error: string };

/**
 * صورة العميل للمنتج المخصص (برواز، مج بصورة…): بتترفع من صفحة الدفع قبل تأكيد الطلب.
 * بتتحفظ في التخزين الخاص زي صور التحويل، وصاحبة المتجر بس اللي تشوفها من اللوحة.
 */
export async function uploadCustomImage(locale: string, form: FormData): Promise<CustomImageResult> {
  const t = translator(isLocale(locale) ? locale : "ar");
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: t("اختار صورة") };
  if (!TYPES.includes(file.type)) return { ok: false, error: t("الصورة لازم تكون JPG أو PNG") };
  if (file.size > MAX) return { ok: false, error: t("الصورة كبيرة أوي") };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const saved = await repo().saveFile(`custom.${ext}`, Buffer.from(await file.arrayBuffer()));
  return { ok: true, file: saved };
}
