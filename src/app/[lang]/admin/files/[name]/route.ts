import { isAdmin } from "@/lib/admin-auth";
import { repo } from "@/lib/db";

/** صور إثبات التحويل خاصة: صاحبة المتجر بس اللي تشوفها (NFR-05) */
export async function GET(_req: Request, ctx: RouteContext<"/[lang]/admin/files/[name]">) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { name } = await ctx.params;
  const data = await repo().readFile(name);
  if (!data) return new Response("Not found", { status: 404 });
  const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return new Response(new Uint8Array(data), { headers: { "content-type": type, "cache-control": "private, no-store" } });
}
