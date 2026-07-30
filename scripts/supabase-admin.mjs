import { createClient } from "@supabase/supabase-js";

export function createAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function pendingGuidebookJobs(rows) {
  return rows
    .map((row) => ({
      userId: row.user_id,
      trip: row.trip || {},
      job: row.trip?.guidebookJob || null,
      updatedAt: row.updated_at,
    }))
    .filter((item) => item.job?.status === "pending" && item.job?.id);
}
