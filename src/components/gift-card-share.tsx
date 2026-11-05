"use client";

import { useEffect, useState } from "react";
import { useDir, useT } from "@/i18n/client";
import type { GiftCardDesign } from "@/lib/gift-card";
import { bow } from "./decor";
import { giftCardLooks, ribbonPaths } from "./gift-card-art";
import { Icon } from "./icons";

// نفس نسبة الكارت في الموقع كله (كارت البنك)، و1% من العرض = cqw في GiftCardArt
const W = 1586;
const H = 1000;
const CQ = W / 100;
const BRAND = "#a3212c";
const PINK = "#f2c4ce";
// خيط اللوجو (مساحة 200×30)
const THREAD = "M3 19 C 28 12, 50 23, 78 18 S 124 12, 146 17 C 158 20, 166 20, 170 13 C 174 5, 162 3, 162 11 C 162 19, 178 22, 197 18";

export interface CardFace {
  design: GiftCardDesign;
  amountLabel: string;
  toName: string;
  code: string;
  site: string;
  /** «صالح … لحد …» جاهزة بلغة الصفحة */
  validity: string | null;
}

/** خطوط الموقع نفسها (next/font) بأساميها الحقيقية عشان الـ canvas يرسم بيها */
function fonts() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const ar = document.documentElement.lang !== "en";
  return {
    body: v("--font-body", "sans-serif"),
    head: v(ar ? "--font-head-ar" : "--font-head-en", "serif"),
    hand: v(ar ? "--font-hand-ar" : "--font-hand-en", "serif"),
    logo: v("--font-hand-en", "serif"),
    rtl: ar,
  };
}

