import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";
import type { Brand } from "@/lib/types";
import { GiftArt } from "./gift-art";
import { Tilt } from "./motion/reveal";

/** كارت براند: صورة في طابع بريد، والاسم وجملته */
export async function BrandCard({ brand }: { brand: Brand }) {
  const t = await getT();
  return (
    <Tilt className="group">
      <Link href={`/brands/${brand.slug}`} className="block text-center">
        <div className="relative mx-auto w-[88%]">
          <div className="stamp shadow-[0_12px_22px_-14px_rgb(60_20_25/0.5)]">
            <GiftArt image={brand.cover} label={brand.name} className="aspect-[4/5]" sizes="(max-width: 640px) 45vw, 22vw" zoom />
          </div>
        </div>
        <h3 className="mt-3 font-heading text-2xl text-brand">{brand.name}</h3>
        <p className="font-script text-lg leading-tight text-candy">{brand.tagline}</p>
        <p className="mt-1 text-xs text-muted">
          {brand.city} · {t("{n} منتجات", { n: brand.productCount })}
        </p>
      </Link>
    </Tilt>
  );
}
