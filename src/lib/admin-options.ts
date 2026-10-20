import "server-only";
import { getStorefront } from "./catalog";
import { recipientOrder } from "./browse";
import { recipientLabels, seasons } from "./seed-data";

/** القوايم اللي فورمات الإدارة بتختار منها (المناسبات، لمين، المواسم) */
export async function adminOptions() {
  const sf = await getStorefront();
  return {
    occasions: sf.occasions.map((o) => ({ value: o.slug, label: o.name })),
    recipients: recipientOrder.map((r) => ({ value: r, label: recipientLabels[r] })),
    seasons: [{ value: "", label: "من غير موسم" }, ...seasons.map((x) => ({ value: x.id, label: x.name }))],
    minPackageMargin: sf.settings.minPackageMargin,
  };
}
