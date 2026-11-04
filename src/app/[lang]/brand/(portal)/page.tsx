import Link from "next/link";
import { money } from "@/components/admin/ui";
import { BrandOrderCard, Box, MonthTierCard, Stat } from "@/components/brand/bits";
import { requireBrand } from "@/lib/brand-auth";
import { brandStatement } from "@/lib/brand-portal";
import { loadCatalogData } from "@/lib/db/catalog-store";

export const instant = false;

export const metadata = { title: "الرئيسية" };

/** أول ما البراند يدخل: الطلبات اللي محتاجة تتسلم، وفلوسه، ومنتجاته اللي مستنية موافقة أو خلصت */
export default async function BrandHome() {
  const s = await requireBrand();
  const [st, catalog] = await Promise.all([brandStatement(s.partnerId), loadCatalogData()]);
  const toHand = st.orders.filter((o) => o.open && !o.handedAt);
  const mine = catalog.products.filter((p) => p.partnerId === s.partnerId);
  const pendingReview = mine.filter((p) => p.reviewStatus === "pending").length;
  const soldOut = mine.filter((p) => p.reviewStatus !== "pending" && (!p.isAvailable || p.stock === 0)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-brand">أهلاً {s.partner.name} 👋</h1>
        <p className="mt-1 text-ink-2">ده ملخص شغلك مع المتجر.</p>
      </div>

      {s.mustChangePassword && (
        <Box className="border-butter/40 bg-butter-soft">
          <p className="text-butter">
            إنت داخل بكلمة السر اللي المتجر بعتهالك.{" "}
            <Link href="/brand/account" className="font-semibold underline underline-offset-4">غيّرها دلوقتي</Link> عشان حسابك يبقى بتاعك بس.
          </p>
        </Box>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="طلبات لازم تسلّمها" value={toHand.length} tone="bg-blush" />
        <Stat label="مستحق ليك دلوقتي" value={money(st.balance)} hint="طلبات اتسلمت وعدّت مدة الاسترجاع، بعد التحويلات" />
        <Stat label="هتستحق قريب" value={money(st.holding + st.pending)} hint="في مدة الاسترجاع أو لسه في الشغل" />
        <Stat label="منتجاتك" value={mine.length} hint={[pendingReview && `${pendingReview} مستني موافقة`, soldOut && `${soldOut} خلص`].filter(Boolean).join(" · ") || undefined} />
      </div>

      <MonthTierCard p={st.progress} />

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl text-ink">محتاج يتسلّم للمتجر</h2>
          <Link href="/brand/orders" className="ms-auto text-sm text-brand hover:underline">كل الطلبات ←</Link>
        </div>
        {toHand.length === 0 ? (
          <Box>
            <p className="text-center text-muted">مفيش طلبات مستنياك دلوقتي ✨</p>
          </Box>
        ) : (
          toHand.slice(0, 6).map((o) => <BrandOrderCard key={o.id} o={o} />)
        )}
      </section>
    </div>
  );
}
