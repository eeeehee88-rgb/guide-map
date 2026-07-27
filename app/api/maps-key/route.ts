export async function GET() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Response.json({ error: "Google Maps key is not configured" }, { status: 503 });
  }
  return Response.json({ key }, { headers: { "Cache-Control": "private, max-age=300" } });
}
