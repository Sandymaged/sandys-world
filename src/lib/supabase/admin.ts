import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** عميل بصلاحيات كاملة (service role) — للسيرفر بس، عمره ما يوصل للمتصفح. */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service key is missing");
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}
