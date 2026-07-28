import { createServiceSupabase } from "./supabase";

const memoryCache = new Map<string, unknown>();

export async function stableHash(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function readServerCache<T>(kind: string, cacheKey: string) {
  const memoryKey = `${kind}:${cacheKey}`;
  const supabase = createServiceSupabase();

  if (supabase) {
    const { data } = await supabase
      .from("server_cache")
      .select("payload, expires_at")
      .eq("kind", kind)
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (data && new Date(data.expires_at).getTime() > Date.now()) {
      return data.payload as T;
    }
  }

  return memoryCache.get(memoryKey) as T | undefined;
}

export async function writeServerCache(kind: string, cacheKey: string, payload: unknown, ttlSeconds: number) {
  const memoryKey = `${kind}:${cacheKey}`;
  memoryCache.set(memoryKey, payload);

  const supabase = createServiceSupabase();
  if (!supabase) {
    return;
  }

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await supabase
    .from("server_cache")
    .upsert(
      {
        kind,
        cache_key: cacheKey,
        payload,
        expires_at: expiresAt,
      },
      { onConflict: "kind,cache_key" },
    );
}
