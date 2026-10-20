import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import type { Locale } from "@/i18n/config";
import { translator } from "@/i18n/t";
import type { Storefront } from "./catalog";
import { packagingFee } from "./pricing";
import type { BoxSize, Product, RecipientTag } from "./types";

/*
 * مساعد الهدايا (قسم 7.1 في الـ SRS):
 * - الكود بيفلتر المنتجات المتاحة في حدود الميزانية (FR-151)
 * - Claude بيختار منها بس ويكتب السبب، والكود بيتأكد إن المجموع ≤ الميزانية وإن مفيش منتج مش موجود (FR-152)
 * - من 2 لـ 3 اقتراحات، كل واحد بيتضاف للسلة كبوكس (FR-153)
 * - أي سعر من المساعد "مبدئي"، والسعر النهائي من السيرفر وقت الطلب (FR-155)
 */

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface SuggestionItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  brand: string | null;
  isCustomizable: boolean;
  maxChars: number | null;
  prepDays: number;
}

export interface Suggestion {
  title: string;
  reason: string;
  items: SuggestionItem[];
  box: { id: string; name: string; price: number };
  packaging: number;
  total: number;
}

export interface AssistantReply {
  reply: string;
  suggestions: Suggestion[];
  mode: "ai" | "rules";
}

const MODEL = "claude-opus-5-5";

const AiOutput = z.object({
  reply: z.string(),
  budget: z.number().nullable(),
  suggestions: z
    .array(
      z.object({
        title: z.string(),
        product_ids: z.array(z.string()),
        reason: z.string(),
      }),
    )
    .max(3),
});

// ───────────── الحسابات (الكود هو اللي بيقرر، مش الموديل) ─────────────

function smallestBox(sizes: BoxSize[], count: number): BoxSize | null {
  return [...sizes].sort((a, b) => a.maxItems - b.maxItems || a.price - b.price).find((s) => s.maxItems >= count) ?? null;
}

/** بيحوّل اختيار (IDs) لاقتراح متسعّر، أو null لو فيه منتج مش موجود أو المجموع فوق الميزانية */
function price(
  sf: Storefront,
  candidates: Map<string, Product>,
  ids: string[],
  budget: number | null,
  title: string,
  reason: string,
): Suggestion | null {
  const unique = [...new Set(ids)];
  if (unique.length < 1) return null;
  const items = unique.map((id) => candidates.get(id));
  if (items.some((p) => !p)) return null;
  const products = items as Product[];
  const box = smallestBox(sf.boxSizes, products.length);
  if (!box) return null;
  const itemsTotal = products.reduce((s, p) => s + p.price, 0);
  const packaging = packagingFee(box.price + itemsTotal, sf.settings.packaging);
  const total = box.price + itemsTotal + packaging;
  if (budget != null && total > budget) return null;
  return {
    title,
    reason,
    items: products.map((p) => ({
      productId: p.id,
      name: p.name,
      price: p.price,
      image: p.images[0] ?? null,
      brand: p.brand,
      isCustomizable: p.isCustomizable,
      maxChars: p.customizationMaxChars,
      prepDays: p.prepDays,
    })),
    box: { id: box.id, name: box.name, price: box.price },
    packaging,
    total,
  };
}

// ───────────── فهم الرسالة بالقواعد (بيشتغل من غير مفتاح كمان) ─────────────

const arabicDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export function parseBudget(text: string): number | null {
  const s = arabicDigits(text.toLowerCase()).replace(/,/g, "");
  const k = s.match(/(\d+(?:\.\d+)?)\s*(k|ألف|الف|alf)/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const nums = [...s.matchAll(/\d{2,6}/g)].map((m) => Number(m[0])).filter((n) => n >= 100 && n <= 50000);
  return nums.length ? Math.max(...nums) : null;
}

const recipientWords: [RecipientTag, RegExp][] = [
  ["mom", /ماما|امي|أمي|والدت|mama|mom|mother|omy|ommy/],
  ["dad", /بابا|ابويا|أبويا|والد[يى]|baba|dad|father/],
  ["kid", /طفل|بيبي|مولود|عيل|ابن|بنتي|kid|baby|child|beby/],
  ["colleague", /زميل|مدير|شغل|زملا|colleague|boss|coworker|work|zmeel/],
  ["him", /خطيبي|جوزي|اخويا|أخويا|صاحبي|حبيبي|him|husband|boyfriend|brother|khatebi|gozi|sa7by/],
  ["her", /خطيبتي|مراتي|اختي|أختي|صاحبتي|حبيبتي|her|wife|girlfriend|sister|bestie|okhti|sa7bty|habibti/],
];

const occasionWords: [string, RegExp][] = [
  ["birthday", /عيد ميلاد|ميلاد|birthday|bday|3eed melad|3id milad/],
  ["success", /نجاح|تخرج|graduat|success|nga7/],
  ["newborn", /مولود|ولادة|new ?baby|newborn|mawlood/],
  ["get-well", /سلامت|عيان|مريض|get well|sick|salamt/],
  ["mothers-day", /عيد الأم|عيد الام|mother'?s day/],
  ["engagement", /خطوب|فرح|جواز|engag|wedding|5otoba|gawaz/],
  ["thanks", /شكر|thank/],
  ["christmas", /كريسماس|الكريسماس|عيد الميلاد المجيد|christmas|xmas/],
  ["ramadan", /رمضان|عيد|ramadan|eid/],
];

function detect(text: string) {
  const s = text.toLowerCase();
  return {
    budget: parseBudget(text),
    recipient: recipientWords.find(([, re]) => re.test(s))?.[0] ?? null,
    occasion: occasionWords.find(([, re]) => re.test(s))?.[0] ?? null,
  };
}

/** اقتراحات بالقواعد: ترتيب المنتجات حسب المناسبة ولمين، وتعبئة لحد الميزانية */
function ruleSuggest(sf: Storefront, history: ChatTurn[], locale: Locale): AssistantReply {
  const t = translator(locale);
  const all = history.filter((m) => m.role === "user").map((m) => m.text).join(" \n ");
  const d = detect(all);
  if (d.budget == null) {
    return {
      mode: "rules",
      suggestions: [],
      reply: t("تمام! الهدية دي لمين، وميزانيتك تقريباً كام؟ (مثلاً: لماما بـ 600)"),
    };
  }
  const budget = d.budget;
  const candidates = sf.products.filter((p) => p.boxEligible && p.price <= budget);
  const score = (p: Product) =>
    (d.occasion && p.occasions.includes(d.occasion) ? 3 : 0) + (d.recipient && p.recipients.includes(d.recipient) ? 2 : 0) + p.price / 1000;
  const ranked = [...candidates].sort((a, b) => score(b) - score(a));
  const map = new Map(candidates.map((p) => [p.id, p]));
  const out: Suggestion[] = [];
  const used = new Set<string>();
  for (let start = 0; start < ranked.length && out.length < 3; start++) {
    if (used.has(ranked[start].id)) continue;
    const pick: string[] = [ranked[start].id];
    for (const p of ranked) {
      if (pick.includes(p.id) || pick.length >= 4) continue;
      if (price(sf, map, [...pick, p.id], budget, "", "")) pick.push(p.id);
    }
    const s = price(sf, map, pick, budget, "", "");
    if (!s) continue;
    pick.forEach((id) => used.add(id));
    const n = out.length + 1;
    out.push({
      ...s,
      title: t("اقتراح {n}", { n }),
      reason: t("مختارين على المناسبة واللي هتستلمها، وفي حدود {budget}.", { budget: `${budget} ${locale === "en" ? "EGP" : "ج.م"}` }),
    });
  }
  return {
    mode: "rules",
    suggestions: out,
    reply: out.length
      ? t("دي {n} اقتراحات في حدود ميزانيتك. الأسعار مبدئية، والنهائي بيتأكد في السلة.", { n: out.length })
      : t("ملقيتش بوكس يدخل في الميزانية دي. جرّبي ميزانية أعلى شوية أو شوفي الباكدجات الجاهزة."),
  };
}

// ───────────── Claude ─────────────

function systemPrompt(sf: Storefront, candidates: Product[], locale: Locale) {
  const catalog = candidates.map((p) => ({
    id: p.id,
    name: p.name,
    name_en: p.en?.name ?? null,
    price: p.price,
    brand: p.brand,
    category: p.category,
    occasions: p.occasions,
    recipients: p.recipients,
    interests: p.interests,
    personalised: p.isCustomizable,
    prep_days: p.prepDays,
  }));
  const boxes = sf.boxSizes.map((b) => ({ name: b.name, price: b.price, max_items: b.maxItems }));
  return `You are the gift assistant of a small gift shop in Assiut, Egypt. Customers describe who the gift is for, the occasion, interests and a budget (in Egyptian pounds, EGP), often in Egyptian Arabic, Franco-Arabic (Arabic in Latin letters with numbers like 3, 7, 2) or English.

Your job: suggest 2 to 3 gift boxes built only from the products in the catalog below. Each box is one of the box sizes below; its total is box price + products + a wrapping fee of ${Math.round(sf.settings.packaging.rate * 100)}% of (box + products), at least ${sf.settings.packaging.min} and at most ${sf.settings.packaging.max} EGP. The shop's code recomputes every total and drops any suggestion that goes over budget or uses an id that isn't in the catalog, so only use ids exactly as written and keep a margin under the budget.

How to answer:
- Write "reply" in the customer's language and style: Egyptian Arabic (Arabic script) if they wrote Arabic or Franco, English if they wrote English. Warm, short, like a friend who works at the shop.${locale === "en" ? " The site is in English mode." : ""}
- If the budget or who the gift is for is missing and you can't reasonably guess, ask one short question in "reply" and return no suggestions.
- Each suggestion: a short catchy "title", 2 to 4 "product_ids" that fit together, and a one-sentence "reason" tied to what the customer said. Make the suggestions different from each other (e.g. one cozy, one sweet, one personalised).
- Mention that prices are estimates and personalised items need their text in the bag. Never invent products, prices or discounts.
- Put the budget you understood (a number in EGP) in "budget", or null.

Box sizes: ${JSON.stringify(boxes)}

Catalog (already filtered to what's available): ${JSON.stringify(catalog)}`;
}

async function aiSuggest(sf: Storefront, history: ChatTurn[], locale: Locale): Promise<AssistantReply | null> {
  const lastBudget = parseBudget(history.filter((m) => m.role === "user").map((m) => m.text).join(" "));
  // FR-151: الكود بيفلتر قبل ما الموديل يشوف حاجة
  const candidates = sf.products.filter((p) => p.boxEligible && (lastBudget == null || p.price <= lastBudget));
  if (candidates.length === 0) return null;

  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(AiOutput) },
    cache_control: { type: "ephemeral" },
    system: systemPrompt(sf, candidates, locale),
    messages: history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const out = response.parsed_output;
  const budget = out.budget ?? lastBudget;
  const map = new Map(candidates.map((p) => [p.id, p]));
  // FR-152: الكود بيتأكد من كل اقتراح
  const suggestions = out.suggestions
    .map((s) => price(sf, map, s.product_ids, budget, s.title, s.reason))
    .filter((s): s is Suggestion => s !== null)
    .slice(0, 3);
  return { mode: "ai", reply: out.reply, suggestions };
}

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export async function suggestGifts(sf: Storefront, history: ChatTurn[], locale: Locale): Promise<AssistantReply> {
  if (aiEnabled()) {
    try {
      const r = await aiSuggest(sf, history, locale);
      if (r && (r.suggestions.length > 0 || r.reply)) return r;
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) console.warn("[assistant] rate limited, using rules");
      else if (err instanceof Anthropic.AuthenticationError) console.error("[assistant] bad ANTHROPIC_API_KEY, using rules");
      else if (err instanceof Anthropic.APIError) console.error(`[assistant] API error ${err.status}, using rules`);
      else console.error("[assistant] failed, using rules", err);
    }
  }
  return ruleSuggest(sf, history, locale);
}
