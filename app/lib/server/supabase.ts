import { createClient } from "@supabase/supabase-js";

export type SupabaseUser = {
  id: string;
  email?: string;
};

function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return { url, key };
}

function getServiceSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function createUserSupabase(accessToken: string) {
  const { url, key } = getPublicSupabaseEnv();
  if (!url || !key) {
    throw new Error("Supabase public environment values are missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function createServiceSupabase() {
  const { url, key } = getServiceSupabaseEnv();
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireSupabaseUser(request: Request): Promise<{
  token: string;
  user: SupabaseUser;
}> {
  const token = readBearerToken(request);
  if (!token) {
    throw new Response(JSON.stringify({ error: "Login is required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createUserSupabase(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: "The session could not be verified." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    token,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  };
}
