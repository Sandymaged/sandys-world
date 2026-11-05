import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GiftCardShare } from "@/components/gift-card-share";
import { Icon } from "@/components/icons";
import { CopyButton } from "@/components/order-client";
import { PageHeader } from "@/components/scrapbook";
import { Link } from "@/i18n/client";
import { getLocale, getT } from "@/i18n/server";
import { waLink } from "@/lib/admin-format";
import { egp } from "@/lib/format";
import { giftCardShareText, validityText } from "@/lib/gift-card";
import { giftCardByCode } from "@/lib/gift-card-view";
import { STORE_NAME } from "@/lib/settings";

export async function generateMetadata({ params }: PageProps<"/[lang]/card/[code]">): Promise<Metadata> {
  const t = await getT();
  const { code } = await params;
  const found = await giftCardByCode(code);
  const name = found?.gc.asGift ? found.gc.toName : "";
  const title = name ? t("{name}، ليك هدية!", { name }) : t("ليك هدية!");
  const description = found ? t("كارت هدية من {store} بقيمة {amount}. افتحه واختار اللي يفرّحك.", { store: t(STORE_NAME), amount: egp(found.gc.amount, t) }) : undefined;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return {
    title,
    description,
    robots: { index: false },
    // صورة المعاينة اللي بتظهر في واتساب تحت اللينك
    openGraph: { title, description, images: found ? [{ url: `${origin}/card-image/${found.record.code}`, width: 1200, height: 630 }] : undefined },
  };
}

export default function CardPage({ params }: PageProps<"/[lang]/card/[code]">) {
  return (
    <Suspense fallback={<div className="container-x py-20"><div className="mx-auto h-96 max-w-sm animate-pulse rounded-3xl bg-surface" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}

/** صفحة الكارت اللي بتتبعت للي جاتله الهدية: الكارت بوشّين، والكود، وإزاي يستخدمه */
async function Content({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = await getT();
  const locale = await getLocale();
  const found = await giftCardByCode(code);
  if (!found) notFound();
  const { record, gc } = found;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const prefix = locale === "en" ? "/en" : "";
  const link = `${origin}${prefix}/card/${record.code}`;
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" });
  const expires = dateFmt.format(new Date(record.expiresAt));
  const expired = Date.parse(record.expiresAt) < Date.now();
  const amountLabel = egp(gc.amount, t);
  const text = giftCardShareText(t, { ...gc, amountLabel, store: t(STORE_NAME), link, expires, expiresAt: record.expiresAt });
  const name = gc.asGift ? gc.toName : "";

  return (
    <div>
      <PageHeader
        tone="pink"
        kicker={t("كارت هدية")}
        title={name ? t("{name}، ليك هدية!", { name }) : t("ليك هدية!")}
        subtitle={
          gc.asGift && gc.fromName
            ? t("{from} بعتلك كارت هدية بقيمة {amount}. اقلب الكارت وشوف إحنا كاتبينلك إيه.", { from: gc.fromName, amount: amountLabel })
            : t("كارت هدية بقيمة {amount}. اقلب الكارت وشوف إحنا كاتبينلك إيه.", { amount: amountLabel })
        }
      />
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-5">
          <GiftCardShare
            card={{
              design: gc.design,
              amountLabel,
              toName: name,
              code: record.code,
              site: origin.replace(/^https?:\/\//, ""),
              validity: validityText(t, record.expiresAt, expires),
              message: gc.asGift ? gc.message : "",
              fromName: gc.asGift ? gc.fromName : "",
            }}
            shareText={text}
            waHref={gc.asGift && gc.toPhone ? waLink(gc.toPhone, text) : `https://wa.me/?text=${encodeURIComponent(text)}`}
            fileName={`giftful-${record.code}`}
          />
        </div>

        <div className="panel space-y-6 border border-line bg-paper p-6 sm:p-8">
          <div>
            <p className="text-sm text-muted">{t("الكود")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="tabular font-heading text-3xl tracking-[0.12em] text-brand select-all" dir="ltr">{record.code}</p>
              <CopyButton value={record.code} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-bg p-4">
              <p className="text-muted">{t("الرصيد")}</p>
              <p className="tabular mt-1 font-heading text-2xl">{egp(record.balance, t)}</p>
            </div>
            <div className="rounded-2xl bg-bg p-4">
              <p className="text-muted">{expired ? t("انتهى في") : t("صالح لحد")}</p>
              <p className="mt-1 font-heading text-lg">{expires}</p>
            </div>
          </div>

          <ol className="space-y-3">
            {[t("اختار الهدية اللي تعجبك من الموقع وحطها في السلة."), t("في صفحة الدفع اكتب الكود في خانة كارت الهدية."), t("الرصيد بيتخصم، ولو فضل حاجة بتفضل في الكارت لطلب تاني.")].map((s, i) => (
              <li key={s} className="flex gap-3 leading-7">
                <span className="tabular grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          {!expired && record.balance > 0 && (
            <Link href="/shop" className="btn-primary w-full">
              <Icon name="gift" className="size-5" />
              {t("اختار هديتك")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
