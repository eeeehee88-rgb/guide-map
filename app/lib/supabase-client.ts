"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type SupabaseBrowserConfig = {
  url?: string;
  publishableKey?: string;
};

export function hasSupabaseConfig(config?: SupabaseBrowserConfig) {
  return Boolean((config?.url || supabaseUrl) && (config?.publishableKey || supabaseKey));
}

export function createBrowserSupabase(config?: SupabaseBrowserConfig) {
  const url = config?.url || supabaseUrl;
  const key = config?.publishableKey || supabaseKey;
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
