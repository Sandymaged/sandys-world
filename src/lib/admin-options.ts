import "server-only";
import { getStorefront } from "./catalog";
import { recipientOrder } from "./browse";
import { recipientLabels } from "./seed-data";
import { listOccasions, listSeasons } from "./store-setup";

/** القوايم اللي فورمات الإدارة بتختار منها (المناسبات، لمين، المواسم) */
export async function adminOptions() {
  const [sf, occasions, seasons] = await Promise.all([getStorefront(), listOccasions(), listSeasons()]);
  return {
    occasions: occasions.map((o) => ({ value: o.slug, label: o.name })),
    recipients: recipientOrder.map((r) => ({ value: r, label: recipientLabels[r] })),
    seasons: [{ value: "", label: "من غير موسم" }, ...seasons.map((x) => ({ value: x.id, label: x.name }))],
    minPackageMargin: sf.settings.minPackageMargin,
    packageBoxes: sf.settings.packageBoxes ?? {},
  };
}
