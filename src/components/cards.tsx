import { getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import { dayCount, egp, tierLabels } from "@/lib/format";
import { canPick, type ProductOption } from "@/lib/options";
import type { PackageTier } from "@/lib/types";
import type { PackageView, Product } from "@/lib/types";
import { Basket } from "./basket-reveal";
import { GiftArt } from "./gift-art";
import { Icon } from "./icons";
import { Reveal, Tilt } from "./motion/reveal";
import { ProductQuickAdd } from "./product-quick-add";
import { QuickAdd } from "./quick-add";

export const tierStyles: Record<PackageTier, string> = {
  latif: "bg-paper/95 text-success",
  momayaz: "bg-paper/95 text-blue-deep",
  fakher: "bg-paper/95 text-brand",
};

async function DeliveryHint({ prepDays }: { prepDays: number }) {
  const t = await getT();
  return (
    <span className="flex items-center gap-1 text-[13px] font-medium text-success">
      <Icon name="truck" className="size-4" />
      {prepDays === 0 ? t("يوصل النهارده") : prepDays === 1 ? t("يوصل بكرة") : t("يُجهَّز خلال {days}", { days: dayCount(prepDays, t) })}
    </span>
  );
}

export async function PackageCard({ pkg, priority }: { pkg: PackageView; priority?: boolean }) {
  const t = await getT();
  const brands = [...new Set(pkg.products.map((p) => p.brand).filter(Boolean))];
  return (
    <Tilt className="group h-full">
      <div className="card flex h-full flex-col p-2.5">
        <Link href={`/packages/${pkg.slug}`} className="block flex-1">
          <div className="relative">
            {/* السلة بالمنتجات اللي جوه الباكدج */}
            <div className="overflow-hidden rounded-xl bg-blue-soft [--basket-wire:rgb(62_93_146/0.4)]">
              <div className="transition-transform duration-500 group-hover:scale-[1.03]">
                <Basket compact priority={priority} items={pkg.products.map((p) => ({ key: p.id, name: p.name, image: p.images[0], quantity: p.quantity }))} />
              </div>
            </div>
            <span className={`absolute top-2.5 start-2.5 rounded-full px-3 py-0.5 text-xs font-semibold ${tierStyles[pkg.tier]}`}>
              {t(tierLabels[pkg.tier])}
            </span>
          </div>
          <div className="px-1.5 pt-3">
            <h3 className="line-clamp-1 text-base font-semibold">{pkg.name}</h3>
            {brands.length > 0 && <p className="line-clamp-1 text-[13px] text-ink-2">{t("من {brands}", { brands: brands.join(t("، ")) })}</p>}
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2">
              <p className="tabular font-heading text-xl text-brand">{egp(pkg.price, t)}</p>
              <DeliveryHint prepDays={pkg.prepDays} />
            </div>
          </div>
        </Link>
        <div className="px-1.5 pt-2.5 pb-1">
          <QuickAdd pkg={pkg} />
        </div>
      </div>
    </Tilt>
  );
}

export async function ProductCard({ product }: { product: Product }) {
  const t = await getT();
  return (
    <Tilt className="group h-full">
      <div className="card flex h-full flex-col p-2.5">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative overflow-hidden rounded-xl">
            <GiftArt image={product.images[0]} label={product.name} className="aspect-square" zoom />
            {product.isCustomizable && (
              <span className="absolute top-2.5 start-2.5 rounded-full bg-paper/95 px-3 py-0.5 text-xs font-semibold text-brand">
                {t("بيتكتب عليه الاسم")}
              </span>
            )}
          </div>
          <div className="px-1.5 pt-3">
            <h3 className="line-clamp-1 text-base font-semibold">{product.name}</h3>
            {product.options?.length ? <OptionsPreview options={product.options} en={t.locale === "en"} /> : null}
          </div>
        </Link>
        <div className="flex-1 px-1.5">
          {/* البراند: لينك لصفحته (برا لينك المنتج) */}
          {product.brandSlug ? (
            <Link href={`/brands/${product.brandSlug}`} className="line-clamp-1 text-[13px] text-ink-2 underline-offset-2 hover:text-brand hover:underline">
              {t("من {brands}", { brands: product.brand ?? "" })}
            </Link>
          ) : (
            <span className="block h-4" />
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 px-1.5 pb-1">
          <p className="tabular font-heading text-xl text-brand">{egp(product.price, t)}</p>
          <DeliveryHint prepDays={product.prepDays} />
        </div>
        <div className="px-1.5 pt-2.5 pb-1">
          <ProductQuickAdd product={product} />
        </div>
      </div>
    </Tilt>
  );
}

/**
 * اختيارات المنتج على الكارت: الألوان دواير صغيرة، والمقاسات والريحة أساميهم.
 * اللي خلص بيبان باهت ومشطوب.
 */
function OptionsPreview({ options, en }: { options: ProductOption[]; en: boolean }) {
  return (
    <div className="mt-1.5 space-y-1">
      {options.slice(0, 2).map((o) =>
        o.kind === "color" ? (
          <div key={o.id} className="flex items-center gap-1" aria-label={o.values.map((v) => (en && v.en) || v.label).join("، ")}>
            {o.values.slice(0, 7).map((v) => (
              <span
                key={v.id}
                title={(en && v.en) || v.label}
                className={`size-3.5 rounded-full ring-1 ring-ink/15 ${canPick(options, [], o.id, v.id) ? "" : "opacity-30"}`}
                style={{ backgroundColor: v.color ?? "#d9a5ae" }}
              />
            ))}
            {o.values.length > 7 && <span className="text-[11px] text-muted">+{o.values.length - 7}</span>}
          </div>
        ) : (
          <p key={o.id} className="line-clamp-1 text-xs text-muted">
            {o.values.map((v, i) => (
              <span key={v.id} className={canPick(options, [], o.id, v.id) ? "" : "line-through opacity-50"}>
                {i > 0 && " · "}
                {(en && v.en) || v.label}
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  );
}

/** شبكة الكروت: كل كارت بيظهر وإنتي بتنزلي */
export function Grid({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {children.map((c, i) => (
        <Reveal key={i} className="h-full">
          {c}
        </Reveal>
      ))}
    </div>
  );
}

/** صف بيتسحب بالعرض على الموبايل، وشبكة على الشاشات الكبيرة */
export function Rail({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="scroll-x snap-x snap-mandatory py-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
      {children.map((c, i) => (
        <div key={i} className="w-[46%] shrink-0 snap-start sm:w-[30%] md:w-auto">
          {c}
        </div>
      ))}
    </div>
  );
}

export async function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  const t = await getT();
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl text-ink sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-ink-2 hover:text-ink">
          {t("شوف الكل")}
          <Icon name="chevron" className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`chip ${active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand"}`}
    >
      {children}
    </Link>
  );
}