/** بيقسم الكلام على سطور على قد العرض */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function dots(ctx: CanvasRenderingContext2D, color: string, gap: number, r: number) {
  ctx.fillStyle = color;
  for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** وش الكارت: نفس رسمة GiftCardArt بالظبط (الشريطة، «كارت هدية»، لمين والمبلغ والكود، واسم المتجر) */
function drawFront(ctx: CanvasRenderingContext2D, c: CardFace, l: { title: string; to: string }) {
  const f = fonts();
  const look = giftCardLooks[c.design];
  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, W, H);
  if (look.dots) dots(ctx, look.dots, 26 * (W / 700), 2.2 * (W / 700));

  // الشريطة (viewBox 420×260 بـ slice من فوق على الشمال)
  const s = Math.max(W / 420, H / 260);
  ctx.save();
  ctx.scale(s, s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [color, width] of [[look.ink, 9], [look.bg, 4.5]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (const d of ribbonPaths) ctx.stroke(new Path2D(d));
  }
  ctx.beginPath();
  ctx.ellipse(120, 105, 9, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = look.bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = look.ink;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = look.ink;
  ctx.direction = f.rtl ? "rtl" : "ltr";

  // «كارت هدية» في النص بين 38% و94% من العرض، تحت الشريطة
  ctx.textAlign = "center";
  ctx.font = `400 ${11 * CQ}px ${f.hand}`;
  ctx.fillText(l.title, W * 0.66, H * 0.4 + 11 * CQ * 0.95);

  // لمين والمبلغ والكود: بلوك بيبدأ من 42% من العرض وتحت بـ 8%
  ctx.font = `700 ${3.4 * CQ}px ${f.body}`;
  ctx.letterSpacing = `${0.14 * 3.4 * CQ}px`;
  const codeW = c.code ? ctx.measureText(c.code).width : 0;
  ctx.letterSpacing = "0px";
  ctx.font = `600 ${4.8 * CQ}px ${f.body}`;
  const amountW = ctx.measureText(c.amountLabel).width;
  const left = W * 0.42;
  const edge = f.rtl ? left + Math.max(codeW, amountW) : left;
  ctx.textAlign = f.rtl ? "right" : "left";
  let y = H * 0.92;
  if (c.code) {
    ctx.direction = "ltr";
    ctx.textAlign = f.rtl ? "right" : "left";
    ctx.font = `700 ${3.4 * CQ}px ${f.body}`;
    ctx.letterSpacing = `${0.14 * 3.4 * CQ}px`;
    ctx.fillText(c.code, f.rtl ? edge + 0.14 * 3.4 * CQ : edge, y - 1.2 * CQ);
    ctx.letterSpacing = "0px";
    ctx.direction = f.rtl ? "rtl" : "ltr";
    y -= 3.4 * CQ * 1.5 + 4;
  }
  ctx.font = `600 ${4.8 * CQ}px ${f.body}`;
  ctx.fillText(c.amountLabel, edge, y - 1.6 * CQ);
  y -= 4.8 * CQ * 1.5;
  if (c.toName) {
    ctx.globalAlpha = 0.8;
    ctx.font = `400 ${3.4 * CQ}px ${f.body}`;
    ctx.fillText(l.to, edge, y - 1.2 * CQ);
    ctx.globalAlpha = 1;
  }

  // اسم المتجر تحت على اليمين
  ctx.direction = "ltr";
  ctx.textAlign = "right";
  ctx.font = `400 ${6 * CQ}px ${f.hand}`;
  ctx.fillText("giftful", W * 0.94, H * 0.93);
}

/** ضهر الكارت: الفيونكة واللوجو وأمنياتنا، وإزاي يستخدمه */
function drawBack(ctx: CanvasRenderingContext2D, c: CardFace, l: { tagline: string; wishes: string; how: string }) {
  const f = fonts();
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, W, H);
  dots(ctx, "rgba(255,255,255,0.07)", 52, 4.5);

  // إطار متقطع زي طابع البريد
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.roundRect(36, 36, W - 72, H - 72, 32);
  ctx.stroke();
  ctx.setLineDash([]);

  // الفيونكة
  ctx.save();
  ctx.translate(W / 2 - 102, 70);
  ctx.scale(1.7, 1.7);
  ctx.fillStyle = "#fff";
  for (const d of [bow.tailL, bow.tailR, bow.loopL, bow.loopR]) ctx.fill(new Path2D(d));
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (const d of [bow.foldL, bow.foldR]) ctx.fill(new Path2D(d));
  ctx.beginPath();
  ctx.roundRect(51, 28, 18, 17, 6);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();

  // اللوجو والخيط
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  ctx.fillStyle = "#fff";
  ctx.font = `italic 600 130px ${f.logo}`;
  ctx.fillText("giftful", W / 2, 385);
  ctx.save();
  ctx.translate(W / 2 - 200, 398);
  ctx.scale(2, 2);
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D(THREAD));
  ctx.restore();

  ctx.direction = f.rtl ? "rtl" : "ltr";
  ctx.fillStyle = PINK;
  ctx.font = `400 52px ${f.hand}`;
  ctx.fillText(l.tagline, W / 2, 525);

  // أمنياتنا
  ctx.fillStyle = "#fff";
  ctx.font = `600 44px ${f.head}`;
  let y = 610;
  for (const line of wrap(ctx, l.wishes, 1250).slice(0, 3)) {
    ctx.fillText(line, W / 2, y);
    y += 62;
  }

  // المدة (قصيرة، فلازم تبان)
  if (c.validity) {
    ctx.font = `700 34px ${f.body}`;
    const w = ctx.measureText(c.validity).width + 64;
    ctx.beginPath();
    ctx.roundRect((W - w) / 2, 790, w, 60, 30);
    ctx.fillStyle = PINK;
    ctx.fill();
    ctx.fillStyle = BRAND;
    ctx.fillText(c.validity, W / 2, 832);
    ctx.fillStyle = "#fff";
  }

  // إزاي يستخدمه
  ctx.globalAlpha = 0.85;
  ctx.font = `400 30px ${f.body}`;
  ctx.fillText(l.how, W / 2, 900);
  ctx.direction = "ltr";
  ctx.font = `700 32px ${f.body}`;
  ctx.fillText(c.site, W / 2, 942);
  ctx.globalAlpha = 1;
}

async function render(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  draw(canvas.getContext("2d")!);
  return new Promise<Blob>((ok) => canvas.toBlob((b) => ok(b!), "image/png"));
}

/**
 * الكارت صورة بوشّين: الوش نفس كارت الموقع (لمين والمبلغ والكود)، والضهر فيه لوجو المتجر وأمنياتنا.
 * بيتقلب بضغطة، وبيتبعت صور على واتساب (على الموبايل بالمشاركة، وعلى الكمبيوتر بيتنزل ويفتح واتساب).
 */
