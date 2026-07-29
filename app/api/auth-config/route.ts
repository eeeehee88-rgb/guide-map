export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  return Response.json(
    {
      hasConfig: Boolean(url && publishableKey),
      url,
      publishableKey,
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
