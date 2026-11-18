import { getStorefront } from "@/lib/catalog";
import { CartPruneClient } from "./cart-prune-client";

/**
 * السلة محفوظة في المتصفح، فلو منتج أو باقة اتمسحت من اللوحة بتفضل فيها.
 * هنا بنبعت للمتصفح الموجود فعلاً في الكتالوج، والجزء اللي في المتصفح بيشيل الباقي.
 */
export async function CartPrune() {
  const sf = await getStorefront();
  return (
    <CartPruneClient
      products={sf.products.map((p) => p.id)}
      packages={sf.packages.map((p) => p.id)}
      kits={sf.kits.map((k) => k.id)}
      boxSizes={sf.boxSizes.map((b) => b.id)}
    />
  );
}
