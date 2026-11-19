/*
 * مودات الموقع حسب المناسبة (كريسماس، عيد الحب، رمضان…).
 * صاحبة المتجر بتختار المود من «إعدادات الموقع» في اللوحة، فبيتغير على واجهة المتجر بس (اللوحة زي ما هي):
 * - ألوان: الأزرق في الموقع بيتبدل بلون المناسبة (والأحمر في بعضها)
 * - شريط فوق الهيدر بجملة المناسبة (بتتكتب من اللوحة)
 * - تأثير خفيف بيتحرك في الخلفية (ثلج، قلوب، نجوم)، وبيتقفل لو الجهاز طالب «تقليل الحركة»
 * أي مود جديد بيتضاف هنا بس.
 */

export type ModeId = "off" | "christmas" | "valentine" | "ramadan";

export interface ModeDef {
  id: ModeId;
  label: string;
  hint: string;
  /** ألوان بتتبدل في واجهة المتجر (أسماء متغيرات الألوان من globals.css) */
  colors: Record<string, string>;
  /** لون الشريط اللي فوق، ولون الكلام عليه */
  bar: { bg: string; fg: string };
  /** شكل التأثير المتحرك */
  particle: "snow" | "heart" | "star" | null;
  banner: { ar: string; en: string };
  /** ألوان للمعاينة الصغيرة في اللوحة */
  swatches: string[];
}

export const modes: ModeDef[] = [
  {
    id: "off",
    label: "بدون مود",
    hint: "الشكل العادي للموقع",
    colors: {},
    bar: { bg: "", fg: "" },
    particle: null,
    banner: { ar: "", en: "" },
    swatches: ["#a3212c", "#3e5d92", "#f6dfe3", "#f5efe7"],
  },
  {
    id: "christmas",
    label: "الكريسماس",
    hint: "أخضر وأحمر، ثلج خفيف، وشريط بأنوار",
    colors: {
      "--color-lilac": "#2c5a43",
      "--color-lilac-soft": "#e1ede4",
      "--color-blue": "#4c8766",
      "--color-blue-soft": "#e1ede4",
      "--color-blue-deep": "#22503a",
      "--color-periwinkle": "#8fbf9f",
      "--color-sky": "#e3efe6",
    },
    bar: { bg: "#22503a", fg: "#fbf3e4" },
    particle: "snow",
    banner: {
      ar: "وصلت هدايا الكريسماس! اطلب مبكراً لتصل هديتك في موعدها",
      en: "Christmas gifts are here! Order early so your gift arrives on time",
    },
    swatches: ["#a3212c", "#22503a", "#e0b43a", "#fbf3e4"],
  },
  {
    id: "valentine",
    label: "عيد الحب",
    hint: "وردي وأحمر، وقلوب صغيرة",
    colors: {
      "--color-lilac": "#8c2f4f",
      "--color-lilac-soft": "#f8e2e9",
      "--color-blue": "#cc6b8b",
      "--color-blue-soft": "#f8e2e9",
      "--color-blue-deep": "#7a2343",
      "--color-periwinkle": "#e7a3b8",
      "--color-sky": "#fae7ed",
    },
    bar: { bg: "#7a2343", fg: "#fdeef2" },
    particle: "heart",
    banner: {
      ar: "اقترب عيد الحب: هدية صغيرة تقول ما لا تقوله الكلمات",
      en: "Valentine's is near: a small gift says what words can't",
    },
    swatches: ["#a3212c", "#7a2343", "#e7a3b8", "#fae7ed"],
  },
  {
    id: "ramadan",
    label: "رمضان والعيد",
    hint: "أزرق ليلي ودهبي، ونجوم صغيرة",
    colors: {
      "--color-brand": "#7a4a10",
      "--color-brand-dark": "#5e380a",
      "--color-brand-soft": "#f5e8cf",
      "--color-blush": "#f5e8cf",
      "--color-lilac": "#1d4b5c",
      "--color-lilac-soft": "#e0edf0",
      "--color-blue": "#3d7f8f",
      "--color-blue-soft": "#e0edf0",
      "--color-blue-deep": "#163a47",
      "--color-periwinkle": "#86bcc6",
      "--color-sky": "#e2eff2",
    },
    bar: { bg: "#163a47", fg: "#f6e3b4" },
    particle: "star",
    banner: {
      ar: "رمضان كريم: هدايا وصناديق رمضان للأهل والأصدقاء",
      en: "Ramadan Kareem: Ramadan gifts and boxes for family and friends",
    },
    swatches: ["#7a4a10", "#163a47", "#e0b43a", "#f6e3b4"],
  },
];

export const modeById = (id: string | undefined) => modes.find((m) => m.id === id) ?? modes[0];

export interface ModeSettings {
  id: ModeId;
  /** جملة الشريط لكل مود (فاضية = الجملة الافتراضية للمود) */
  banners: Partial<Record<ModeId, { ar: string; en: string }>>;
  showBanner: boolean;
  effects: boolean;
}

export const DEFAULT_MODE: ModeSettings = { id: "off", banners: {}, showBanner: true, effects: true };
