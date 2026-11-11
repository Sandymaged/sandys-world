"use client";

import { motion } from "motion/react";
import { Link, useT } from "@/i18n/client";
import type { PackageView } from "@/lib/types";
import { useCart } from "@/store/cart";
import { Icon } from "./icons";

/**
 * زرار واضح تحت كارت الباكدج: بيضيفه على طول ويفتح درج السلة.
 * لو فيه منتج جواه ليه لون أو مقاس، الزرار بيودّي لصفحة الباكدج يختار الأول (مايتضافش من غير اختيار).
 */
export function QuickAdd({ pkg }: { pkg: PackageView }) {
  const t = useT();
  const addGift = useCart((s) => s.addGift);
  if (pkg.products.some((p) => p.options?.length)) {
    return (
      <Link href={`/packages/${pkg.slug}`} className="btn btn-sm w-full border border-brand/30 bg-brand-soft text-brand hover:bg-brand hover:text-white">
        {t("اختار اللون أو المقاس")}
      </Link>
    );
  }
  return (
    <motion.button
      type="button"
      aria-label={t("ضيف {name} للسلة", { name: pkg.name })}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      onClick={() =>
        addGift({
          kind: "package",
          title: pkg.name,
          slug: pkg.slug,
          refId: pkg.id,
          image: pkg.images[0],
          basePrice: pkg.price,
          lines: pkg.products.map((p) => ({
            productId: p.id,
            name: p.name,
            unitPrice: 0,
            quantity: p.quantity,
            customizable: p.isCustomizable,
            maxChars: p.customizationMaxChars,
            customKind: p.customizationKind,
            customization: "",
            options: p.options?.length ? p.options : undefined,
          })),
          addons: [],
          prepDays: pkg.prepDays,
        })
      }
      className="btn btn-sm w-full border border-brand/30 bg-brand-soft text-brand hover:bg-brand hover:text-white"
    >
      <Icon name="plus" className="size-4" />
      {t("ضيف للسلة")}
    </motion.button>
  );
}
