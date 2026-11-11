/** بيصغّر الصورة في المتصفح (أطول ضلع side بكسل، WebP) عشان الرفع يبقى خفيف ومايعدّيش حد السيرفر */
export async function shrinkImage(file: File, side = 1600): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, side / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.88));
  if (!blob) throw new Error("shrink failed");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "img"}.webp`, { type: "image/webp" });
}
