import { getT } from "@/i18n/server";

/*
 * مميزاتنا في ورق ملوّن مايل فوق بعض (زي ورق ملاحظات متلزق)، وكل واحدة بتتنطط وهي بتظهر مع السكرول.
 */

const pills = [
  { text: "هدايا من براندات أسيوط", tone: "bg-blush text-brand-dark", r: "-3deg", shift: "sm:-translate-x-10" },
  { text: "تغليف على ذوق المناسبة", tone: "bg-blue-soft text-blue-deep", r: "2deg", shift: "sm:translate-x-8" },
  { text: "كارت بخط إيدك", tone: "bg-butter-soft text-butter", r: "-2deg", shift: "sm:-translate-x-4" },
  { text: "توصيل في نفس اليوم", tone: "bg-success-soft text-success", r: "3deg", shift: "sm:translate-x-12" },
  { text: "صورة الهدية قبل ما تخرج", tone: "bg-paper text-ink border border-line", r: "-1.5deg", shift: "sm:-translate-x-8" },
];

export async function FeaturePills() {
  const t = await getT();
  return (
    <section className="container-x">
      <div className="panel grain flex flex-col items-center overflow-hidden bg-bg px-6 py-14 text-center sm:py-20">
        <h2 className="reveal text-4xl leading-tight sm:text-6xl">
          {t("على ذوقك.")}
          <br />
          {t("ولحبايبك.")}
        </h2>
        <ul className="mt-10 flex flex-col items-center gap-1">
          {pills.map((p, i) => (
            <li key={p.text} className={p.shift}>
              <span
                className={`reveal-pop inline-block rounded-[1.3rem] px-7 py-3 font-heading text-2xl shadow-[0_10px_20px_-14px_rgb(60_20_25/0.5)] sm:px-9 sm:text-3xl ${p.tone}`}
                style={{ ["--r" as string]: p.r, animationDelay: `${i * 60}ms` }}
              >
                {t(p.text)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
