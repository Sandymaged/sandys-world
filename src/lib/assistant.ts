import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import type { Locale } from "@/i18n/config";
import type { Storefront } from "./catalog";
import { cairoNow } from "./delivery";
import { latestBudget, packageSuggestion, priceSuggestion as price, productSuggestion, ruleSuggest, type AssistantReply, type ChatTurn, type Suggestion } from "./assistant-rules";
import { GIFT_CARD_MAX, GIFT_CARD_MIN, GIFT_CARD_VALID_DAYS } from "./gift-card";
import type { PackageView, Product } from "./types";

/*
 * مساعد الهدايا (قسم 7.1 في الـ SRS):
 * - الكود بيفلتر المنتجات المتاحة في حدود الميزانية (FR-151)
 * - Claude بيختار منها بس ويكتب السبب، والكود بيتأكد إن المجموع ≤ الميزانية وإن مفيش منتج مش موجود (FR-152)
 * - بيتكلم على إنه giftful نفسه، وبيدوّر في كل الهدايا: باكدج جاهز، أو منتج لوحده، أو بوكس بيركّبه (FR-153)
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
        type: z.enum(["box", "product", "package"]),
        title: z.string(),
        ids: z.array(z.string()),
        reason: z.string(),
      }),
    )
    .max(3),
  quick_replies: z.array(z.string()).max(3),
});

// ───────────── Claude ─────────────

const short = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n)}…` : s);

function systemPrompt(sf: Storefront, products: Product[], packages: PackageView[], locale: Locale) {
  const catalog = products.map((p) => ({
    id: p.id,
    name: p.name,
    name_en: p.en?.name ?? null,
    price: p.price,
    brand: p.brand,
    category: p.category,
    about: short(p.description),
    occasions: p.occasions,
    recipients: p.recipients,
    interests: p.interests,
    personalised: p.isCustomizable,
    can_go_in_box: p.boxEligible && !p.options?.length,
    has_colors_or_sizes: Boolean(p.options?.length),
    prep_days: p.prepDays,
  }));
  const ready = packages.map((p) => ({
    id: p.id,
    name: p.name,
    name_en: p.en?.name ?? null,
    price: p.price,
    about: short(p.description),
    contains: p.products.map((x) => (x.quantity > 1 ? `${x.quantity}× ${x.name}` : x.name)),
    occasions: p.occasions,
    recipients: p.recipients,
  }));
  const boxes = sf.boxSizes.map((b) => ({ name: b.name, price: b.price, max_items: b.maxItems }));
  // معلومات المتجر زي ما هي دلوقتي (عشان يرد على أسئلة الطلب والتوصيل والدفع من غير ما يألّف)
  const s = sf.settings;
  const store = {
    delivery_zones: sf.zones.map((z) => ({ name: z.name, fee: z.fee, same_day: z.sameDay, extra_days: z.extraDays })),
    same_day_orders_until: `${s.sameDayCutoffHour}:00 Cairo time`,
    delivery_periods: s.periods.map((p) => `${p.label} ${p.from}:00-${p.to}:00`),
    payment: ["InstaPay (send the transfer screenshot after ordering)", "cash on delivery"],
    wrapping_options: s.wrappings.map((w) => ({ name: w.name, price: w.price })),
    gift_cards: `giftful gift cards from ${GIFT_CARD_MIN} to ${GIFT_CARD_MAX} EGP, valid ${GIFT_CARD_VALID_DAYS} days, the store sends the code to the recipient on WhatsApp — on the "كارت هدية" page`,
    occasions: sf.occasions.map((o) => o.name),
    brands: sf.brands.map((b) => b.name),
    group_kits: sf.kits.map((k) => ({ name: k.name, price_per_person: k.pricePerPerson, kind: k.category })),
    card_message: `every gift can have a written card message (up to ${s.maxCardMessage} characters) and can hide the price`,
    sending: "customers can order from anywhere (another city, abroad, busy) and giftful prepares and delivers the gift for them. In the cart they choose whether their name shows on the gift or it arrives without the recipient knowing who sent it",
    today: `${cairoNow().date} (Cairo)`,
    current_season: sf.activeSeason ? { name: sf.activeSeason.name, date: sf.activeSeason.occasionDate } : null,
  };
  return `You are giftful — a gift shop in Assiut, Egypt — chatting with a customer on the shop's website. Speak as giftful itself ("I'm giftful", "عندنا", "هجهزهالك"), never as a generic AI or a separate assistant; if asked who you are, you are giftful. Customers describe who the gift is for, the occasion, interests and a budget (in Egyptian pounds, EGP), often in Egyptian Arabic, Franco-Arabic (Arabic in Latin letters with numbers like 3, 7, 2) or English.

Your job: search through ALL of giftful's gifts below and recommend the best 2 to 3 options. Each suggestion has a "type":
- "package": a ready-made package from READY PACKAGES. "ids" = [the package id]. Its price is fixed.
- "product": one product from PRODUCTS given on its own as a gift (great for personalised items, bigger items, or when one thing says it all). "ids" = [the product id].
- "box": a custom box YOU put together from 2 to 4 PRODUCTS that have can_go_in_box = true. "ids" = the product ids. The box is one of the BOX SIZES; its total is box price + products + a wrapping fee of ${Math.round(sf.settings.packaging.rate * 100)}% of (box + products), at least ${sf.settings.packaging.min} and at most ${sf.settings.packaging.max} EGP.
Mix the types when it makes sense (e.g. one ready package, one box you built, one single gift) and make the options really different from each other. If a ready package already matches well, include it. The shop's code recomputes every total and drops anything over budget or with an id that isn't listed, so use ids exactly as written and keep a margin under the budget.

How to answer:
- Write "reply" in the customer's language and style: Egyptian Arabic (Arabic script) if they wrote Arabic or Franco, English if they wrote English. Warm, short, like a friend who works at giftful.${locale === "en" ? " The site is in English mode." : ""} On your first reply, briefly introduce yourself as giftful.
- If you don't know who the gift is for, ask one short question and return no suggestions. If only the budget is missing, you may suggest options at different prices and ask for the budget.
- Each suggestion: a short catchy "title", the "ids", and a one-sentence "reason" tied to what the customer said.
- Products with colors or sizes are chosen on their page, personalised text or photos are added at checkout. Prices are estimates until the bag. Never invent products, prices or discounts.
- Put the budget you understood (a number in EGP) in "budget", or null.
- "quick_replies": up to 3 very short follow-ups the customer might tap next, written as the customer would say them in their language (e.g. "عايز أرخص شوية", "اقتراحات تانية", "حاجة يتكتب عليها الاسم", or budget options like "في حدود 500" when you asked for the budget).
- If they ask for something cheaper, aim clearly lower than your last suggestions. If they ask for other ideas, don't repeat ids from ALREADY SHOWN.
- If the customer asks about delivery, payment, gift cards, kits for groups or how ordering works, answer briefly from STORE INFO with no suggestions. Never make up policies; if something isn't in STORE INFO, say they can message giftful on WhatsApp.

STORE INFO: ${JSON.stringify(store)}

BOX SIZES: ${JSON.stringify(boxes)}

READY PACKAGES: ${JSON.stringify(ready)}

PRODUCTS (only what's available now): ${JSON.stringify(catalog)}`;
}

async function aiSuggest(sf: Storefront, history: ChatTurn[], locale: Locale, shown: string[]): Promise<AssistantReply | null> {
  // آخر ميزانية قالها (و«أرخص» بتنزّلها)، مش أكبر رقم في المحادثة
  const lastBudget = latestBudget(history);
  // FR-151: الكود بيفلتر قبل ما الموديل يشوف حاجة (كل المنتجات والباكدجات اللي في الميزانية)
  const products = sf.products.filter((p) => !p.isAddon && (lastBudget == null || p.price <= lastBudget));
  const packages = sf.packages.filter((p) => lastBudget == null || p.price <= lastBudget);
  if (products.length === 0 && packages.length === 0) return null;

  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(AiOutput) },
    cache_control: { type: "ephemeral" },
    // الكتالوج ثابت فبيتكاش، واللي اتعرض قبل كده في آخر المحادثة
    system: systemPrompt(sf, products, packages, locale),
    messages: history.slice(-12).map((m, i, all) => ({
      role: m.role,
      content: i === all.length - 1 && shown.length ? `${m.text}\n\n[ALREADY SHOWN ids: ${shown.join(", ")}]` : m.text,
    })),
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const out = response.parsed_output;
  const budget = out.budget ?? lastBudget;
  const byId = new Map(products.map((p) => [p.id, p]));
  const boxable = new Map(products.filter((p) => p.boxEligible).map((p) => [p.id, p]));
  const pkgById = new Map(packages.map((p) => [p.id, p]));
  // FR-152: الكود بيتأكد من كل اقتراح (موجود، والسعر في الميزانية)
  const suggestions = out.suggestions
    .map((s) => {
      // بوكس فيه حاجة واحدة بيتعرض «هدية لوحدها»
      if (s.type === "box" && new Set(s.ids).size > 1) return price(sf, boxable, s.ids, budget, s.title, s.reason);
      if (s.type === "package") {
        const pkg = pkgById.get(s.ids[0]);
        return pkg ? packageSuggestion(pkg, budget, s.title, s.reason) : null;
      }
      const p = byId.get(s.ids[0]);
      return p ? productSuggestion(p, budget, s.title, s.reason) : null;
    })
    .filter((s): s is Suggestion => s !== null)
    .slice(0, 3);
  return { mode: "ai", reply: out.reply, suggestions, quickReplies: out.quick_replies.map((q) => q.slice(0, 40)).slice(0, 3) };
}

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export async function suggestGifts(sf: Storefront, history: ChatTurn[], locale: Locale, shown: string[] = []): Promise<AssistantReply> {
  if (aiEnabled()) {
    try {
      const r = await aiSuggest(sf, history, locale, shown);
      if (r && (r.suggestions.length > 0 || r.reply)) return r;
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) console.warn("[assistant] rate limited, using rules");
      else if (err instanceof Anthropic.AuthenticationError) console.error("[assistant] bad ANTHROPIC_API_KEY, using rules");
      else if (err instanceof Anthropic.APIError) console.error(`[assistant] API error ${err.status}, using rules`);
      else console.error("[assistant] failed, using rules", err);
    }
  }
  return ruleSuggest(sf, history, locale, shown);
}
