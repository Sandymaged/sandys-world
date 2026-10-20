import { NextResponse, type NextRequest } from "next/server";

/**
 * العربي على المسارات من غير بادئة (/shop)، والإنجليزي على /en/shop.
 * جوه التطبيق كل الصفحات تحت [lang]، فبنعمل rewrite للعربي على /ar من غير ما اللينك يتغير.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // ملفات زي /robots.txt أو صور في public: سيبها
  // صور إثبات التحويل جوه اللوحة اسمها فيه نقطة بس لازم تعدي على [lang] زي باقي الصفحات
  if (pathname.includes(".") && !/^\/(en\/)?(admin\/files|media)\//.test(pathname)) {
    return NextResponse.next();
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  const url = req.nextUrl.clone();
  url.pathname = `/ar${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
