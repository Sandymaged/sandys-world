import { Bow } from "@/components/decor";
import { StickyNote } from "@/components/scrapbook";
import { Link } from "@/i18n/client";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="bg-grid-paper py-20">
      <div className="container-x flex justify-center">
        <StickyNote tone="pink" rotate={-2} className="w-full max-w-md text-center">
          <Bow className="mx-auto w-20 text-brand" />
          <p className="mt-2 text-4xl text-brand [font-family:var(--font-heading)]">{t("الصفحة دي مش موجودة")}</p>
          <p className="mt-3 font-script text-xl text-ink-2">{t("ممكن الهدية خلصت أو ميعاد الموسم بتاعها انتهى.")}</p>
          <Link href="/shop" className="btn-primary mt-6">{t("شوف الهدايا المتاحة")}</Link>
        </StickyNote>
      </div>
    </div>
  );
}
