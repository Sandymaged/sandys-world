import type { RecipientTag } from "./types";

export const priceBands = [
  { id: "u500", label: "أقل من 500 ج.م", min: undefined, max: 500 },
  { id: "500-800", label: "500 – 800 ج.م", min: 500, max: 800 },
  { id: "800-1200", label: "800 – 1200 ج.م", min: 800, max: 1200 },
  { id: "o1200", label: "أكتر من 1200 ج.م", min: 1200, max: undefined },
] as const;

export type PriceBandId = (typeof priceBands)[number]["id"];

export const recipientOrder: RecipientTag[] = ["her", "him", "mom", "dad", "kid", "colleague"];
