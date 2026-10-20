// بيانات تجريبية. الموقع بيستخدمها لو Supabase مش متوصل،
// ونفس البيانات بتتحول لـ supabase/seed.sql بأمر: npm run db:seed-sql
// الأسعار ورسوم التوصيل هنا مبدئية، مش أرقام نهائية.

import type {
  BoxSize,
  GiftPackage,
  Kit,
  Occasion,
  Partner,
  Product,
  RecipientTag,
  Season,
  Zone,
} from "./types";

import { boxSizesEn, bridalEn, kitsEn, occasionsEn, packagesEn, partnersEn, productsEn, seasonsEn, zonesEn } from "./seed-en.ts";

// صور مؤقتة من Unsplash (مجانية للاستخدام التجاري) لحد ما المنتجات الحقيقية تتصور
const photo = (unsplashId: string) =>
  `https://images.unsplash.com/photo-${unsplashId}?auto=format&fit=crop&w=1200&q=80`;

const id = (group: number, n: number) =>
  `00000000-0000-4000-8000-${String(group).padStart(4, "0")}${String(n).padStart(8, "0")}`;

export const occasions: Occasion[] = [
  { slug: "birthday", name: "عيد ميلاد", sort: 1, image: photo("1607478900766-efe13248b125") },
  { slug: "success", name: "نجاح وتخرج", sort: 2, image: photo("1512909006721-3d6018887383") },
  { slug: "newborn", name: "مولود جديد", sort: 3, image: photo("1522771930-78848d9293e8") },
  { slug: "get-well", name: "سلامتك", sort: 4, image: photo("1544787219-7f47ccb76574") },
  { slug: "mothers-day", name: "عيد الأم", sort: 5, image: photo("1561181286-d3fee7d55364") },
  { slug: "engagement", name: "خطوبة وجواز", sort: 6, image: photo("1606800052052-a08af7148866") },
  { slug: "thanks", name: "شكر", sort: 7, image: photo("1608755728617-aefab37d2edd") },
  { slug: "ramadan", name: "رمضان والعيد", sort: 8, image: photo("1576092768241-dec231879fc3") },
  { slug: "christmas", name: "الكريسماس", sort: 9, image: photo("1543589077-47d81606c1bf") },
];

export const recipientLabels: Record<RecipientTag, string> = {
  her: "ليها",
  him: "ليه",
  mom: "لماما",
  dad: "لبابا",
  kid: "لطفل",
  colleague: "لزميل",
};

