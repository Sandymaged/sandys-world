import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { CartDrawer } from "@/components/cart-drawer";
import { GiftAssistant } from "@/components/gift-assistant";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/** واجهة المتجر: الهيدر والفوتر وشريط التنقل والسلة والمساعد (لوحة التحكم ليها layout لوحدها) */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 overflow-x-clip">{children}</main>
      <SiteFooter />
      {/* بيقروا رابط الصفحة، فبيتحطوا في Suspense عشان الصفحة تتجهز من غيرهم */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      <CartDrawer />
      <Suspense fallback={null}>
        <GiftAssistant />
      </Suspense>
    </>
  );
}
