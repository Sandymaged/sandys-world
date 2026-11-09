import { getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import { Icon } from "./icons";

export async function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const t = await getT();
  return (
    <nav aria-label={t("مسار الصفحة")} className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-1">
          {i > 0 && <Icon name="chevron" className="size-3.5" />}
          {it.href ? (
            <Link href={it.href} className="hover:text-ink">{it.label}</Link>
          ) : (
            <span className="text-ink-2">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** معلومات التوصيل والاسترجاع (قسم 8.2 و 8.4) تحت زرار الشراء */
export async function PolicyDetails({ customizable }: { customizable: boolean }) {
  const t = await getT();
  const rows = [
    {
      title: "التوصيل",
      body: "بنوصّل جوه مدينة أسيوط بس دلوقتي، بمندوب خاص. بتختار يوم وفترة التوصيل لكل هدية في السلة، ورسوم التوصيل بتظهر قبل الدفع.",
    },
    {
      title: "الصور",
      body: "هنبعتلك على واتساب صورة الهدية قبل ما تخرج، وصورة وهي بتتسلم لو طلبت كده.",
    },
    {
      title: "الإلغاء والاسترجاع",
      body: customizable
        ? "الإلغاء مجاني قبل ما نبدأ التجهيز. المنتجات المتخصصة بالاسم مش بترجع بعد التنفيذ، إلا لو فيها عيب أو غلط مننا، ويتبلغ خلال 48 ساعة بصورة."
        : "الإلغاء مجاني قبل ما نبدأ التجهيز. لو فيه عيب بلغنا خلال 48 ساعة بصورة. الورد الطبيعي بيتبدل لو وصل دبلان.",
    },
  ];
  return (
    <div className="divide-y divide-line border-y border-line">
      {rows.map((r, i) => (
        <details key={r.title} className="group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold">
            {t(r.title)}
            <Icon name="plus" className="size-4 transition-transform group-open:rotate-45" />
          </summary>
          <p className="pb-4 text-sm leading-7 text-ink-2">{t(r.body)}</p>
        </details>
      ))}
    </div>
  );
}
