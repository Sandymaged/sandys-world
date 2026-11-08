"use client";

import { useState } from "react";
import { GiftArt } from "./gift-art";
import { Polaroid } from "./scrapbook";

/** صور المنتج: الصورة الكبيرة في البولارويد، وتحتها الصور الصغيرة (لو أكتر من واحدة) والضغط على أي واحدة بيكبّرها */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const current = images[i] ?? images[0];
  return (
    <div>
      <Polaroid rotate={2.5} tape="lilac" className="mx-auto max-w-md" caption={name}>
        <GiftArt image={current} label={name} className="aspect-square" sizes="(max-width: 768px) 100vw, 50vw" priority />
      </Polaroid>
      {images.length > 1 && (
        <ul className="mx-auto mt-6 flex max-w-md justify-center gap-2.5">
          {images.map((src, j) => (
            <li key={src} className="w-1/5 max-w-20">
              <button
                type="button"
                onClick={() => setI(j)}
                aria-label={`${name} ${j + 1}`}
                aria-pressed={j === i}
                className={`block w-full overflow-hidden rounded-xl transition ${j === i ? "ring-2 ring-brand ring-offset-2 ring-offset-bg" : "opacity-70 hover:opacity-100"}`}
              >
                <GiftArt image={src} label={name} className="aspect-square" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
