import { readMedia } from "@/lib/db/catalog-store";

/** صور المنتجات اللي اتعرضت من لوحة التحكم (عامة، أي حد يقدر يشوفها) */
export async function GET(_req: Request, ctx: RouteContext<"/[lang]/media/[name]">) {
  const { name } = await ctx.params;
  const data = await readMedia(name);
  if (!data) return new Response("Not found", { status: 404 });
  const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return new Response(new Uint8Array(data), { headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" } });
}
