import type { Metadata } from "next";
import { getLocale, getT } from "@/i18n/server";
import { Link } from "@/i18n/client";
import { Icon, type IconName } from "@/components/icons";
import { getStorefront } from "@/lib/catalog";
import { periodLabel } from "@/lib/delivery";
import { GIFT_CARD_VALID_DAYS } from "@/lib/gift-card";
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
          title: "Returns and exchanges",
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
            <>For now we deliver inside Assiut City only, with our own courier. The fee for your area shows in the cart before you pay.</>,
            <>You choose the day and time: {periods}.</>,
            <>Same-day delivery is available inside Assiut city for ready gifts if you order before {cutoff} PM. Gifts that need preparing show their preparation days at checkout.</>,
            <>If we can&apos;t deliver (the recipient isn&apos;t there, the phone is off, or the address is wrong), a second try on the same day is free. Another day comes with a new delivery fee.</>,
            <>Prices are never written on the gift unless you ask.</>,
          ],
        },
        {
          id: "gift-cards",
          title: "Gift cards",
          items: [
            <>A gift card is valid for {GIFT_CARD_VALID_DAYS} days from the day its code is sent, and can be used over several orders within that time until its balance runs out. After that it can&apos;t be used or refunded.</>,
            <>Gift cards can&apos;t be exchanged for cash.</>,
            <>You buy them from the cart like any gift, with no shipping fee, paid with InstaPay. The code is sent on WhatsApp once payment is confirmed: to the person, if you ask us to send it (only they get the code, and your order page shows when it&apos;s been sent), or to you if you&apos;ll send it yourself.</>,
            <>Discount codes don&apos;t apply to gift cards, and a new gift card can&apos;t be paid for with another gift card.</>,
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
          title: "الاسترجاع والاستبدال",
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
            <>بنوصّل جوه مدينة أسيوط بس دلوقتي، بمندوب خاص. ورسوم التوصيل لمنطقتك بتظهر في السلة قبل ما تدفع.</>,
            <>إنت اللي بتختار اليوم والفترة: {periods}.</>,
            <>التوصيل في نفس اليوم متاح جوه مدينة أسيوط للهدايا الجاهزة، لو طلبت قبل الساعة {cutoff} الضهر. والهدايا اللي محتاجة تجهيز بيظهرلك عدد أيام تجهيزها وإنت بتطلب.</>,
            <>لو مقدرناش نوصّل (المستلم مش موجود، أو الموبايل مقفول، أو العنوان غلط)، المحاولة التانية في نفس اليوم ببلاش، وفي يوم تاني برسوم توصيل جديدة.</>,
            <>السعر عمره ما بيتكتب على الهدية إلا لو طلبت.</>,
          ],
        },
        {
          id: "gift-cards",
          title: "كروت الهدايا",
          items: [
            <>كارت الهدية صالح {GIFT_CARD_VALID_DAYS} يوم بس من يوم ما الكود يتبعت، وينفع يتصرف على كذا طلب في المدة دي لحد ما رصيده يخلص. بعدها مينفعش يتستخدم ولا فلوسه ترجع.</>,
            <>كارت الهدية مينفعش يتبدّل بفلوس.</>,
            <>بيتشرى من السلة زي أي هدية، من غير مصاريف شحن، والدفع بإنستاباي. والكود بيتبعت على واتساب أول ما الدفع يتأكد: للي هيوصله لو اخترت إننا نبعته (والكود بيوصله هو بس، وإنت بتشوف في صفحة طلبك إنه اتبعت)، أو ليك إنت لو هتبعته بنفسك.</>,
            <>أكواد الخصم مش بتتطبق على كروت الهدايا، ومينفعش تدفع تمن كارت هدية جديد بكارت هدية تاني.</>,
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

  // شكل كل قسم: أيقونة ولون
  const look: Record<string, { icon: IconName; tone: string; soft: string }> = {
    cancel: { icon: "close", tone: "text-brand", soft: "bg-brand-soft" },
    returns: { icon: "route", tone: "text-blue-deep", soft: "bg-blue-soft" },
    delivery: { icon: "truck", tone: "text-success", soft: "bg-success-soft" },
    "gift-cards": { icon: "gift", tone: "text-butter", soft: "bg-butter-soft" },
    privacy: { icon: "key", tone: "text-lilac", soft: "bg-lilac-soft" },
  };
  // أهم الأرقام في كروت صغيرة فوق
  const facts = en
    ? [
        { big: "Free", small: "cancel before we start preparing", tone: "bg-brand-soft text-brand" },
        { big: "24h", small: "to report a problem with a photo", tone: "bg-blue-soft text-blue-deep" },
        { big: "3 days", small: "to return regular products", tone: "bg-butter-soft text-butter" },
        { big: "Free", small: "second delivery try the same day", tone: "bg-success-soft text-success" },
      ]
    : [
        { big: "ببلاش", small: "الإلغاء قبل ما نبدأ نجهّز", tone: "bg-brand-soft text-brand" },
        { big: "24 ساعة", small: "تبلّغ فيهم عن أي مشكلة بصورة", tone: "bg-blue-soft text-blue-deep" },
        { big: "3 أيام", small: "لاسترجاع المنتجات العادية", tone: "bg-butter-soft text-butter" },
        { big: "ببلاش", small: "محاولة التوصيل التانية في نفس اليوم", tone: "bg-success-soft text-success" },
      ];

  return (
    <div className="container-x pt-8 pb-4 sm:pt-12">
      {/* العنوان وأهم الأرقام */}
      <header className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="reveal">
          <span className="font-script text-3xl text-brand">{t(STORE_NAME)}</span>
          <h1 className="mt-1 text-5xl leading-tight sm:text-6xl">{t("السياسات")}</h1>
          <p className="mt-3 max-w-md text-lg leading-8 text-ink-2">{t("كل اللي محتاج تعرفه عن الإلغاء والاسترجاع والتوصيل وبياناتك، بالبساطة.")}</p>
        </div>
        <ul className="reveal-stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((f, i) => (
            <li key={i} className={`rounded-3xl p-4 ${f.tone} ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
              <p className="font-heading text-3xl leading-none">{f.big}</p>
              <p className="mt-2 text-sm leading-5 text-ink-2">{f.small}</p>
            </li>
          ))}
        </ul>
      </header>

      {/* grid-cols-1 = minmax(0,1fr): من غيرها شريط الأقسام اللي بيتسحب على الموبايل بيعرّض الصفحة كلها */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        {/* الأقسام: على الكمبيوتر قايمة ثابتة على جنب، وعلى الموبايل صف بيتسحب */}
        <nav className="min-w-0 lg:sticky lg:top-40 lg:self-start" aria-label={t("السياسات")}>
          <ul className="scroll-x lg:mx-0 lg:block lg:space-y-1 lg:px-0">
            {sections.map((x) => (
              <li key={x.id} className="shrink-0">
                <a href={`#${x.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold text-ink-2 transition-colors hover:bg-paper hover:text-ink">
                  <span className={`grid size-8 place-items-center rounded-full ${look[x.id].soft} ${look[x.id].tone}`}>
                    <Icon name={look[x.id].icon} className="size-4" />
                  </span>
                  {x.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          {sections.map((x) => (
            <section key={x.id} id={x.id} className="reveal scroll-mt-40 rounded-[2rem] border border-line bg-paper p-6 sm:p-9">
              <div className="flex items-center gap-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${look[x.id].soft} ${look[x.id].tone}`}>
                  <Icon name={look[x.id].icon} className="size-6" />
                </span>
                <h2 className="text-3xl">{x.title}</h2>
              </div>
              <ol className="mt-6 divide-y divide-dashed divide-line">
                {x.items.map((it, i) => (
                  <li key={i} className="flex gap-4 py-3.5 leading-7">
                    <span className={`tabular mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${look[x.id].soft} ${look[x.id].tone}`}>{i + 1}</span>
                    <span className="text-[17px] text-ink-2">{it}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <div className="reveal flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-blue-soft p-6 sm:p-8">
            <div>
              <p className="font-heading text-2xl">{t("عندك سؤال؟")}</p>
              <p className="mt-1 text-ink-2">{t("كلمنا من الشات اللي في صفحة طلبك، وهنرد عليك.")}</p>
            </div>
            <Link href="/track" className="btn-primary">
              {t("كلمنا من صفحة طلبك")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
