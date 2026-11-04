import { BrandOrderCard, Box } from "@/components/brand/bits";
import { requireBrand } from "@/lib/brand-auth";
import { listBrandOrders } from "@/lib/brand-portal";

export const instant = false;

export const metadata = { title: "الطلبات" };

/** كل الطلبات اللي فيها منتجات البراند: اللي لسه في الشغل الأول (بميعاد التوصيل)، وبعدها القديمة */
export default async function BrandOrders() {
  const s = await requireBrand();
  const orders = await listBrandOrders(s.partnerId);
  const open = orders.filter((o) => o.open);
  const done = orders.filter((o) => !o.open).slice(0, 50);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-brand">الطلبات</h1>
        <p className="mt-1 text-sm leading-6 text-ink-2">
          بتشوف منتجاتك بس في كل طلب. أي طلب بيوصلك لازم يتجهز ويتسلّم للمتجر قبل ميعاد التوصيل، وبعدها دوس «سلّمت للمتجر». عشان كده خلّي العدد اللي عندك في «منتجاتي» مظبوط أول بأول، وأول ما يخلص المنتج بيتقفل «خلص» لوحده.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-2xl text-ink">في الشغل ({open.length})</h2>
        {open.length === 0 ? (
          <Box>
            <p className="text-center text-muted">مفيش طلبات في الشغل دلوقتي.</p>
          </Box>
        ) : (
          open.map((o) => <BrandOrderCard key={o.id} o={o} />)
        )}
      </section>
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl text-ink">طلبات خلصت</h2>
          {done.map((o) => (
            <BrandOrderCard key={o.id} o={o} />
          ))}
        </section>
      )}
    </div>
  );
}
