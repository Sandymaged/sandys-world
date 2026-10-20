import { Link } from "@/i18n/client";
import { getLocale, getT } from "@/i18n/server";
import type { SiteSettings } from "@/lib/site-settings";
import { GiftRibbon } from "./decor";
import { Logo } from "./logo";

/** لما قسم يتقفل من اللوحة: صفحته بتقول كده بشكل لطيف بدل ما تختفي فجأة */
export async function SectionClosed({ title }: { title: string }) {
  const t = await getT();
  return (
    <section className="container-x py-10 sm:py-16">
      <div className="panel relative mx-auto max-w-3xl overflow-hidden bg-blush px-6 py-14 text-center sm:px-14 sm:py-20">
        <GiftRibbon className="end-12 hidden sm:block" strip="w-5" bowSize="w-32" />
        <p className="font-script text-2xl text-candy">{t(title)}</p>
        <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{t("القسم ده مقفول دلوقتي")}</h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-ink-2">
          {t("بنجهزه بحاجات جديدة وراجعين قريب. لحد ما يرجع، اتفرج على باقي الهدايا.")}
        </p>
        <Link href="/shop" className="btn-primary mt-8">
          {t("شوف كل الهدايا")}
        </Link>
      </div>
    </section>
  );
}

/** الموقع كله مقفول من اللوحة: صفحة واحدة برسالة صاحبة المتجر (اللوحة نفسها شغالة عادي) */
export async function MaintenanceScreen({ m }: { m: SiteSettings["maintenance"] }) {
  const locale = await getLocale();
  const en = locale === "en";
  const title = (en && m.titleEn) || m.title;
  const message = (en && m.messageEn) || m.message;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="panel relative w-full max-w-2xl overflow-hidden bg-paper px-6 py-16 text-center shadow-[0_30px_60px_-40px_rgb(60_30_20/0.6)] sm:px-14 sm:py-20">
        <GiftRibbon className="end-12" strip="w-5" bowSize="w-32" />
        <p className="text-2xl text-ink">
          <Logo />
        </p>
        <h1 className="mt-8 text-4xl leading-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-8 whitespace-pre-line text-ink-2">{message}</p>
        <div className="mx-auto mt-10 flex max-w-xs items-center gap-3 text-candy" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          <span className="font-script text-xl">{en ? "see you soon" : "نشوفكم قريب"}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
      </div>
    </main>
  );
}
