import type { Metadata } from "next";
import { getLocale, getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import { PageHeader } from "@/components/scrapbook";
import { getStorefront } from "@/lib/catalog";
import { periodLabel } from "@/lib/delivery";
import { GIFT_CARD_VALID_MONTHS } from "@/lib/gift-card";
import { STORE_NAME } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("السياسات"), description: t("الإلغاء والاسترجاع والتوصيل والخصوصية") };
}

type Section = { id: string; title: string; items: React.ReactNode[] };

/**
 * السياسات: الإلغاء والاسترجاع والتوصيل والخصوصية.
 * المواعيد والمدد بتتقري من إعدادات المتجر، فلو اتغيرت من اللوحة الصفحة بتتغير معاها.
 */
export default async function PoliciesPage() {
  const [locale, t, sf] = await Promise.all([getLocale(), getT(), getStorefront()]);
  const s = sf.settings;
  const periods = s.periods.map((p) => periodLabel(p.id, s, t)).join(locale === "en" ? ", " : "، ");
  const cutoff = s.sameDayCutoffHour > 12 ? s.sameDayCutoffHour - 12 : s.sameDayCutoffHour;
  const en = locale === "en";

  const sections: Section[] = en
    ? [
        {
          id: "cancel",
          title: "Cancelling an order",
          items: [
            <>You can cancel for free until we start preparing your gift. That&apos;s right after you confirm our confirmation message.</>,
            <>Once preparation starts, the order can&apos;t be cancelled, because our local brands start making it just for you.</>,
            <>Personalised items (with a name or custom print) can&apos;t be refunded after preparation starts.</>,
            <>InstaPay orders that aren&apos;t paid within {s.paymentWindowHours} hours are cancelled automatically ({s.sameDayPaymentWindowHours} hours for same-day delivery).</>,
            <>If you cancel before preparation and already paid, we refund the full amount to the account you paid from. If you paid with a gift card, the balance goes back to the card.</>,
          ],
        },
        {
          id: "returns",
          title: "Problems and returns",
          items: [
            <>If the gift arrives damaged or different from your order, send us a photo in the chat on your order page within 24 hours of delivery. We&apos;ll replace it or refund its price.</>,
            <>Regular products that are unused and in their original packaging can be returned within 3 days of delivery. The return delivery fee is on the customer.</>,
            <>Personalised items, flowers, food and chocolate can&apos;t be returned unless they arrived with a problem.</>,
            <>Refunds go back to the account you paid from, or as gift card balance if you prefer.</>,
          ],
        },
        {
          id: "delivery",
          title: "Delivery",
          items: [
            <>We deliver anywhere in Assiut with our own courier, and to other governorates through a shipping company. The fee for your area shows in the cart before you pay.</>,
            <>You choose the day and time: {periods}.</>,
            <>Same-day delivery is available inside Assiut city for ready gifts if you order before {cutoff} PM. Gifts that need preparing show their preparation days at checkout.</>,
            <>If we can&apos;t deliver (the recipient isn&apos;t there, the phone is off, or the address is wrong), a second try on the same day is free. Another day comes with a new delivery fee.</>,
            <>Choose &quot;surprise&quot; and the courier won&apos;t call the recipient until he&apos;s at the door. Prices are never written on the gift unless you ask.</>,
          ],
        },
        {
          id: "gift-cards",
          title: "Gift cards",
          items: [
            <>A gift card is valid for {GIFT_CARD_VALID_MONTHS} months from purchase, and can be used over several orders until its balance runs out.</>,
            <>Gift cards can&apos;t be exchanged for cash.</>,
          ],
        },
        {
          id: "privacy",
          title: "Privacy",
          items: [
            <>We only ask for what we need to deliver: your name, phone and email, and the recipient&apos;s name, phone and address.</>,
            <>The recipient&apos;s details go only to the courier delivering the gift. The brands that make your gift don&apos;t see your name, phone or address.</>,
            <>Payment screenshots are stored privately and only the store team can see them.</>,
            <>We don&apos;t sell or share your data with anyone for advertising.</>,
            <>Your cart and language choice are saved in your browser. We don&apos;t use ad trackers.</>,
            <>To see or delete your data, message us in the chat on your order page.</>,
          ],
        },
      ]
    : [
        {
          id: "cancel",
          title: "إلغاء الطلب",
          items: [
            <>تقدر تلغي الطلب ببلاش لحد ما نبدأ نجهّز الهدية، يعني لحد ما ترد على رسالة التأكيد بتاعتنا.</>,
            <>أول ما التجهيز يبدأ الطلب مينفعش يتلغي، لأن البراندات المحلية بتبدأ تعمل الهدية مخصوص ليك.</>,
            <>المنتجات المخصوصة (اللي عليها اسم أو طباعة على ذوقك) فلوسها مش بترجع بعد ما التجهيز يبدأ.</>,
            <>طلبات إنستاباي اللي متدفعتش خلال {s.paymentWindowHours} ساعة بتتلغي لوحدها ({s.sameDayPaymentWindowHours} ساعة لو التوصيل في نفس اليوم).</>,
            <>لو لغيت قبل التجهيز وكنت دفعت، بنرجّعلك المبلغ كامل على نفس الحساب اللي حوّلت منه. ولو دفعت بكارت هدية، الرصيد بيرجع للكارت.</>,
          ],
        },
        {
          id: "returns",
          title: "المشاكل والاسترجاع",
          items: [
            <>لو الهدية وصلت فيها مشكلة أو مختلفة عن اللي طلبته، ابعتلنا صورة في الشات اللي في صفحة طلبك خلال 24 ساعة من التسليم، ونبدّلها أو نرجّعلك تمنها.</>,
            <>المنتجات العادية اللي متستعملتش وفي تغليفها الأصلي ممكن ترجع خلال 3 أيام من التسليم، ومصاريف توصيل المرتجع على العميل.</>,
            <>المنتجات المخصوصة والورد والأكل والشوكولاتة مش بترجع، إلا لو وصلت فيها مشكلة.</>,
            <>الفلوس بترجع على نفس الحساب اللي دفعت منه، أو رصيد في كارت هدية لو تحب.</>,
          ],
        },
        {
          id: "delivery",
          title: "التوصيل",
          items: [
            <>بنوصّل لأي مكان في أسيوط بمندوب خاص، وباقي المحافظات بشركة شحن. ورسوم التوصيل لمنطقتك بتظهر في السلة قبل ما تدفع.</>,
            <>إنت اللي بتختار اليوم والفترة: {periods}.</>,
            <>التوصيل في نفس اليوم متاح جوه مدينة أسيوط للهدايا الجاهزة، لو طلبت قبل الساعة {cutoff} الضهر. والهدايا اللي محتاجة تجهيز بيظهرلك عدد أيام تجهيزها وإنت بتطلب.</>,
            <>لو مقدرناش نوصّل (المستلم مش موجود، أو الموبايل مقفول، أو العنوان غلط)، المحاولة التانية في نفس اليوم ببلاش، وفي يوم تاني برسوم توصيل جديدة.</>,
            <>لو اخترت «مفاجأة»، المندوب مش هيكلم المستلم غير وهو على الباب. والسعر عمره ما بيتكتب على الهدية إلا لو طلبت.</>,
          ],
        },
        {
          id: "gift-cards",
          title: "كروت الهدايا",
          items: [
            <>كارت الهدية صالح {GIFT_CARD_VALID_MONTHS} شهر من يوم الشراء، وينفع يتصرف على كذا طلب لحد ما رصيده يخلص.</>,
            <>كارت الهدية مينفعش يتبدّل بفلوس.</>,
          ],
        },
        {
          id: "privacy",
          title: "الخصوصية",
          items: [
            <>بناخد بس اللي محتاجينه عشان نوصّل الهدية: اسمك وموبايلك وإيميلك، واسم المستلم وموبايله وعنوانه.</>,
            <>بيانات المستلم بتروح للمندوب اللي هيوصّل الهدية بس. والبراندات اللي بتعمل هديتك مش بيشوفوا اسمك ولا موبايلك ولا عنوانك.</>,
            <>صور التحويل بتتحفظ في مكان خاص، ومحدش بيشوفها غير فريق المتجر.</>,
            <>مش بنبيع بياناتك ولا بنديها لحد عشان إعلانات.</>,
            <>السلة واللغة اللي اخترتها بيتحفظوا في المتصفح عندك، ومش بنستخدم أي حاجة بتتبعك عشان الإعلانات.</>,
            <>لو عايز تشوف بياناتك أو تمسحها، كلمنا في الشات اللي في صفحة طلبك.</>,
          ],
        },
      ];

  return (
    <div className="pb-4">
      <PageHeader tone="lilac"kicker={t(STORE_NAME)} title={t("السياسات")} subtitle={t("كل اللي محتاج تعرفه عن الإلغاء والاسترجاع والتوصيل وبياناتك، بالبساطة.")}>
        <nav className="mt-5 flex flex-wrap justify-center gap-2">
          {sections.map((x) => (
            <a key={x.id} href={`#${x.id}`} className="chip bg-paper hover:border-brand hover:text-brand">
              {x.title}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="container-x mx-auto max-w-3xl space-y-6 py-10">
        {sections.map((x) => (
          <section key={x.id} id={x.id} className="scroll-mt-24 rounded-3xl border border-line bg-paper p-6 shadow-[0_16px_28px_-20px_rgb(60_20_25/0.55)] sm:p-8">
            <h2 className="text-2xl text-brand">{x.title}</h2>
            <ul className="mt-4 space-y-3 leading-7">
              {x.items.map((it, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-center text-sm text-muted">
          {t("عندك سؤال؟")} <Link href="/track" className="text-brand underline underline-offset-4">{t("كلمنا من صفحة طلبك")}</Link>
        </p>
      </div>
    </div>
  );
}
