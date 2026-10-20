// مساعد الهدايا من غير ذكاء اصطناعي: بيفهم الرسالة بالقواعد (عامي، فرانكو، إنجليزي) ويركّب بوكسات من الكتالوج.
// الحسابات هنا هي نفسها اللي بتتأكد من اقتراحات Claude (الكود هو اللي بيقرر السعر، مش الموديل).

import type { Locale } from "@/i18n/config";
import type { Storefront } from "./catalog";
import type { ProductOption } from "./options";
import { packagingFee } from "./pricing";
import type { BoxSize, Product, RecipientTag } from "./types";

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
  options?: ProductOption[];
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

// ───────────── الحسابات ─────────────

function smallestBox(sizes: BoxSize[], count: number): BoxSize | null {
  return [...sizes].sort((a, b) => a.maxItems - b.maxItems || a.price - b.price).find((s) => s.maxItems >= count) ?? null;
}

/** بيحوّل اختيار (IDs) لاقتراح متسعّر، أو null لو فيه منتج مش موجود أو المجموع فوق الميزانية */
export function priceSuggestion(
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
      options: p.options?.length ? p.options : undefined,
    })),
    box: { id: box.id, name: box.name, price: box.price },
    packaging,
    total,
  };
}

// ───────────── تنضيف النص ─────────────

const arabicDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/** بيوحّد الكتابة عشان القواعد تمسك أي شكل: أ/إ/آ ← ا، ة ← ه، ى ← ي، ومن غير تشكيل */
export function norm(text: string) {
  return arabicDigits(text)
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

// ───────────── الميزانية ─────────────

// المبالغ بالكلام: «خمسمية»، «ألف وخمسمية»، «ألفين»
const moneyWords: [RegExp, number][] = [
  [/تلت ?تلاف|ثلاث ?الاف/, 3000],
  [/الفين/, 2000],
  [/الف/, 1000],
  [/تسعميه|تسعمايه|تسعمائه/, 900],
  [/تمنميه|تمنمايه|ثمانمائه/, 800],
  [/سبعميه|سبعمايه|سبعمائه/, 700],
  [/ستميه|ستمايه|ستمائه/, 600],
  [/خمسميه|خمسمايه|خمسمائه/, 500],
  [/ربعميه|ربعمايه|اربعمائه/, 400],
  [/تلتميه|تلتمايه|ثلاثمائه/, 300],
  [/ميتين|مائتين/, 200],
  [/ميه|مايه|مائه/, 100],
];

export function parseBudget(text: string): number | null {
  const s = norm(text).replace(/,/g, "");
  const k = s.match(/(\d+(?:\.\d+)?)\s*(k|الف|alf)\b/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const nums = [...s.matchAll(/\d{2,6}/g)].map((m) => Number(m[0])).filter((n) => n >= 100 && n <= 50000);
  if (nums.length) return Math.max(...nums);
  // من غير أرقام: بنجمع كلمات الفلوس اللي ورا بعض (ألف + خمسمية = 1500)
  let rest = s;
  let total = 0;
  for (const [re, v] of moneyWords) {
    if (re.test(rest)) {
      total += v;
      rest = rest.replace(re, " ");
    }
  }
  return total >= 100 ? total : null;
}

// ───────────── لمين، والمناسبة، وبيحب إيه ─────────────

// الترتيب مهم: «ابن اختي» طفل مش «اختي»
const recipientWords: [RecipientTag, RegExp][] = [
  ["mom", /ماما|امي(?![ء-ي])|امى|والدتي|حماتي|mama|mom|mother|mommy|omy|ommy/],
  ["dad", /بابا|ابويا|ابوي(?![ء-ي])|والدي|حمايا|baba|dad|father|abuya/],
  ["kid", /طفل|بيبي|مولود|عيل|ابني|بنتي|ابن (اختي|اخويا|عمي|خالي)|بنت (اختي|اخويا)|kid|baby|child|\bson\b|daughter|ebni|benti/],
  ["colleague", /زميل|زميلت|مديري|مديرتي|المدير|الشغل|زمايل|زملا|colleague|boss|coworker|manager|zmeel|zameel/],
  ["her", /خطيبتي|مراتي|اختي|صاحبتي|صحبتي|حبيبتي|بنت (عمي|خالي)|عمتي|خالتي|تيتا|جدتي|\bher\b|wife|girlfriend|fiancee|sister|\bsis\b|bestie|okhti|o5ti|ukhti|sa7bti|sa7bty|7abibti|khatibti|merati/],
  ["him", /خطيبي|جوزي|اخويا|اخوي(?![ء-ي])|اخي(?![ء-ي])|صاحبي|حبيبي|ابن (عمي|خالي)|عمي(?![ء-ي])|خالي(?![ء-ي])|جدو|\bhim\b|husband|boyfriend|fiance\b|brother|\bbro\b|a5oya|akhoya|5oya|akhuya|khatibi|khatebi|gozi|7abibi|sa7by|sa7bi/],
];

const occasionWords: [string, RegExp][] = [
  ["christmas", /كريسماس|عيد الميلاد المجيد|راس السنه|christmas|xmas|new year/],
  ["mothers-day", /عيد الام|mother'?s day/],
  ["birthday", /عيد ميلاد|ميلاد|birthday|bday|b-day|3eed melad|3id milad|eid milad/],
  ["success", /نجاح|تخرج|نجح|نجحت|graduat|success|nga7|exam/],
  ["newborn", /مولود|ولاده|سبوع|new ?baby|newborn|mawlood/],
  ["get-well", /سلامت|عيان|عيانه|مريض|عمليه|get well|sick|salamt/],
  ["engagement", /خطوب|فرح|جواز|كتب كتاب|engag|wedding|5otoba|gawaz/],
  ["thanks", /شكر|thank/],
  ["ramadan", /رمضان|العيد|ramadan|\beid\b/],
];

interface Theme {
  id: string;
  label: { ar: string; en: string };
  title: { ar: string; en: string };
  /** كلام العميل */
  user: RegExp;
  /** بيطابق اسم المنتج أو تصنيفه أو اهتماماته أو وصفه */
  product: RegExp;
}

const themes: Theme[] = [
  {
    id: "food",
    label: { ar: "الأكل", en: "food" },
    title: { ar: "بوكس الأكيل", en: "The foodie box" },
    user: /اكل|بياكل|بتاكل|اكيل|اكيله|اكال|فود|foodie|food|snack|سناك|akl|a2l|akel|طعام|طبخ|cook/,
    product: /اكل|مكسرات|شوكولا|حلو|كيك|بسكو|سناك|عسل/,
  },
  {
    id: "sweets",
    label: { ar: "الحلويات", en: "sweets" },
    title: { ar: "بوكس الحلو", en: "Sweet tooth box" },
    user: /حلويات|الحلو(?![ء-ي])|شوكولا|شيكولا|chocolate|choco|sweet|candy|dessert|7elw|7alawiyat|shokola/,
    product: /شوكولا|حلويات|حلو(?![ء-ي])|كيك|بسكو|كاندي/,
  },
  {
    id: "drinks",
    label: { ar: "القهوة والشاي", en: "coffee and tea" },
    title: { ar: "ركن القهوة", en: "Coffee corner" },
    user: /قهو|كافي|نسكافيه|شاي|coffee|tea\b|ahwa|2ahwa|shay|latte|كوبايه/,
    product: /قهوه|شاي|اعشاب|مج(?![ء-ي])|مج /,
  },
  {
    id: "relax",
    label: { ar: "الشموع والريحة الحلوة", en: "candles and cozy scents" },
    title: { ar: "بوكس الراحة", en: "Cozy calm box" },
    user: /شمع|ريح|معطر|بخور|استرخ|هدوء|ريلاكس|candle|scent|relax|cozy|spa\b|sham3/,
    product: /شمع|استرخا|عطر|معطر|بخور|صابون|اعشاب/,
  },
  {
    id: "care",
    label: { ar: "العناية بالنفس", en: "self-care" },
    title: { ar: "بوكس الدلع", en: "Pamper box" },
    user: /عنايه|بشره|ميكب|ميك اب|سكين|skin|makeup|beauty|self ?care|pamper/,
    product: /عنايه|صابون|استرخا|بشره/,
  },
  {
    id: "flowers",
    label: { ar: "الورد", en: "flowers" },
    title: { ar: "ورد وحاجات حلوة", en: "Flowers and treats" },
    user: /ورد|زهور|flowers?|roses?|\bward\b/,
    product: /ورد|زهور/,
  },
  {
    id: "reading",
    label: { ar: "القراية والكتابة", en: "reading and writing" },
    title: { ar: "بوكس القراية", en: "Book lover box" },
    user: /قراي|قراءه|كتب|كتاب|بيقرا|بتقرا|كتابه|بيكتب|بتكتب|اجند|مذكر|journal|read|book|writ|notebook|planner|ketab/,
    product: /كتابه|قراءه|اجنده|ادوات مكتب|نوت|journal/,
  },
  {
    id: "home",
    label: { ar: "ديكور البيت", en: "home decor" },
    title: { ar: "حاجات للبيت", en: "Home touches" },
    user: /ديكور|للبيت|البيت|اوضه|اوضتها|اوضته|decor|home|room/,
    product: /ديكور|كوشن|برواز|زينه|شمع/,
  },
  {
    id: "memories",
    label: { ar: "الصور والذكريات", en: "photos and memories" },
    title: { ar: "بوكس الذكريات", en: "Memory box" },
    user: /صور|ذكري|ذكريات|memor|photo|picture/,
    product: /ذكريات|برواز|صوره/,
  },
  {
    id: "handmade",
    label: { ar: "الهاند ميد", en: "handmade things" },
    title: { ar: "هاند ميد من أسيوط", en: "Handmade picks" },
    user: /هاند ?ميد|يدوي|كروشيه|handmade|crochet|craft/,
    product: /هاند ميد|كروشيه|خشب|يدوي|محفور/,
  },
  {
    id: "cute",
    label: { ar: "الحاجات الكيوت", en: "cute things" },
    title: { ar: "بوكس كيوت", en: "Cute box" },
    user: /كيوت|دبدوب|دباديب|العاب|cute|teddy|plush|toy|kawaii/,
    product: /دبدوب|العاب|بالون|كروشيه/,
  },
];

// قبل الكلمة: «مش بيحب الحلو»، «ميحبش القهوة»، «doesn't like sweets»
const negation = /(مش|مبيحب|ميحبش|مابيحب|مبتحبش|متحبش|ماتحبش|بيكره|بتكره|بلاش|من غير|\bno\b|\bnot\b|don'?t|doesn'?t|hates?)\s*(بيحب|بتحب|يحب|تحب|like|likes|into)?\s*(ال)?\s*$/;

export interface Understood {
  budget: number | null;
  recipient: RecipientTag | null;
  occasion: string | null;
  likes: Theme[];
  dislikes: Theme[];
}

export function understand(text: string): Understood {
  const s = norm(text);
  const likes: Theme[] = [];
  const dislikes: Theme[] = [];
  for (const th of themes) {
    const re = new RegExp(th.user.source, "g");
    let liked = false;
    let disliked = false;
    for (const m of s.matchAll(re)) {
      if (negation.test(s.slice(Math.max(0, (m.index ?? 0) - 24), m.index))) disliked = true;
      else liked = true;
    }
    if (disliked) dislikes.push(th);
    else if (liked) likes.push(th);
  }
  return {
    budget: parseBudget(text),
    recipient: recipientWords.find(([, re]) => re.test(s))?.[0] ?? null,
    occasion: occasionWords.find(([, re]) => re.test(s))?.[0] ?? null,
    likes,
    dislikes,
  };
}

// ───────────── الكلام اللي بيرد بيه ─────────────

const forWho: Record<RecipientTag, { ar: string; en: string }> = {
  mom: { ar: "لماما", en: "for mom" },
  dad: { ar: "لبابا", en: "for dad" },
  him: { ar: "ليه", en: "for him" },
  her: { ar: "ليها", en: "for her" },
  kid: { ar: "لطفل", en: "for a little one" },
  colleague: { ar: "لزميل الشغل", en: "for a colleague" },
};
// «بيحب» للولد و«بتحب» للبنت
const loves = (r: RecipientTag | null) => (r === "her" || r === "mom" ? "بتحب" : "بيحب");

function joinList(items: string[], locale: Locale) {
  if (items.length <= 1) return items.join("");
  return locale === "en"
    ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`
    : `${items.slice(0, -1).join("، ")} و${items.at(-1)}`;
}

function summary(u: Understood, sf: Storefront, locale: Locale) {
  const en = locale === "en";
  const occ = u.occasion ? sf.occasions.find((o) => o.slug === u.occasion)?.name : null;
  const likes = joinList(
    u.likes.map((x) => (en ? x.label.en : x.label.ar)),
    locale,
  );
  if (en) {
    const parts = ["a gift", u.recipient ? forWho[u.recipient].en : "", occ ? `for ${occ}` : "", likes ? `for someone who loves ${likes}` : ""];
    return `Got it: ${parts.filter(Boolean).join(" ")}.`;
  }
  const parts = ["هدية", u.recipient ? forWho[u.recipient].ar : "", occ ? `في ${occ}` : "", likes ? `${loves(u.recipient)} ${likes}` : ""];
  return `فهمت: ${parts.filter(Boolean).join(" ")}.`;
}

const egpText = (n: number, locale: Locale) => (locale === "en" ? `${n} EGP` : `${n} ج.م`);

// ───────────── تركيب البوكسات ─────────────

/** بيبني بوكس: بيبدأ بالمنتجات اللي في أول القايمة، ويزوّد طول ما فيه مكان في الميزانية (لحد 4 حاجات) */
function fill(sf: Storefront, map: Map<string, Product>, start: string[], pool: Product[], budget: number): string[] {
  const pick = [...start];
  for (const p of pool) {
    if (pick.length >= 4) break;
    if (pick.includes(p.id)) continue;
    if (priceSuggestion(sf, map, [...pick, p.id], budget, "", "")) pick.push(p.id);
  }
  return pick;
}

/** اقتراحات بالقواعد: بتركز على اللي الشخص بيحبه، وكل اقتراح مختلف عن التاني */
export function ruleSuggest(sf: Storefront, history: ChatTurn[], locale: Locale): AssistantReply {
  const en = locale === "en";
  const said = history.filter((m) => m.role === "user").map((m) => m.text).join(" \n ");
  const u = understand(said);
  const nothingYet = u.budget == null && !u.recipient && !u.occasion && u.likes.length === 0;

  if (nothingYet) {
    return {
      mode: "rules",
      suggestions: [],
      reply: en
        ? "Tell me who the gift is for, what they love, and roughly your budget — e.g. “my brother loves food, 600”."
        : "قولّي الهدية لمين، وبيحب إيه، وميزانيتك تقريباً كام. مثلاً: «أخويا بيحب الأكل، بـ 600».",
    };
  }
  if (u.budget == null) {
    return {
      mode: "rules",
      suggestions: [],
      reply: en
        ? `${summary(u, sf, locale)} What's your budget, roughly? (e.g. 500 or 800)`
        : `${summary(u, sf, locale)} ميزانيتك تقريباً كام؟ (مثلاً 500 أو 800)`,
    };
  }

  const budget = u.budget;
  const textOf = (p: Product) => norm([p.name, p.category, ...p.interests, p.description, p.en?.name ?? ""].join(" "));
  const hits = (p: Product, list: Theme[]) => list.filter((th) => th.product.test(textOf(p))).length;
  const candidates = sf.products.filter((p) => p.boxEligible && p.price < budget && hits(p, u.dislikes) === 0);
  const map = new Map(candidates.map((p) => [p.id, p]));
  const score = (p: Product) =>
    hits(p, u.likes) * 6 +
    (u.occasion && p.occasions.includes(u.occasion) ? 3 : 0) +
    (u.recipient && p.recipients.includes(u.recipient) ? 2 : 0) +
    p.price / 2000;
  const ranked = [...candidates].sort((a, b) => score(b) - score(a));
  const matched = ranked.filter((p) => hits(p, u.likes) > 0);
  const others = ranked.filter((p) => hits(p, u.likes) === 0);
  const theme = u.likes[0] ?? null;
  const name = (id: string) => map.get(id)!.name;

  const plans: { ids: string[]; title: string; reason: string }[] = [];
  const liked = theme ? joinList(u.likes.map((x) => (en ? x.label.en : x.label.ar)), locale) : "";

  // ١) اللي بيحبه بالظبط
  if (matched.length) {
    let ids = fill(sf, map, [matched[0].id], matched, budget);
    if (ids.length < 2) ids = fill(sf, map, ids, others, budget);
    plans.push({
      ids,
      title: en ? theme!.title.en : theme!.title.ar,
      reason: en
        ? `Because they love ${liked}: ${joinList(ids.map(name), locale)}.`
        : `علشان ${loves(u.recipient)} ${liked}: ${joinList(ids.map(name), locale)}.`,
    });
  }
  // ٢) هدية بالاسم (لو فيه منتج بيتكتب عليه)
  const personal = ranked.find((p) => p.isCustomizable && !plans.some((pl) => pl.ids[0] === p.id));
  if (personal) {
    const ids = fill(sf, map, [personal.id], [...matched, ...others], budget);
    const rest = ids.filter((id) => id !== personal.id).map(name);
    plans.push({
      ids,
      title: en ? "With their name on it" : "هدية بالاسم",
      reason: en
        ? `Their name on the ${personal.name} makes it feel made just for them${rest.length ? `, together with ${joinList(rest, locale)}` : ""}.`
        : `الاسم مكتوب على ${personal.name}، فبتبقى هدية شخصية أكتر${rest.length ? `، ومعاها ${joinList(rest, locale)}` : ""}.`,
    });
  }
  // ٣) خليط: حاجة من اللي بيحبه + حاجات تانية مختلفة عن اللي فات
  const usedFirst = new Set(plans.flatMap((pl) => pl.ids));
  const anchor = matched.find((p) => !usedFirst.has(p.id)) ?? matched[0] ?? ranked.find((p) => !usedFirst.has(p.id)) ?? ranked[0];
  if (anchor) {
    const fresh = [...others, ...matched].filter((p) => !usedFirst.has(p.id));
    const ids = fill(sf, map, [anchor.id], fresh.length ? fresh : ranked, budget);
    plans.push({
      ids,
      title: en ? "A little of everything" : "مزيج حلو",
      reason: en ? `A bit of everything: ${joinList(ids.map(name), locale)}.` : `شوية من كل حاجة: ${joinList(ids.map(name), locale)}.`,
    });
  }

  // من غير اهتمامات: أحسن بوكس للمناسبة ولمين
  if (!theme && ranked.length) {
    const ids = fill(sf, map, [ranked[0].id], ranked, budget);
    plans.unshift({
      ids,
      title: en ? "Our pick" : "اختيارنا ليك",
      reason: en
        ? `Picked for the occasion and who it's for, within ${egpText(budget, locale)}.`
        : `مختارين على المناسبة واللي هيستلمها، وفي حدود ${egpText(budget, locale)}.`,
    });
  }

  // اتسعّر، وشيل اللي فوق الميزانية واللي متكرر
  const seen = new Set<string>();
  const suggestions = plans
    .map((pl) => priceSuggestion(sf, map, pl.ids, budget, pl.title, pl.reason))
    .filter((s): s is Suggestion => {
      if (!s) return false;
      const key = s.items.map((i) => i.productId).sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);

  let reply: string;
  if (!suggestions.length) {
    reply = en
      ? "I couldn't fit a box in that budget. Try a slightly higher budget, or have a look at the ready packages."
      : "ملقيتش بوكس يدخل في الميزانية دي. جرّب ميزانية أعلى شوية أو شوف الباكدجات الجاهزة.";
  } else {
    const head = summary(u, sf, locale);
    const missing =
      theme && !matched.length
        ? en
          ? ` I couldn't find ${liked} items within this budget, so here are close picks.`
          : ` ملقيتش حاجات عن ${liked} في الميزانية دي، فدي اقتراحات قريبة.`
        : "";
    const n = suggestions.length;
    const count = en
      ? n === 1 ? "an idea" : `${n} ideas`
      : n === 1 ? "ده اقتراح" : n === 2 ? "دول اقتراحين" : `دي ${n} اقتراحات`;
    const body = en
      ? ` Here's ${count} within ${egpText(budget, locale)}. Prices are estimates; the final total is confirmed in the bag.`
      : ` ${count} في حدود ${egpText(budget, locale)}. الأسعار مبدئية، والنهائي بيتأكد في السلة.`;
    const hint = !theme ? (en ? " Tell me what they love and I'll tailor it more." : ` لو قولتلي ${loves(u.recipient)} إيه هظبطها أكتر.`) : "";
    reply = head + missing + body + hint;
  }
  return { mode: "rules", suggestions, reply };
}
