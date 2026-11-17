"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Link, useT } from "@/i18n/client";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { Icon } from "./icons";

const btn = "btn btn-sm w-full whitespace-nowrap border border-brand/30 bg-brand-soft px-2 text-brand hover:bg-brand hover:text-white";

/**
 * زرار الإضافة تحت كارت المنتج: بيضيفه على طول.
 * لو ليه لون أو مقاس، بيودّي لصفحته يختار الأول (مايتضافش من غير اختيار).
 * الكلام قصير «أضف» عشان مايتكسرش على سطرين في كروت الموبايل.
 */
// round: دايرة صغيرة فيها + بس (للأشكال اللي الزرار فيها فوق الصورة أو جنب السعر)
const roundBtn = "grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white shadow-md transition-transform hover:scale-105";

export function ProductQuickAdd({ product, round = false }: { product: Product; round?: boolean }) {
  const t = useT();
  const addGift = useCart((s) => s.addGift);
  const [added, setAdded] = useState(false);
  if (product.options?.length) {
    return (
      <Link href={`/products/${product.slug}`} className={round ? roundBtn : btn} aria-label={round ? t("اختر الخيارات") : undefined}>
        {round ? <Icon name="sliders" className="size-4" /> : t("اختر الخيارات")}
      </Link>
    );
  }
  return (
    <motion.button
      type="button"
      aria-label={t("ضيف {name} للسلة", { name: product.name })}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        addGift({
          kind: "product",
          title: product.name,
          slug: product.slug,
          refId: product.id,
          image: product.images[0],
          basePrice: 0,
          lines: [
            {
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              quantity: 1,
              customizable: product.isCustomizable,
              maxChars: product.customizationMaxChars,
              customKind: product.customizationKind,
              customization: "",
            },
          ],
          addons: [],
          prepDays: product.prepDays,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
      className={round ? roundBtn : btn}
    >
      <Icon name={added ? "check" : "plus"} className={round ? "size-5" : "size-4"} />
      {!round && (added ? t("تمت الإضافة") : t("أضف"))}
    </motion.button>
  );
}