export function GiftCardShare({ card, shareText, waHref, fileName }: { card: CardFace; shareText: string; waHref: string; fileName: string }) {
  const t = useT();
  const dir = useDir();
  const [imgs, setImgs] = useState<{ front: File; back: File; frontUrl: string; backUrl: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);

  const labels = {
    title: t("كارت هدية"),
    to: t("لـ {name}", { name: card.toName }),
    tagline: t("هدية متغلفة بحب"),
    wishes: t("كل سنة وإنت طيب، ودايماً حواليك ناس بتحبك وبتفتكرك. الكارت ده مستنيك تختار بيه اللي يفرّحك، وإحنا علينا نغلّفهولك ونوصّلهولك بحب."),
    how: t("اختار هديتك من الموقع، واكتب الكود اللي على وش الكارت وإنت بتدفع."),
  };
  const key = JSON.stringify([card, labels]);

  useEffect(() => {
    let urls: string[] = [];
    let live = true;
    (async () => {
      const f = fonts();
      // الخطوط لازم تكون اتحمّلت قبل الرسم، وإلا الـ canvas بيرسم بخط تاني
      await Promise.all(
        [`400 52px ${f.hand}`, `600 44px ${f.head}`, `italic 600 64px ${f.logo}`, `700 54px ${f.body}`, `600 54px ${f.body}`, `400 30px ${f.body}`].map((x) =>
          document.fonts.load(x, "كارت هدية giftful 123").catch(() => []),
        ),
      );
      await document.fonts.ready;
      const [fb, bb] = await Promise.all([render((ctx) => drawFront(ctx, card, labels)), render((ctx) => drawBack(ctx, card, labels))]);
      if (!live) return;
      const front = new File([fb], `${fileName}-1.png`, { type: "image/png" });
      const back = new File([bb], `${fileName}-2.png`, { type: "image/png" });
      urls = [URL.createObjectURL(front), URL.createObjectURL(back)];
      setImgs({ front, back, frontUrl: urls[0], backUrl: urls[1] });
    })();
    return () => {
      live = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key فيه الكارت والكلام كله
  }, [key]);

  function download(file: File, url: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
  }

  async function send() {
    if (!imgs) return;
    setBusy(true);
    try {
      const files = [imgs.front, imgs.back];
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, text: shareText });
        return;
      }
      // الكمبيوتر: الصورتين بيتنزلوا، وواتساب بيفتح بالرسالة عشان تحطهم معاها
      download(imgs.front, imgs.frontUrl);
      download(imgs.back, imgs.backUrl);
      window.open(waHref, "_blank", "noopener");
    } catch {
      // المشاركة اتلغت
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-label={flipped ? t("شوف وش الكارت") : t("شوف ضهر الكارت")}
        className="group mx-auto block w-full max-w-xl [perspective:2000px]"
      >
        <div
          className="relative aspect-[1.586] transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: flipped ? `rotateY(${dir === "rtl" ? -180 : 180}deg)` : undefined }}
        >
          {[
            { url: imgs?.frontUrl, alt: t("وش الكارت"), back: false },
            { url: imgs?.backUrl, alt: t("ضهر الكارت"), back: true },
          ].map((s) => (
            <div
              key={s.alt}
              className="absolute inset-0 overflow-hidden rounded-[1.4rem] shadow-[0_30px_50px_-30px_rgb(60_30_20/0.55)] [backface-visibility:hidden]"
              style={s.back ? { transform: "rotateY(180deg)" } : undefined}
            >
              {s.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- صورة اتعملت في المتصفح
                <img src={s.url} alt={s.alt} className="size-full object-cover" />
              ) : (
                <div className="size-full animate-pulse bg-surface" />
              )}
            </div>
          ))}
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-2 group-hover:text-brand">
          <Icon name="layers" className="size-4" />
          {flipped ? t("اضغط تشوف الوش") : t("اضغط تقلب الكارت")}
        </span>
      </button>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={send} disabled={!imgs || busy} className="btn bg-success text-white hover:opacity-90 disabled:opacity-60">
          {t("ابعت الكارت على واتساب")}
        </button>
        <button
          type="button"
          disabled={!imgs}
          onClick={() => imgs && (download(imgs.front, imgs.frontUrl), download(imgs.back, imgs.backUrl))}
          className="btn border border-ink/15 bg-bg text-ink hover:border-brand hover:text-brand"
        >
          {t("نزّل الصور")}
        </button>
      </div>
    </div>
  );
}
