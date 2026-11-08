"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";

const MAX = 5;
const SIDE = 1600;

type Item = { kind: "url"; url: string } | { kind: "file"; file: File; preview: string };

/** بيصغّر الصورة في المتصفح (أطول ضلع 1600 بكسل، WebP) عشان الرفع يبقى خفيف ومايعدّيش حد السيرفر */
async function shrink(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.85));
  if (!blob) throw new Error("shrink failed");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "img"}.webp`, { type: "image/webp" });
}

/**
 * صور المنتج: لحد 5، بتترفع مع بعض وتتشال وتترتب، والأولى هي الأساسية (اللي بتظهر في الكروت).
 * بيبعت «imagesOrder» (الترتيب) و«imageFiles» (الصور الجديدة) مع الفورم.
 */
export function ProductImagesField({ current, label = "ارفعي صور" }: { current: string[]; label?: string }) {
  const [items, setItems] = useState<Item[]>(() => current.slice(0, MAX).map((url) => ({ kind: "url", url })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const filesInput = useRef<HTMLInputElement>(null);

  const files = items.filter((x): x is Extract<Item, { kind: "file" }> => x.kind === "file");
  const order = items.map((x) => (x.kind === "url" ? x.url : `file:${files.indexOf(x)}`));

  // الصور الجديدة بتتحط في input مخفي بنفس ترتيبها، عشان تتبعت مع الفورم
  useEffect(() => {
    if (!filesInput.current) return;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f.file);
    filesInput.current.files = dt.files;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- files جاية من items
  }, [items]);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setBusy(true);
    const room = MAX - items.length;
    const picked = [...list].slice(0, room);
    const added: Item[] = [];
    for (const f of picked) {
      try {
        const small = await shrink(f);
        added.push({ kind: "file", file: small, preview: URL.createObjectURL(small) });
      } catch {
        setError(`الصورة «${f.name}» مش مدعومة. جربي JPG أو PNG.`);
      }
    }
    if (list.length > room) setError(`أقصى حاجة ${MAX} صور للمنتج.`);
    setItems((x) => [...x, ...added]);
    setBusy(false);
  }

  const remove = (i: number) => setItems((x) => x.filter((_, j) => j !== i));
  const makeMain = (i: number) => setItems((x) => [x[i], ...x.filter((_, j) => j !== i)]);

  return (
    <div className="space-y-4">
      <input type="hidden" name="imagesOrder" value={JSON.stringify(order)} />
      <input ref={filesInput} type="file" name="imageFiles" multiple hidden tabIndex={-1} aria-hidden />

      {items.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {items.map((it, i) => (
            <li key={it.kind === "url" ? it.url : it.preview} className={`relative overflow-hidden rounded-xl bg-surface ${i === 0 ? "ring-2 ring-brand ring-offset-2 ring-offset-[#fffdf8]" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- معاينة قبل الحفظ */}
              <img src={it.kind === "url" ? it.url : it.preview} alt="" className="aspect-square w-full object-cover" />
              {i === 0 ? (
                <span className="absolute start-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">الأساسية</span>
              ) : (
                <button type="button" onClick={() => makeMain(i)} className="absolute start-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink hover:bg-brand hover:text-white">
                  خليها الأساسية
                </button>
              )}
              <button type="button" onClick={() => remove(i)} aria-label="شيل الصورة" className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-ink hover:bg-brand hover:text-white">
                <Icon name="close" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-surface p-4 text-center text-sm text-muted">لسه مفيش صور.</p>
      )}

      {items.length < MAX && (
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="imagesPick">{label} (لحد {MAX})</label>
            <input
              id="imagesPick"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
              className="block w-full text-sm file:me-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-white"
            />
          </div>
          <div className="flex gap-2">
            <input value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" placeholder="أو لينك صورة https://..." aria-label="لينك صورة" className="field" />
            <button
              type="button"
              onClick={() => {
                const u = link.trim();
                if (!/^https:\/\//.test(u)) return setError("لينك الصورة لازم يبدأ بـ https://");
                setItems((x) => [...x, { kind: "url", url: u }]);
                setLink("");
                setError(null);
              }}
              className="btn-outline btn-sm shrink-0"
            >
              ضيفي
            </button>
          </div>
        </div>
      )}
      {busy && <p className="text-sm text-muted">بنجهّز الصور…</p>}
      {error && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{error}</p>}
      <p className="text-xs leading-5 text-muted">الصورة الأولى هي اللي بتظهر في الموقع على كارت المنتج. الصور بتتصغّر لوحدها قبل الرفع.</p>
    </div>
  );
}