export const partners: Partner[] = [
  { id: id(1, 1), slug: "noon-workshop", name: "ورشة نون", tagline: "جلد وكروشيه بإيدين بنات أسيوط", story: "ورشة صغيرة بدأت في أوضة في بيت، بتعمل أجندات جلد متخيطة يدوي وميداليات كروشيه، كل قطعة بتاخد وقتها.", city: "أسيوط", instagram: "noon.workshop", cover: photo("1531346878377-a5be20888e57"), commissionRate: 0.2 },
  { id: id(1, 2), slug: "saeed-naturals", name: "طبيعي من الصعيد", tagline: "صابون وأعشاب من خير الصعيد", story: "صابون معمول على البارد بزيت الزيتون، وتشكيلات شاي أعشاب من عطارة العيلة.", city: "أبنوب", instagram: "saeed.naturals", cover: photo("1612817288484-6f916006741a"), commissionRate: 0.25 },
  { id: id(1, 3), slug: "print-with-love", name: "طباعة بحب", tagline: "اسمك على أي حاجة", story: "استوديو طباعة صغير بيطبع على المجات والكوشنات والبراويز، وبيبعتلك شكل التصميم توافق عليه الأول.", city: "أسيوط", instagram: "printwithlove.ast", cover: photo("1514228742587-6b1558fcca3d"), commissionRate: 0.2 },
  { id: id(1, 4), slug: "nour-candles", name: "نور للشموع", tagline: "شموع صويا بريحة البيت", story: "شموع صويا متصبوبة باليد في برطمانات بتتعاد استخدامها، وريحة على ذوق كل موسم.", city: "أسيوط الجديدة", instagram: "nour.candles", cover: photo("1602874801007-bd458bb1b8b6"), commissionRate: 0.22 },
  { id: id(1, 5), slug: "garden-roses", name: "ورد الجنينة", tagline: "ورد طبيعي متنسق كل صبح", story: "محل ورد عيلة في قلب أسيوط، الورد بيوصل كل صبح وبيتنسق قدام عينك.", city: "أسيوط", instagram: "garden.roses.ast", cover: photo("1563241527-3004b7be0ffd"), commissionRate: 0.18 },
  { id: id(1, 6), slug: "mira-treats", name: "ميرا للحلويات", tagline: "شوكولاتة ومكسرات بلمسة بيتي", story: "شوكولاتة بلجيكي متشكلة في مطبخ صغير، ومكسرات بتتحمص على الطلب.", city: "منفلوط", instagram: "mira.treats", cover: photo("1599599810769-bcde5a160d32"), commissionRate: 0.2 },
  { id: id(1, 7), slug: "wood-carve", name: "خشب ونقش", tagline: "حفر بالليزر على الخشب الطبيعي", story: "ورشة خشب بتحفر الأسامي والتواريخ على ميداليات وبراويز من خشب طبيعي.", city: "أسيوط", instagram: "wood.carve", cover: photo("1513201099705-a9746e1e201f"), commissionRate: 0.2 },
  { id: id(1, 8), slug: "little-stitch", name: "ليتل ستيتش", tagline: "تطريز وهدايا للمواليد", story: "أم بتطرّز أسامي المواليد على بطاطين قطن، ومعاها دباديب طرية للبيبي.", city: "ديروط", instagram: "little.stitch", cover: photo("1522771930-78848d9293e8"), commissionRate: 0.2 },
];

type P = Omit<Product, "id" | "isAvailable" | "isAddon" | "boxEligible" | "partnerId" | "brand"> &
  Partial<Pick<Product, "isAvailable" | "isAddon" | "boxEligible" | "partnerId" | "brand">>;

