import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { waNumber } from "./admin-format";
import { loadContact } from "./store-setup";

/**
 * بيانات تواصل المتجر للعميل (من «الدفع والتواصل» في اللوحة).
 * متكاشة مع الكتالوج: الحفظ من اللوحة بيعمل updateTag("catalog").
 * لو رقم الواتساب لسه متحطش، كل أزرار التواصل بتختفي.
 */
export async function getContact() {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "site");
  const c = await loadContact().catch(() => ({ whatsapp: "", instagram: "", website: "" }));
  const phone = c.whatsapp.trim();
  return {
    phone,
    /** رقم الاتصال بالشكل اللي يتكتب: 01xxxxxxxxx */
    phoneDisplay: phone.replace(/^\+20/, "0"),
    tel: phone ? `tel:+${waNumber(phone)}` : "",
    whatsapp: phone ? `https://wa.me/${waNumber(phone)}` : "",
    instagram: c.instagram ? `https://instagram.com/${c.instagram}` : "",
  };
}
