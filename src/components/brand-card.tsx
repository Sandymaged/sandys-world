import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import type { Brand } from "@/lib/types";
import { GiftArt } from "./gift-art";

/**
 * كارت براند: اللوجو في دايرة صغيرة، والاسم وجملته.
 * الدايرة صغيرة عن قصد: لوجوهات البراندات غالبًا صور صغيرة، ولو اتكبّرت بتبان مكسّرة.
 */
export async function BrandCard({ brand }: { brand: Brand }) {
  const t = await getT();
  return (
    <Link href={`/brands/${brand.slug}`} className="group mx-auto block w-40 text-center sm:w-44">
      <GiftArt
        image={brand.cover}
        label={brand.name}
        className="mx-auto size-28 rounded-full bg-white ring-1 ring-line shadow-[0_10px_20px_-14px_rgb(60_20_25/0.5)] transition-shadow group-hover:ring-2 group-hover:ring-brand/40 sm:size-32"
        sizes="128px"
      />
      <h3 className="mt-3 font-heading text-xl text-brand">{brand.name}</h3>
      <p className="line-clamp-2 font-script text-base leading-snug text-candy">{brand.tagline}</p>
      <p className="mt-1 text-xs text-muted">
        {brand.city} · {t("{n} منتجات", { n: brand.productCount })}
      </p>
    </Link>
  );
}
