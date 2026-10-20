import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { CartDrawer } from "@/components/cart-drawer";
import { GiftAssistant } from "@/components/gift-assistant";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MaintenanceScreen } from "@/components/closed-screens";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * واجهة المتجر: الهيدر والفوتر وشريط التنقل والسلة والمساعد (لوحة التحكم ليها layout لوحدها).
 * لو الموقع مقفول من اللوحة بتظهر صفحة الرسالة بس، واللوحة بتفضل شغالة.
 */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteSettings();
  if (site.maintenance.enabled) return <MaintenanceScreen m={site.maintenance} />;
  return (
    <>
      <SiteHeader />
      <main className="flex-1 overflow-x-clip">{children}</main>
      <SiteFooter />
      {/* بيقروا رابط الصفحة، فبيتحطوا في Suspense عشان الصفحة تتجهز من غيرهم */}
      <Suspense fallback={null}>
        <BottomNav showBox={site.sections.box} />
      </Suspense>
      <CartDrawer />
      <Suspense fallback={null}>
        <GiftAssistant />
      </Suspense>
    </>
  );
}
