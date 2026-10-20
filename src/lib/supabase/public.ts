import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** عميل للقراءة العامة (الكتالوج). مش بيستخدم كوكيز، فينفع جوه "use cache". */
export function publicClient(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase env vars are missing");
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}
