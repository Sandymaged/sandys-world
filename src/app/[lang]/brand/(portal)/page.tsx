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
        <p className="mt-1 text-ink-2">هذا ملخص عملك مع المتجر.</p>
      </div>

      {s.mustChangePassword && (
        <Box className="border-butter/40 bg-butter-soft">
          <p className="text-butter">
            أنت تستخدم كلمة المرور التي أرسلها لك المتجر.{" "}
            <Link href="/brand/account" className="font-semibold underline underline-offset-4">غيّرها الآن</Link> ليبقى حسابك خاصاً بك وحدك.
          </p>
        </Box>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="طلبات عليك تسليمها" value={toHand.length} tone="bg-blush" />
        <Stat label="مستحق لك الآن" value={money(st.balance)} hint="طلبات مسلّمة انتهت مدة استرجاعها، بعد خصم التحويلات" />
        <Stat label="مستحقات قريبة" value={money(st.holding + st.pending)} hint="في مدة الاسترجاع أو قيد التنفيذ" />
        <Stat label="منتجاتك" value={mine.length} hint={[pendingReview && `${pendingReview} بانتظار الموافقة`, soldOut && `${soldOut} نفد`].filter(Boolean).join(" · ") || undefined} />
      </div>

      <MonthTierCard p={st.progress} />

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl text-ink">بانتظار التسليم للمتجر</h2>
          <Link href="/brand/orders" className="ms-auto text-sm text-brand hover:underline">كل الطلبات ←</Link>
        </div>
        {toHand.length === 0 ? (
          <Box>
            <p className="text-center text-muted">لا توجد طلبات بانتظارك الآن ✨</p>
          </Box>
        ) : (
          toHand.slice(0, 6).map((o) => <BrandOrderCard key={o.id} o={o} />)
        )}
      </section>
    </div>
  );
}
