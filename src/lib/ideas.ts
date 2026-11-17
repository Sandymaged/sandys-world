import "server-only";
import { randomUUID } from "node:crypto";
import { adminClient } from "./supabase/admin";

/*
 * دفتر الأفكار في اللوحة: أفكار تسجّليها وترجعيلها بعدين.
 * بيتحفظ في finance_settings (جدول خاص باللوحة بس، مش مقروء للعامة) تحت المفتاح "ideas".
 * لو لسه متحفظش حاجة، بيظهر بالأفكار اللي اتجمعت من تجربة المستخدمين (seedIdeas).
 */

export type IdeaStatus = "idea" | "planned" | "doing" | "done" | "dropped";

export const ideaStatuses: { id: IdeaStatus; label: string; tone: string }[] = [
  { id: "idea", label: "فكرة", tone: "bg-line text-ink-2" },
  { id: "planned", label: "هنعملها", tone: "bg-blue-soft text-blue-deep" },
  { id: "doing", label: "شغالين عليها", tone: "bg-butter-soft text-butter" },
  { id: "done", label: "اتعملت", tone: "bg-success-soft text-success" },
  { id: "dropped", label: "اتلغت", tone: "bg-surface text-muted" },
];

export interface Idea {
  id: string;
  title: string;
  details: string;
  /** المجموعة: للعملاء، للبراندات، … */
  group: string;
  status: IdeaStatus;
  /** حالة التنفيذ في الموقع دلوقتي (اتعمل منها إيه ولسه إيه) */
  progress: string;
  createdAt: string;
}

const KEY = "ideas";
const onSupabase = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

// رقم ثابت لكل فكرة أولية، عشان تعديلها يشتغل حتى قبل أول حفظ
let seedNo = 0;
const seed = (group: string, title: string, details: string, progress: string): Idea => ({
  id: `seed-${++seedNo}`,
  title,
  details,
  group,
  status: "idea",
  progress,
  createdAt: "2026-11-17T00:00:00.000Z",
});

/** الأفكار اللي جت من تجربة المستخدمين (17 نوفمبر 2026)، ومعاها اللي اتعمل منها لحد دلوقتي */
const seedIdeas = (): Idea[] => (seedNo = 0, [
  seed(
    "للعملاء",
    "طرق دفع أكتر: فودافون كاش والكارت",
    "اللي بيبعت هدية لحد تاني مقدامهوش غير إنستاباي، وده هيوقّف ناس كتير، خصوصاً الكبار واللي برا مصر. فودافون كاش ودفع بالكارت (عن طريق Paymob أو Fawry مثلاً) غالباً هيفرق في عدد الطلبات أكتر من أي تغيير في التصميم.",
    "لسه. الموجود دلوقتي: إنستاباي، والدفع عند الاستلام لو العميل هو المستلم بس.",
  ),
  seed(
    "للعملاء",
    "تذكير بالمناسبات",
    "بعد أول طلب، العميل يحفظ «عيد ميلاد ماما ١٢ مارس». وقبلها بأسبوع يوصله واتساب فيه ٣ اقتراحات على قد ميزانيته المرة اللي فاتت. أقوى حاجة ممكن ترجّع الناس، لأنها بتحل مشكلة حقيقية: إن الناس بتنسى.",
    "لسه.",
  ),
  seed(
    "للعملاء",
    "حفظ المستلمين و«ابعت نفس الهدية تاني»",
    "«ماما – أبنوب – العنوان كذا» يتحفظ، والمرة الجاية الطلب ياخد دقيقة. وزرار «ابعت نفس الهدية تاني».",
    "لسه. السلة بتفتكر بيانات آخر طلب على نفس الجهاز بس لحد ما يخلص.",
  ),
  seed(
    "للعملاء",
    "المستلم يرد بـ«شكراً»",
    "بعد التسليم، المستلم يوصله لينك صغير يبعت منه «شكراً» للمرسل بصورة أو فويس. المرسل يحس بالفرحة، والمستلم يعرف الموقع وممكن يبقى الزبون الجاي.",
    "لسه.",
  ),
  seed(
    "للعملاء",
    "معرض «هدايا وصلت»",
    "معرض صغير من صور التسليم، بإذن أصحابها. أكتر حاجة هتبني ثقة، أكتر من أي كلام في الصفحة الرئيسية.",
    "جزئياً: صورة التسليم بتتبعت للمرسل على واتساب (من اللوحة)، بس مفيش معرض على الموقع ولا طلب إذن.",
  ),
  seed(
    "للبراندات",
    "ملخص أسبوعي للبراند على واتساب",
    "مثلاً: «بعتي ٨ قطع، ليكي ١٢٠٠، هتتحوّل الخميس». يخلّي الشغل معاكي أسهل حاجة عندهم.",
    "جزئياً: بوابة البراند فيها كشف الحساب والمستحق، ومكتوب إن التحويل كل أسبوع. مفيش رسالة واتساب.",
  ),
  seed(
    "للبراندات",
    "البراند يحدّث الكمية من غير ما يفتح الموقع",
    "مثلاً برسالة واتساب أو لينك سريع للكمية بس.",
    "لسه. البراند بيحدّث الكمية من بوابته على الموقع.",
  ),
  seed(
    "للبراندات",
    "مساعدة البراندات في تصوير منتجاتهم",
    "الصورة الحلوة بتبيع أكتر. ممكن جلسة تصوير أو دليل بسيط للتصوير بالموبايل.",
    "لسه (دي شغل برا الموقع).",
  ),
]);

export async function loadIdeas(): Promise<Idea[]> {
  if (!onSupabase()) return seedIdeas();
  const { data, error } = await adminClient().from("finance_settings").select("value").eq("key", KEY).maybeSingle();
  if (error || !data?.value) return seedIdeas();
  return (data.value as Idea[]).filter((x) => x && x.id);
}

export async function saveIdeas(list: Idea[]) {
  if (!onSupabase()) throw new Error("دفتر الأفكار يحتاج قاعدة البيانات");
  const { error } = await adminClient().from("finance_settings").upsert({ key: KEY, value: list });
  if (error) throw new Error(error.message);
}

export const newIdea = (p: Omit<Idea, "id" | "createdAt">): Idea => ({ ...p, id: randomUUID(), createdAt: new Date().toISOString() });