const productDefs: P[] = [
  { slug: "name-mug", images: [photo("1514228742587-6b1558fcca3d")], name: "مج مطبوع بالاسم", description: "مج سيراميك أبيض مطبوع عليه الاسم أو جملة قصيرة تختارها.", price: 180, category: "مجات", occasions: ["birthday", "success", "thanks", "mothers-day"], recipients: ["her", "him", "mom", "dad", "colleague"], interests: ["قهوة", "شاي"], isCustomizable: true, customizationMaxChars: 25, prepDays: 2, partnerId: id(1, 3) },
  { slug: "scented-candle", images: [photo("1602874801007-bd458bb1b8b6")], name: "شمعة معطرة في برطمان", description: "شمعة صويا بريحة فانيليا وعود، بتولع حوالي 30 ساعة.", price: 220, category: "شموع", occasions: ["birthday", "thanks", "mothers-day", "christmas", "engagement"], recipients: ["her", "mom", "colleague"], interests: ["ديكور", "استرخاء"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, partnerId: id(1, 4) },
  { slug: "rose-bouquet", images: [photo("1563241527-3004b7be0ffd")], name: "بوكيه ورد طبيعي", description: "بوكيه 12 وردة طبيعي متنسق ومتغلف.", price: 450, category: "ورد", occasions: ["birthday", "engagement", "get-well", "mothers-day", "thanks"], recipients: ["her", "mom"], interests: ["ورد"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, boxEligible: false, partnerId: id(1, 5) },
  { slug: "single-rose", images: [photo("1527061011665-3652c757a4d4")], name: "وردة طبيعي", description: "وردة واحدة متغلفة بشريطة.", price: 60, category: "ورد", occasions: ["birthday", "engagement", "thanks"], recipients: ["her", "mom"], interests: ["ورد"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, isAddon: true, partnerId: id(1, 5) },
  { slug: "chocolate-box", images: [photo("1599599810769-bcde5a160d32")], name: "علبة شوكولاتة فاخرة", description: "16 قطعة شوكولاتة بلجيكي بحشوات مختلفة.", price: 250, category: "شوكولاتة", occasions: ["birthday", "success", "thanks", "christmas", "engagement"], recipients: ["her", "him", "mom", "dad", "kid", "colleague"], interests: ["حلويات"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, isAddon: true, partnerId: id(1, 6) },
  { slug: "helium-balloon", images: [photo("1530103862676-de8c9debad1d")], name: "بالونة هيليوم", description: "بالونة هيليوم مكتوب عليها حسب المناسبة.", price: 90, category: "بالونات", occasions: ["birthday", "success", "newborn"], recipients: ["her", "him", "kid"], interests: [], isCustomizable: false, customizationMaxChars: null, prepDays: 0, isAddon: true, boxEligible: false },
  { slug: "engraved-keychain", images: [photo("1513201099705-a9746e1e201f")], name: "ميدالية خشب محفورة", description: "ميدالية خشب طبيعي محفور عليها الاسم أو التاريخ.", price: 150, category: "ميداليات", occasions: ["birthday", "success", "engagement", "thanks"], recipients: ["her", "him", "colleague"], interests: [], isCustomizable: true, customizationMaxChars: 15, prepDays: 3, partnerId: id(1, 7) },
  { slug: "printed-cushion", images: [photo("1584100936595-c0654b55a2e2")], name: "كوشن مطبوع", description: "كوشن قطيفة 40×40 مطبوع عليه جملة تختارها.", price: 280, category: "ديكور", occasions: ["birthday", "mothers-day", "engagement"], recipients: ["her", "mom", "kid"], interests: ["ديكور"], isCustomizable: true, customizationMaxChars: 40, prepDays: 3, partnerId: id(1, 3) },
  { slug: "leather-notebook", images: [photo("1531346878377-a5be20888e57")], name: "أجندة جلد هاند ميد", description: "أجندة جلد طبيعي متخيطة يدوي، 120 ورقة.", price: 320, category: "أدوات مكتب", occasions: ["success", "thanks", "birthday"], recipients: ["him", "her", "colleague", "dad"], interests: ["كتابة", "قراءة"], isCustomizable: true, customizationMaxChars: 20, prepDays: 2, partnerId: id(1, 1) },
  { slug: "crochet-keychain", images: [photo("1584992236310-6edddc08acff")], name: "ميدالية كروشيه", description: "ميدالية كروشيه معمولة باليد، أشكال مختلفة.", price: 120, category: "ميداليات", occasions: ["birthday", "success", "thanks"], recipients: ["her", "kid"], interests: ["هاند ميد"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, partnerId: id(1, 1) },
  { slug: "soap-set", images: [photo("1612817288484-6f916006741a")], name: "طقم صابون طبيعي", description: "3 قطع صابون طبيعي بزيت الزيتون واللافندر.", price: 190, category: "عناية", occasions: ["mothers-day", "thanks", "get-well"], recipients: ["her", "mom"], interests: ["عناية", "استرخاء"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, partnerId: id(1, 2) },
  { slug: "teddy-bear", images: [photo("1559454403-b8fb88521f11")], name: "دبدوب قطيفة", description: "دبدوب قطيفة طري 35 سم.", price: 300, category: "ألعاب", occasions: ["birthday", "newborn", "get-well", "engagement"], recipients: ["her", "kid"], interests: [], isCustomizable: false, customizationMaxChars: null, prepDays: 0, partnerId: id(1, 8) },
  { slug: "nuts-box", images: [photo("1508061253366-f7da158b6d46")], name: "علبة مكسرات مشكلة", description: "نص كيلو مكسرات محمصة في علبة هدايا.", price: 230, category: "أكل", occasions: ["thanks", "get-well", "ramadan", "christmas"], recipients: ["mom", "dad", "colleague", "him"], interests: ["أكل"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, partnerId: id(1, 6) },
  { slug: "photo-frame", images: [photo("1513519245088-0e12902e5a38")], name: "برواز صورة مطبوع", description: "برواز خشب 20×25 بالصورة اللي تبعتها.", price: 200, category: "ديكور", occasions: ["birthday", "mothers-day", "engagement", "newborn"], recipients: ["her", "mom", "dad"], interests: ["ذكريات"], isCustomizable: true, customizationMaxChars: 30, prepDays: 2, partnerId: id(1, 3) },
  { slug: "christmas-ornaments", images: [photo("1543589077-47d81606c1bf")], name: "طقم زينة الكريسماس", description: "6 كور زينة للشجرة بألوان دهبي وأحمر.", price: 160, category: "زينة", occasions: ["christmas"], recipients: ["her", "mom", "kid"], interests: ["ديكور"], isCustomizable: false, customizationMaxChars: null, prepDays: 0 },
  { slug: "baby-blanket", images: [photo("1522771930-78848d9293e8")], name: "بطانية مولود مطرزة", description: "بطانية قطن ناعمة مطرز عليها اسم المولود.", price: 380, category: "مواليد", occasions: ["newborn"], recipients: ["kid"], interests: [], isCustomizable: true, customizationMaxChars: 12, prepDays: 4, partnerId: id(1, 8) },
  { slug: "herbal-tea", images: [photo("1576092768241-dec231879fc3")], name: "علبة شاي أعشاب", description: "تشكيلة 4 أنواع شاي أعشاب في علبة خشب.", price: 170, category: "أكل", occasions: ["get-well", "thanks", "mothers-day"], recipients: ["mom", "dad", "colleague"], interests: ["شاي", "استرخاء"], isCustomizable: false, customizationMaxChars: null, prepDays: 0, partnerId: id(1, 2) },
];

export const products: Product[] = productDefs.map((p, i) => ({
  id: id(2, i + 1),
  isAvailable: true,
  isAddon: false,
  boxEligible: true,
  partnerId: null,
  brand: null,
  ...p,
}));

const pid = (slug: string) => {
  const p = products.find((x) => x.slug === slug);
  if (!p) throw new Error(`seed: unknown product ${slug}`);
  return p.id;
};

export const seasons: Season[] = [
  {
    id: id(3, 1),
    slug: "christmas-2027",
    name: "الكريسماس ورأس السنة",
    occasionSlug: "christmas",
    occasionDate: "2027-01-07",
    customDeadline: "2026-12-28T21:00:00+02:00",
    readyDeadline: "2027-01-05T21:00:00+02:00",
    visibleFrom: "2026-10-01T00:00:00+02:00",
    visibleUntil: "2027-01-07T23:59:00+02:00",
    bannerTitle: "هدايا الكريسماس ورأس السنة",
    bannerSubtitle: "باكدجات جاهزة ومتغلفة، توصل لحد البيت في أسيوط",
    bannerImage: photo("1513885535751-8b9238bd345a"),
  },
];

const pkg = (
  n: number,
  def: Omit<GiftPackage, "id" | "isAvailable" | "items" | "seasonId"> & {
    items: [string, number][];
    seasonId?: string | null;
  },
): GiftPackage => ({
  id: id(4, n),
  isAvailable: true,
  seasonId: null,
  ...def,
  items: def.items.map(([slug, quantity]) => ({ productId: pid(slug), quantity })),
});

export const packages: GiftPackage[] = [
  pkg(1, { slug: "birthday-latif", images: [photo("1549465220-1a8b9238cd48")], name: "عيد ميلاد سعيد", description: "مج بالاسم وشوكولاتة وبالونة، بداية لطيفة ليوم حلو.", tier: "latif", price: 590, occasions: ["birthday"], recipients: ["her", "him", "colleague"], items: [["name-mug", 1], ["chocolate-box", 1], ["helium-balloon", 1]] }),
  pkg(2, { slug: "birthday-momayaz", images: [photo("1608755728617-aefab37d2edd")], name: "عيد ميلاد مميز", description: "بوكيه ورد وشمعة معطرة وشوكولاتة في بوكس واحد.", tier: "momayaz", price: 1050, occasions: ["birthday", "engagement"], recipients: ["her", "mom"], items: [["rose-bouquet", 1], ["scented-candle", 1], ["chocolate-box", 1]] }),
  pkg(3, { slug: "get-well-soon", images: [photo("1544787219-7f47ccb76574")], name: "سلامتك", description: "شاي أعشاب ومكسرات ووردة، عشان يحس إنك جنبه.", tier: "latif", price: 520, occasions: ["get-well"], recipients: ["mom", "dad", "colleague", "her", "him"], items: [["herbal-tea", 1], ["nuts-box", 1], ["single-rose", 1]] }),
  pkg(4, { slug: "success-box", images: [photo("1512909006721-3d6018887383")], name: "مبروك النجاح", description: "أجندة جلد هاند ميد وميدالية محفورة وشوكولاتة.", tier: "momayaz", price: 820, occasions: ["success"], recipients: ["her", "him"], items: [["leather-notebook", 1], ["engraved-keychain", 1], ["chocolate-box", 1]] }),
  pkg(5, { slug: "newborn-welcome", images: [photo("1559454403-b8fb88521f11")], name: "أهلاً بالمولود", description: "بطانية مطرزة باسم المولود ودبدوب وبالونة.", tier: "fakher", price: 890, occasions: ["newborn"], recipients: ["kid"], items: [["baby-blanket", 1], ["teddy-bear", 1], ["helium-balloon", 1]] }),
  pkg(6, { slug: "for-mom", images: [photo("1561181286-d3fee7d55364")], name: "لست الحبايب", description: "كوشن مطبوع وطقم صابون طبيعي وبوكيه ورد.", tier: "fakher", price: 1080, occasions: ["mothers-day", "birthday"], recipients: ["mom"], items: [["printed-cushion", 1], ["soap-set", 1], ["rose-bouquet", 1]] }),
  pkg(7, { slug: "student-budget", images: [photo("1513201099705-a9746e1e201f")], name: "هدية طالب", description: "ميدالية كروشيه ووردة وشوكولاتة، على قد الإيد.", tier: "latif", price: 450, occasions: ["birthday", "success", "thanks"], recipients: ["her", "him"], items: [["crochet-keychain", 1], ["single-rose", 1], ["chocolate-box", 1]] }),
  pkg(8, { slug: "christmas-joy", images: [photo("1603006905003-be475563bc59")], name: "فرحة الكريسماس", description: "زينة للشجرة وشمعة معطرة وشوكولاتة.", tier: "momayaz", price: 720, occasions: ["christmas"], recipients: ["her", "mom", "kid"], seasonId: id(3, 1), items: [["christmas-ornaments", 1], ["scented-candle", 1], ["chocolate-box", 1]] }),
  pkg(9, { slug: "christmas-family", images: [photo("1513885535751-8b9238bd345a")], name: "سفرة العيد", description: "مكسرات وشوكولاتة وشمعة وزينة، هدية للبيت كله.", tier: "fakher", price: 980, occasions: ["christmas"], recipients: ["mom", "dad"], seasonId: id(3, 1), items: [["nuts-box", 1], ["chocolate-box", 1], ["scented-candle", 1], ["christmas-ornaments", 1]] }),
];

export const boxSizes: BoxSize[] = [
  { id: id(5, 1), name: "صغير", price: 80, maxItems: 3, sort: 1 },
  { id: id(5, 2), name: "متوسط", price: 130, maxItems: 5, sort: 2 },
  { id: id(5, 3), name: "كبير", price: 190, maxItems: 8, sort: 3 },
];

const markaz = ["أسيوط الجديدة", "مركز أسيوط", "منفلوط", "أبنوب", "الفتح", "أبو تيج", "ديروط", "القوصية", "ساحل سليم", "البداري", "صدفا", "الغنايم"];

export const zones: Zone[] = [
  { id: id(6, 1), name: "مدينة أسيوط", kind: "city", fee: 50, sameDay: true, extraDays: 0, sort: 1 },
  ...markaz.map((name, i) => ({
    id: id(6, i + 2),
    name,
    kind: "markaz" as const,
    fee: 70 + i * 5,
    sameDay: false,
    extraDays: 0,
    sort: i + 2,
  })),
  { id: id(6, 99), name: "محافظة تانية (شركة شحن)", kind: "governorate", fee: 120, sameDay: false, extraDays: 3, sort: 99 },
];

export const coupons = [
  { code: "WELCOME10", kind: "percent" as const, value: 10, minOrder: 500, expiresAt: "2027-12-31T23:59:00+02:00", maxUses: 100 },
];

export const kits: Kit[] = [
  {
    category: "workshop", id: id(7, 1), slug: "paint-hairbrush", name: "كيت تلوين فرشة الشعر", tagline: "كل واحدة ترسم فرشتها على ذوقها",
    description: "فرشة ومشط خشب طبيعي تلوّنيهم بإيدك مع صحابك، وكل كيت متغلف في شنطة قماش بفيونكة وكارت باسم صاحبته.",
    images: [photo("1512909006721-3d6018887383")], pricePerPerson: 280, minPeople: 3, maxPeople: 25,
    contents: ["فرشة شعر خشب", "مشط خشب", "4 ألوان أكريليك", "2 فرشة رسم", "باليتة ألوان", "شنطة قماش بفيونكة", "كارت بالاسم"],
    duration: "ساعة ونص تقريباً", prepDays: 3, isAvailable: true,
  },
  {
    category: "workshop", id: id(7, 2), slug: "diy-earrings", name: "كيت حلقان DIY", tagline: "اعملي حلقانك بإيدك",
    description: "خرز وحلقات وكل الأدوات عشان كل واحدة تعمل جوز حلقان أو أكتر، في علبة كرافت مطبوعة.",
    images: [photo("1535632066927-ab7c9ab60908")], pricePerPerson: 320, minPeople: 3, maxPeople: 25,
    contents: ["خرز ألوان مختلفة", "حلقات وخطافات", "زرادية صغيرة", "سلك تشكيل", "علبة تخزين", "كارت خطوات", "كارت بالاسم"],
    duration: "ساعة تقريباً", prepDays: 3, isAvailable: true,
  },
  {
    category: "workshop", id: id(7, 3), slug: "candle-making", name: "كيت شمع معطّر", tagline: "شمعتك بريحتك",
    description: "شمع صويا وزيوت عطرية وبرطمان، كل واحدة تختار الريحة وتصب شمعتها وتاخدها معاها.",
    images: [photo("1602874801007-bd458bb1b8b6")], pricePerPerson: 350, minPeople: 3, maxPeople: 20,
    contents: ["شمع صويا", "برطمان إزاز", "فتيلة خشب", "2 زيت عطري", "عصاية تقليب", "ستيكر للبرطمان", "كارت بالاسم"],
    duration: "ساعة تقريباً", prepDays: 4, isAvailable: true,
  },
  {
    category: "workshop", id: id(7, 4), slug: "paint-tote", name: "كيت تلوين شنطة قماش", tagline: "شنطة محدش عنده زيها",
    description: "شنطة قماش سادة وألوان قماش مبتتغسلش واستنسل رسومات، تنفع لأي قعدة بنات.",
    images: [photo("1544816155-12df9643f363")], pricePerPerson: 220, minPeople: 3, maxPeople: 30,
    contents: ["شنطة قماش", "5 ألوان قماش", "2 فرشة", "استنسل رسومات", "كرتونة حماية", "كارت بالاسم"],
    duration: "ساعة تقريباً", prepDays: 2, isAvailable: true,
  },
  {
    category: "workshop", id: id(7, 5), slug: "paint-mug", name: "كيت تلوين مج", tagline: "مجك بإيدك",
    description: "مج سيراميك أبيض وأقلام سيراميك، ترسمي وتكتبي اللي نفسك فيه، وبيتثبت في الفرن في البيت.",
    images: [photo("1514228742587-6b1558fcca3d")], pricePerPerson: 240, minPeople: 3, maxPeople: 30,
    contents: ["مج سيراميك أبيض", "4 أقلام سيراميك", "ورقة أفكار رسومات", "علبة هدية", "كارت بالاسم"],
    duration: "45 دقيقة تقريباً", prepDays: 2, isAvailable: true,
  },
];

// النسخة الإنجليزي من seed-en.ts
for (const o of occasions) o.en = occasionsEn[o.slug];
for (const b of partners) b.en = partnersEn[b.slug];
for (const p of products) p.en = productsEn[p.slug];
for (const p of packages) p.en = packagesEn[p.slug];
for (const k of kits) k.en = kitsEn[k.slug];
for (const x of seasons) x.en = seasonsEn[x.slug];
for (const z of zones) z.en = { name: zonesEn[z.name] };
for (const b of boxSizes) b.en = { name: boxSizesEn[b.name] };

// بوكسات العروسة والإشبينات: نفس نظام الكيتات (سعر للفرد + أسماء + خصم كمية)
kits.push(
  {
    category: "bridal", role: "bridesmaid", id: id(8, 1), slug: "bridesmaid-proposal", name: "بوكس هتكوني إشبينتي؟", tagline: "اسأليها بطريقة متتنسيش",
    description: "بوكس بتفتحه صاحبتك وتلاقي جواه السؤال: هتكوني إشبينتي؟ ومعاه حاجات باسمها تفضل معاها بعد الفرح.",
    images: [photo("1549465220-1a8b9238cd48")], pricePerPerson: 650, minPeople: 1, maxPeople: 12,
    contents: ["كارت «هتكوني إشبينتي؟»", "روب ساتان مطرز بالاسم", "تمبلر بالاسم", "سكرانشي ساتان", "شمعة صغيرة", "بوكس بفيونكة"],
    duration: "", prepDays: 5, isAvailable: true,
  },
  {
    category: "bridal", role: "bridesmaid", id: id(8, 2), slug: "wedding-day-squad", name: "بوكس يوم الفرح للإشبينات", tagline: "جاهزين للصور من الصبح",
    description: "كل اللي الإشبينات محتاجينه يوم الفرح: روب بالاسم للصور، وحاجات صغيرة تريحهم طول اليوم.",
    images: [photo("1608755728617-aefab37d2edd")], pricePerPerson: 550, minPeople: 2, maxPeople: 12,
    contents: ["روب ساتان بالاسم", "شبشب قطيفة", "ماسك عين", "سكرانشي", "ميني بيرفيوم", "كارت شكر من العروسة"],
    duration: "", prepDays: 5, isAvailable: true,
  },
  {
    category: "bridal", role: "bride", id: id(8, 3), slug: "bride-box", name: "بوكس العروسة", tagline: "ليكي إنتي يا عروسة",
    description: "هدية العروسة نفسها، من صاحبتها أو من العريس: روب Bride وشماعة فستان باسمها وحاجات ليوم العمر.",
    images: [photo("1606800052052-a08af7148866")], pricePerPerson: 1200, minPeople: 1, maxPeople: 1,
    contents: ["روب ساتان Bride", "شماعة فستان باسمها", "تمبلر Bride to be", "تاج صغير", "شمعة معطرة", "كارت برسالتك"],
    duration: "", prepDays: 5, isAvailable: true,
  },
  {
    category: "bridal", role: "mother", id: id(8, 4), slug: "mother-of-bride", name: "هدية أم العروسة", tagline: "شكراً يا ماما",
    description: "هدية شكر لأم العروسة أو أم العريس: شال وبرواز بصورتكم وكارت بكلمة من القلب.",
    images: [photo("1561181286-d3fee7d55364")], pricePerPerson: 750, minPeople: 1, maxPeople: 2,
    contents: ["شال ناعم", "برواز بصورتكم", "شمعة معطرة", "كارت شكر"],
    duration: "", prepDays: 4, isAvailable: true,
  },
  {
    category: "bridal", role: "flower-girl", id: id(8, 5), slug: "flower-girl", name: "بوكس الفلاور جيرل", tagline: "لأصغر واحدة في الفرح",
    description: "تاج ورد وشنطة صغيرة باسمها ودبدوب، عشان تحس إنها أميرة الفرح.",
    images: [photo("1559454403-b8fb88521f11")], pricePerPerson: 420, minPeople: 1, maxPeople: 6,
    contents: ["تاج ورد", "شنطة صغيرة بالاسم", "دبدوب صغير", "كارت ملون"],
    duration: "", prepDays: 4, isAvailable: true,
  },
);
for (const k of kits) k.en ??= kitsEn[k.slug] ?? bridalEn[k.slug];
