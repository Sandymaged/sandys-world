"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { loadSiteSettingsFresh, sections, writeSiteSettings, type QuoteSlot, type SiteSettings } from "./site-settings";

export type SiteSaveResult = { ok: true } | { ok: false; error: string };

/** حفظ إعدادات الموقع من اللوحة (الاقتباسات، اللي ظاهر، الأقسام، وقفل الموقع) */
export async function saveSiteSettings(form: FormData): Promise<SiteSaveResult> {
  await requireAdmin();
  const str = (k: string, max = 300) => String(form.get(k) ?? "").trim().slice(0, max);
  const all = (k: string) => form.getAll(k).map(String);
  const current = await loadSiteSettingsFresh();

  const quotes = { ...current.quotes };
  for (const slot of ["red", "blue", "paper"] as QuoteSlot[]) {
    quotes[slot] = {
      text: str(`q_${slot}_text`, 200),
      sub: str(`q_${slot}_sub`, 120),
      textEn: str(`q_${slot}_textEn`, 200),
      subEn: str(`q_${slot}_subEn`, 120),
    };
  }

  // الفورم بيبعت الكل (مخفي) واللي متعلّم عليه ظاهر، والباقي بيتخبى
  const visibleOcc = new Set(all("occ"));
  const visibleCat = new Set(all("cat"));
  const next: SiteSettings = {
    quotes,
    hiddenOccasions: all("occ_all").filter((s) => !visibleOcc.has(s)),
    hiddenCategories: all("cat_all").filter((c) => !visibleCat.has(c)),
    sections: Object.fromEntries(sections.map((s) => [s.id, form.get(`sec_${s.id}`) === "on"])) as SiteSettings["sections"],
    maintenance: {
      enabled: form.get("m_enabled") === "on",
      title: str("m_title", 120) || current.maintenance.title,
      message: str("m_message", 500) || current.maintenance.message,
      titleEn: str("m_titleEn", 120),
      messageEn: str("m_messageEn", 500),
    },
  };

  try {
    await writeSiteSettings(next);
  } catch (e) {
    return { ok: false, error: `ماتحفظش: ${e instanceof Error ? e.message : "حصلت مشكلة"}` };
  }
  updateTag("site");
  updateTag("catalog");
  return { ok: true };
}
