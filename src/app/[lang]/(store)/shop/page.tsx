import { getT } from "@/i18n/server";
import { WrapNote } from "@/components/wrap-note";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Chip, Grid, PackageCard, ProductCard, SectionHeading } from "@/components/cards";
import { priceBands, recipientOrder } from "@/lib/browse";
import { filterCatalog, getLocalizedStorefront } from "@/lib/catalog";
import { recipientLabels } from "@/lib/seed-data";
import type { RecipientTag } from "@/lib/types";
import { PageHeader } from "@/components/scrapbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("كل الهدايا"), description: t("دوّر على هدية حسب المناسبة أو المستلم أو الميزانية.") };
}

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ShopPage({ searchParams }: PageProps<"/[lang]/shop">) {
  const t = await getT();
  return (
    <>
      <PageHeader kicker={t("دوّري براحتك")} title={t("كل الهدايا")} subtitle={t("حسب المناسبة، أو لمين، أو على قد ميزانيتك.")} />
      <div className="container-x py-10">
        <Suspense fallback={<p className="text-muted">{t("بنحمّل الهدايا…")}</p>}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Params> }) {
  const t = await getT();
  const sp = await searchParams;
  const q = one(sp.q);
  const occasion = one(sp.occasion);
  const recipientRaw = one(sp.for);
  const recipient = recipientOrder.includes(recipientRaw as RecipientTag)
    ? (recipientRaw as RecipientTag)
    : undefined;
  const band = priceBands.find((b) => b.id === one(sp.price));

  const sf = await getLocalizedStorefront();
  const { packages, products } = filterCatalog(sf, {
    q,
    occasion,
    recipient,
    minPrice: band?.min,
    maxPrice: band?.max,
  });

  const current = { q, occasion, for: recipient, price: band?.id };
  const href = (patch: Partial<typeof current>) => {
    const next = { ...current, ...patch };
    const qs = new URLSearchParams(
      Object.entries(next).filter((e): e is [string, string] => Boolean(e[1])),
    ).toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <>
      <form action="/shop" className="mb-5 flex gap-2">
        {occasion && <input type="hidden" name="occasion" value={occasion} />}
        {recipient && <input type="hidden" name="for" value={recipient} />}
        {band && <input type="hidden" name="price" value={band.id} />}
        <input
          name="q"
          defaultValue={q}
          placeholder={t("دوّر على مج، ورد، شوكولاتة…")}
          className="field"
          type="search"
          enterKeyHint="search"
        />
        <button className="btn-dark shrink-0">{t("بحث")}</button>
      </form>

      <div className="mb-8 space-y-3">
        <div className="scroll-x">
          <Chip href={href({ occasion: undefined })} active={!occasion}>{t("كل المناسبات")}</Chip>
          {sf.occasions.map((o) => (
            <Chip key={o.slug} href={href({ occasion: o.slug })} active={occasion === o.slug}>
              {o.name}
            </Chip>
          ))}
        </div>
        <div className="scroll-x">
          <Chip href={href({ for: undefined })} active={!recipient}>{t("لأي حد")}</Chip>
          {recipientOrder.map((r) => (
            <Chip key={r} href={href({ for: r })} active={recipient === r}>
              {t(recipientLabels[r])}
            </Chip>
          ))}
        </div>
        <div className="scroll-x">
          <Chip href={href({ price: undefined })} active={!band}>{t("أي سعر")}</Chip>
          {priceBands.map((b) => (
            <Chip key={b.id} href={href({ price: b.id })} active={band?.id === b.id}>
              <span className="tabular">{t(b.label)}</span>
            </Chip>
          ))}
        </div>
      </div>

      {packages.length === 0 && products.length === 0 && (
        <div className="rounded-2xl bg-surface p-10 text-center">
          <p className="font-bold">{t("مفيش هدايا بالاختيارات دي")}</p>
          <p className="mt-2 text-sm text-muted">{t("جرّب تشيل فلتر، أو اعمل البوكس بنفسك من المنتجات اللي تعجبك.")}</p>
        </div>
      )}

      {packages.length > 0 && (
        <section className="mb-10">
          <SectionHeading title={t("باكدجات جاهزة")} subtitle={t("{n} باكدج", { n: packages.length })} />
          <Grid>
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </Grid>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <SectionHeading title={t("منتجات")} subtitle={t("تتبعت لوحدها أو تحطها في بوكس")} />
          <WrapNote className="mb-6" />
          <Grid>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Grid>
        </section>
      )}
    </>
  );
}
