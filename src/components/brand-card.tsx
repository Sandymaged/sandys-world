import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import type { Brand } from "@/lib/types";
import { GiftArt } from "./gift-art";
import { Icon } from "./icons";

/**
 * كارت براند: ورقة بالعرض، اللوجو في دايرة على جنب والاسم وجملته جنبه.
 * الدايرة صغيرة عن قصد: لوجوهات البراندات غالبًا صور صغيرة، ولو اتكبّرت بتبان مكسّرة.
 */
export async function BrandCard({ brand }: { brand: Brand }) {
  const t = await getT();
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="group flex h-full items-center gap-4 rounded-3xl border border-line bg-paper p-4 shadow-[0_12px_22px_-18px_rgb(60_20_25/0.5)] transition hover:-translate-y-0.5 hover:border-brand/40 sm:p-5"
    >
      <GiftArt image={brand.cover} label={brand.name} className="size-20 shrink-0 rounded-full bg-white ring-1 ring-line sm:size-24" sizes="96px" />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-xl leading-tight text-brand">{brand.name}</span>
        {brand.tagline && <span className="mt-1 line-clamp-2 block text-sm leading-6 text-ink-2">{brand.tagline}</span>}
        <span className="mt-2 flex items-center gap-1 text-xs text-muted">
          {brand.city} · {t("{n} منتجات", { n: brand.productCount })}
          <Icon name="chevron" className="ms-auto size-4 text-brand" />
        </span>
      </span>
    </Link>
  );
}
