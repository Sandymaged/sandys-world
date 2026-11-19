import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { adminClient } from "./supabase/admin";
import { publicClient, supabaseConfigured } from "./supabase/public";
import { DEFAULT_MODE, type ModeSettings } from "./modes";

/*
 * إعدادات الموقع اللي صاحبة المتجر بتغيرها من اللوحة من غير مبرمج:
 * الاقتباسات، المناسبات وتصنيفات المنتجات اللي ظاهرة، الأقسام المفتوحة، وقفل الموقع كله برسالة.
 * على Supabase: صف واحد في جدول settings (key = "site"). من غيره: .data/site.json
 */

export type SectionId = "bride" | "kits" | "box" | "giftCard" | "sendToAssiut" | "brands";

export const sections: { id: SectionId; label: string; path: string }[] = [
  { id: "bride", label: "العروسة والإشبينات", path: "/bride" },
  { id: "kits", label: "ورشة مع الصحاب", path: "/kits" },
  { id: "box", label: "اعمل البوكس بنفسك", path: "/box" },
  { id: "giftCard", label: "كارت هدية", path: "/gift-card" },
  { id: "sendToAssiut", label: "ابعت لأهلك في أسيوط", path: "/send-to-assiut" },
  { id: "brands", label: "البراندات المحلية", path: "/brands" },
];

export interface QuoteText {
  text: string;
  sub: string;
  textEn: string;
  subEn: string;
}

export type QuoteSlot = "red" | "blue" | "paper";

export interface SiteSettings {
  quotes: Record<QuoteSlot, QuoteText>;
  hiddenOccasions: string[];
  hiddenCategories: string[];
  sections: Record<SectionId, boolean>;
  maintenance: { enabled: boolean; title: string; message: string; titleEn: string; messageEn: string };
  /** مود المناسبة (كريسماس، عيد الحب…) */
  mode: ModeSettings;
}

export const DEFAULT_SITE: SiteSettings = {
  quotes: {
    red: {
      text: "الهدية مش بتمنها… الهدية إن حد افتكرك.",
      sub: "",
      textEn: "A gift isn't about its price… it's about someone remembering you.",
      subEn: "",
    },
    blue: {
      text: "كلمة حلوة في كارت… ممكن تفضل محفوظة في درج سنين.",
      sub: "",
      textEn: "A kind word on a card… can stay tucked in a drawer for years.",
      subEn: "",
    },
    paper: {
      text: "أحلى حاجة في الهدية… الوش اللي بيتفتح وهو بيفكها.",
      sub: "",
      textEn: "The best part of a gift… the face that lights up while unwrapping it.",
      subEn: "",
    },
  },
  hiddenOccasions: [],
  hiddenCategories: [],
  sections: { bride: true, kits: true, box: true, giftCard: true, sendToAssiut: true, brands: true },
  maintenance: {
    enabled: false,
    title: "بنجهزلكم حاجة حلوة",
    message: "الموقع واقف شوية عشان بنظبط حاجات جديدة. راجعين قريب جداً، استنونا!",
    titleEn: "Something lovely is on its way",
    messageEn: "We're taking a short break to get new things ready. We'll be back very soon!",
  },
  mode: DEFAULT_MODE,
};

const FILE = path.join(process.cwd(), ".data", "site.json");
const onServerSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

/** القيم المحفوظة فوق الافتراضي (عشان لو ضفنا إعداد جديد بعدين يبقى ليه قيمة) */
function merge(saved: Partial<SiteSettings> | null | undefined): SiteSettings {
  const d = DEFAULT_SITE;
  const s = saved ?? {};
  return {
    quotes: {
      red: { ...d.quotes.red, ...s.quotes?.red },
      blue: { ...d.quotes.blue, ...s.quotes?.blue },
      paper: { ...d.quotes.paper, ...s.quotes?.paper },
    },
    hiddenOccasions: s.hiddenOccasions ?? d.hiddenOccasions,
    hiddenCategories: s.hiddenCategories ?? d.hiddenCategories,
    sections: { ...d.sections, ...s.sections },
    maintenance: { ...d.maintenance, ...s.maintenance },
    mode: { ...d.mode, ...s.mode, banners: { ...s.mode?.banners } },
  };
}

async function loadSaved(): Promise<Partial<SiteSettings> | null> {
  if (supabaseConfigured) {
    const { data, error } = await publicClient().from("settings").select("value").eq("key", "site").maybeSingle();
    if (error) throw error;
    return (data?.value as Partial<SiteSettings>) ?? null;
  }
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return null;
  }
}

/** للصفحات (متخزنة، وبتتحدث أول ما اللوحة تحفظ) */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("site");
  return merge(await loadSaved());
}

/** للوحة: من غير كاش عشان تشوف آخر حاجة اتحفظت */
export async function loadSiteSettingsFresh(): Promise<SiteSettings> {
  return merge(await loadSaved());
}

export async function writeSiteSettings(s: SiteSettings) {
  if (onServerSupabase()) {
    const { error } = await adminClient().from("settings").upsert({ key: "site", value: s });
    if (error) throw new Error(error.message);
    return;
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(`${FILE}.tmp`, JSON.stringify(s, null, 2), "utf8");
  await rename(`${FILE}.tmp`, FILE);
}

// لينك ظاهر ولا لأ حسب إعدادات الموقع: القسم مقفول أو المناسبة مخفية
export function linkVisible(href: string, site: SiteSettings) {
  const sec = sections.find((x) => href === x.path || href.startsWith(`${x.path}/`));
  if (sec && !site.sections[sec.id]) return false;
  const occ = href.match(/^\/occasions\/([^/?#]+)/)?.[1];
  return !(occ && site.hiddenOccasions.includes(occ));
}

export async function sectionOpen(id: SectionId) {
  return (await getSiteSettings()).sections[id];
}
