import { ImageResponse } from "next/og";
import { giftCardLooks, ribbonPaths } from "@/components/gift-card-art";
import { giftCardByCode } from "@/lib/gift-card-view";

/**
 * صورة المعاينة اللي بتظهر في واتساب تحت لينك الكارت.
 * الكلام فيها إنجليزي وأرقام بس (مولّد الصور مش بيوصّل الحروف العربي)، والكود مش فيها.
 */
export async function GET(_req: Request, ctx: RouteContext<"/[lang]/card-image/[code]">) {
  const { code } = await ctx.params;
  const found = await giftCardByCode(code);
  if (!found) return new Response("Not found", { status: 404 });
  const look = giftCardLooks[found.gc.design];
  const amount = `EGP ${found.gc.amount.toLocaleString("en-US")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: look.bg, position: "relative", color: look.ink }}>
        <svg width="1200" height="630" viewBox="0 0 420 260" preserveAspectRatio="xMinYMin slice" style={{ position: "absolute", top: 0, left: 0 }}>
          {ribbonPaths.map((d) => (
            <path key={d} d={d} stroke={look.ink} strokeWidth="9" fill="none" strokeLinecap="round" />
          ))}
          {ribbonPaths.map((d) => (
            <path key={`i${d}`} d={d} stroke={look.bg} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          ))}
        </svg>
        <div style={{ position: "absolute", right: 70, top: 60, fontSize: 64, fontStyle: "italic", fontWeight: 700 }}>giftful</div>
        <div style={{ position: "absolute", right: 70, bottom: 70, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ fontSize: 40, letterSpacing: 8, opacity: 0.8 }}>GIFT CARD</div>
          <div style={{ fontSize: 110, fontWeight: 700 }}>{amount}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400" } },
  );
}
