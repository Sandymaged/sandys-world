import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import type { Locale } from "@/i18n/config";
import type { Storefront } from "./catalog";
import { parseBudget, priceSuggestion as price, ruleSuggest, type AssistantReply, type ChatTurn, type Suggestion } from "./assistant-rules";
import type { Product } from "./types";

/*
 * مساعد الهدايا (قسم 7.1 في الـ SRS):
 * - الكود بيفلتر المنتجات المتاحة في حدود الميزانية (FR-151)
 * - Claude بيختار منها بس ويكتب السبب، والكود بيتأكد إن المجموع ≤ الميزانية وإن مفيش منتج مش موجود (FR-152)
 * - من 2 لـ 3 اقتراحات، كل واحد بيتضاف للسلة كبوكس (FR-153)
 * - أي سعر من المساعد "مبدئي"، والسعر النهائي من السيرفر وقت الطلب (FR-155)
 */

export type { AssistantReply, ChatTurn, Suggestion, SuggestionItem } from "./assistant-rules";

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
