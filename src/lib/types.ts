// أنواع البيانات الأساسية — مطابقة لنموذج البيانات في قسم 10 من الـ SRS

export type RecipientTag = "her" | "him" | "mom" | "dad" | "kid" | "colleague";

export type PackageTier = "latif" | "momayaz" | "fakher";

export type DeliveryPeriod = "morning" | "afternoon" | "evening";

export type ZoneKind = "city" | "markaz" | "governorate";

/** الحقول اللي ليها نسخة إنجليزي (عمود en في قاعدة البيانات) */
export interface Localized {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  tagline?: string;
  contents?: string[];
  duration?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
}

export interface Occasion {
  en?: Localized;
  slug: string;
  name: string;
  sort: number;
  image: string | null;
}

/** براند محلي (شريك) منتجاته بتتباع على الموقع بعمولة */
export interface Partner {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  story: string;
  city: string;
  instagram: string | null;
  cover: string | null;
  commissionRate: number; // 0.2 = 20% — للوحة التحكم بس، مش بيتعرض للعميل
  en?: Localized & { story?: string; city?: string };
}

/** البراند زي ما بيتعرض للعميل (من غير العمولة) */
export type Brand = Omit<Partner, "commissionRate"> & { productCount: number };

import type { ProductOption } from "./options";

export interface Product {
  en?: Localized;
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  partnerId: string | null;
  brand: string | null; // اسم البراند (بيتحسب من الشريك)
  brandSlug?: string | null;
  occasions: string[];
  recipients: RecipientTag[];
  interests: string[];
  isCustomizable: boolean;
  customizationMaxChars: number | null;
  prepDays: number;
  isAvailable: boolean;
  isAddon: boolean;
  boxEligible: boolean;
  /** اختيارات زي اللون والمقاس والريحة (اختياري) */
  options?: ProductOption[];
  /** العدد في المخزن للمنتج اللي ملوش اختيارات؛ فاضي = مفتوح */
  stock?: number | null;
}

export interface PackageItem {
  productId: string;
  quantity: number;
}

export interface GiftPackage {
  en?: Localized;
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  tier: PackageTier;
  price: number;
  seasonId: string | null;
  occasions: string[];
  recipients: RecipientTag[];
  items: PackageItem[];
  isAvailable: boolean;
}

/** باكدج جاهز للعرض: المنتجات متحملة ومدة التجهيز محسوبة */
export interface PackageView extends GiftPackage {
  products: (Product & { quantity: number })[];
  prepDays: number;
  season: Season | null;
}

export type KitCategory = "workshop" | "bridal";
export type BridalRole = "bride" | "bridesmaid" | "mother" | "flower-girl";

/**
 * سِت ثابت بسعر للفرد والعميل بيختار العدد والأسماء:
 * كيتات الورش مع الصحاب، وبوكسات العروسة والإشبينات.
 */
export interface Kit {
  en?: Localized;
  id: string;
  category: KitCategory;
  role?: BridalRole;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  images: string[];
  pricePerPerson: number;
  minPeople: number;
  maxPeople: number;
  contents: string[]; // محتويات كيت الفرد الواحد
  duration: string; // مدة الورشة التقريبية
  prepDays: number;
  isAvailable: boolean;
}

export interface Season {
  en?: Localized;
  id: string;
  slug: string;
  name: string;
  occasionSlug: string | null; // المناسبة اللي صفحتها بتعرض باكدجات الموسم
  occasionDate: string; // YYYY-MM-DD
  customDeadline: string; // ISO — آخر ميعاد للطلبات المخصصة
  readyDeadline: string; // ISO — آخر ميعاد للجاهز
  visibleFrom: string;
  visibleUntil: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImage: string | null;
}

export interface BoxSize {
  en?: Localized;
  id: string;
  name: string;
  price: number;
  maxItems: number;
  sort: number;
  /** صورة شكل البوكس ووصف قصير (من اللوحة) */
  image?: string | null;
  description?: string;
  isActive?: boolean;
}

export interface Zone {
  en?: Localized;
  id: string;
  name: string;
  kind: ZoneKind;
  fee: number;
  sameDay: boolean;
  extraDays: number; // أيام زيادة للشحن (المحافظات التانية)
  sort: number;
}
