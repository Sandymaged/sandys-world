import type { Metadata, Viewport } from "next";
import { Allura, Aref_Ruqaa, El_Messiri, IBM_Plex_Sans_Arabic, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { MotionProvider } from "@/components/motion/providers";
import { LocaleProvider } from "@/i18n/client";
import { dirOf, isLocale, locales } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { STORE_NAME } from "@/lib/settings";
import "../globals.css";

const body = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

// العربي: El Messiri للعناوين (شيك ومقروء)، ورقعة للاقتباسات والكلام المكتوب باليد
const head = El_Messiri({ variable: "--font-head-ar", subsets: ["arabic", "latin"], weight: ["600", "700"] });
const hand = Aref_Ruqaa({ variable: "--font-hand-ar", subsets: ["arabic", "latin"], weight: ["400", "700"] });

// الإنجليزي: Playfair للعناوين، ونفس الخط مايل للاقتباسات (أوضح من الخطوط المكتوبة باليد)
const headEn = Playfair_Display({ variable: "--font-head-en", subsets: ["latin"], weight: ["600", "700"] });
// خط اللوجو (sandy's) مكتوب باليد
const logo = Allura({ variable: "--font-logo-face", subsets: ["latin"], weight: "400" });
const handEn = Playfair_Display({ variable: "--font-hand-en", subsets: ["latin"], weight: ["500"], style: "italic" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = translator(isLocale(lang) ? lang : "ar");
  const name = t(STORE_NAME);
  return {
    title: { default: `${name} | ${t("هدايا مخصصة ومتغلفة في أسيوط")}`, template: `%s | ${name}` },
    description: t("باكدجات هدايا جاهزة ومتغلفة، أو اعمل البوكس بنفسك، وإحنا نوصّلها لأي عنوان في أسيوط في اليوم والفترة اللي تختارها."),
    alternates: { languages: { ar: "/", en: "/en" } },
  };
}

export const viewport: Viewport = {
  themeColor: "#f5efe7",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html
      lang={lang}
      dir={dirOf(lang)}
      className={`${body.variable} ${head.variable} ${hand.variable} ${headEn.variable} ${handEn.variable} ${logo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider locale={lang}>
          <MotionProvider>{children}</MotionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
