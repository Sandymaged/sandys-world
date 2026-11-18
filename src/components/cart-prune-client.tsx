"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { useCart } from "@/store/cart";
import type { CartGift } from "@/lib/cart";
import { Icon } from "./icons";

/** يشيل من السلة أي منتج أو باقة أو طقم أو حجم صندوق مابقاش موجود في الكتالوج، ويقول للعميل */
export function CartPruneClient(props: { products: string[]; packages: string[]; kits: string[]; boxSizes: string[] }) {
  const t = useT();
  const [removed, setRemoved] = useState<string[]>([]);
  const key = [props.products, props.packages, props.kits, props.boxSizes].map((x) => x.join(",")).join("|");

  useEffect(() => {
    const products = new Set(props.products);
    const refs: Record<CartGift["kind"], Set<string>> = {
      product: products,
      package: new Set(props.packages),
      kit: new Set(props.kits),
      box: new Set(props.boxSizes),
    };
    const prune = () => {
      const { gifts } = useCart.getState();
      const gone: string[] = [];
      const kept: CartGift[] = [];
      for (const g of gifts) {
        if (!refs[g.kind]?.has(g.refId)) {
          gone.push(g.title);
          continue;
        }
        const missing = [...g.lines, ...g.addons].filter((l) => !products.has(l.productId));
        if (!missing.length) {
          kept.push(g);
          continue;
        }
        // الباقة محتوياتها ثابتة، فلو منتج منها اتشال الباقة كلها بتتشال
        const lines = g.kind === "package" ? [] : g.lines.filter((l) => products.has(l.productId));
        if (!lines.length) {
          gone.push(g.title);
          continue;
        }
        gone.push(...missing.map((l) => l.name));
        kept.push({ ...g, lines, addons: g.addons.filter((l) => products.has(l.productId)) });
      }
      if (gone.length) {
        useCart.setState({ gifts: kept });
        setRemoved(gone);
      }
    };
    // السلة بتتقري من المتصفح بعد أول رسم، فبنستنى لحد ما تتحمّل
    if (useCart.persist.hasHydrated()) prune();
    return useCart.persist.onFinishHydration(prune);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!removed.length) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-line bg-paper p-4 text-sm shadow-xl md:bottom-6">
      <Icon name="bag" className="mt-0.5 size-5 shrink-0 text-brand" />
      <p className="flex-1 leading-6">
        {t("أزلنا من سلتك ما لم يعد متاحاً:")} <b>{removed.join("، ")}</b>
      </p>
      <button type="button" onClick={() => setRemoved([])} aria-label={t("إغلاق")} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-brand-soft">
        <Icon name="close" className="size-4" />
      </button>
    </div>
  );
}
