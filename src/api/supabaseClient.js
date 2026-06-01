import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://mnwimnwdilerkktizzqn.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "sb_publishable_Gj1aGVMKebdtAynKmtbxkA_CxH4NJvi";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseConfigStatus() {
  return {
    hasUrl: Boolean(SUPABASE_URL),
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
    ready: hasSupabaseConfig()
  };
}

export const supabaseClient = hasSupabaseConfig()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
