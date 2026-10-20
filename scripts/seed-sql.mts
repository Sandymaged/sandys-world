// بيولّد supabase/seed.sql من src/lib/seed-data.ts
// التشغيل: npm run db:seed-sql
import { writeFileSync } from "node:fs";
import * as s from "../src/lib/seed-data.ts";
import { DEFAULT_SETTINGS } from "../src/lib/settings.ts";

type V = string | number | boolean | null | undefined | string[];
const j = (v: unknown) => (v ? JSON.stringify(v) : null);
const lit = (v: V): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `array[${v.map(lit).join(", ")}]::text[]`;
  return `'${v.replace(/'/g, "''")}'`;
};
const insert = (table: string, rows: Record<string, V>[]) =>
  rows.length
    ? `insert into ${table} (${Object.keys(rows[0]).join(", ")}) values\n` +
      rows.map((r) => `  (${Object.values(r).map(lit).join(", ")})`).join(",\n") +
      ";\n"
    : "";

const sql = [
  "-- اتولّد تلقائياً من src/lib/seed-data.ts — متعدلش هنا\n",
  insert("settings", Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value: JSON.stringify(value) }))),
  insert("occasions", s.occasions.map((o) => ({ slug: o.slug, name: o.name, image: o.image, sort: o.sort, en: j(o.en) }))),
  insert("partners", s.partners.map((p) => ({ id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, story: p.story, city: p.city, instagram: p.instagram, cover: p.cover, commission_rate: p.commissionRate, en: j(p.en) }))),
  insert("products", s.products.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, description: p.description, images: p.images, price: p.price,
    cost: Math.round(p.price * 0.55), category: p.category, partner_id: p.partnerId, brand: p.brand,
    occasions: p.occasions, recipients: p.recipients, interests: p.interests,
    is_customizable: p.isCustomizable, customization_max_chars: p.customizationMaxChars,
    prep_days: p.prepDays, is_available: p.isAvailable, is_addon: p.isAddon, box_eligible: p.boxEligible, en: j(p.en),
  }))),
  insert("seasons", s.seasons.map((x) => ({
    id: x.id, slug: x.slug, name: x.name, occasion_slug: x.occasionSlug, occasion_date: x.occasionDate,
    custom_deadline: x.customDeadline, ready_deadline: x.readyDeadline, visible_from: x.visibleFrom,
    visible_until: x.visibleUntil, banner_title: x.bannerTitle, banner_subtitle: x.bannerSubtitle, banner_image: x.bannerImage, en: j(x.en),
  }))),
  insert("packages", s.packages.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, description: p.description, images: p.images, tier: p.tier, price: p.price,
    season_id: p.seasonId, occasions: p.occasions, recipients: p.recipients, en: j(p.en),
  }))),
  insert("package_items", s.packages.flatMap((p) => p.items.map((i) => ({ package_id: p.id, product_id: i.productId, quantity: i.quantity })))),
  insert("kits", s.kits.map((k, i) => ({
    id: k.id, category: k.category, role: k.role ?? null, slug: k.slug, name: k.name, tagline: k.tagline, description: k.description, images: k.images,
    price_per_person: k.pricePerPerson, min_people: k.minPeople, max_people: k.maxPeople, contents: k.contents,
    duration: k.duration, prep_days: k.prepDays, sort: i, en: j(k.en),
  }))),
  insert("box_sizes", s.boxSizes.map((b) => ({ id: b.id, name: b.name, price: b.price, max_items: b.maxItems, sort: b.sort, en: j(b.en) }))),
  insert("zones", s.zones.map((z) => ({ id: z.id, name: z.name, kind: z.kind, fee: z.fee, same_day: z.sameDay, extra_days: z.extraDays, sort: z.sort, en: j(z.en) }))),
  insert("coupons", s.coupons.map((c) => ({ code: c.code, kind: c.kind, value: c.value, min_order: c.minOrder, expires_at: c.expiresAt, max_uses: c.maxUses }))),
].join("\n");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("supabase/seed.sql written");
