import { readServerCache, stableHash, writeServerCache } from "../../lib/server/cache";

export async function POST(request: Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({ error: "AI configuration is required." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const places = Array.isArray(body?.places) ? body.places.slice(0, 12) : [];
  if (!body?.trip || !places.length) {
    return Response.json({ error: "Trip and recommended places are required." }, { status: 400 });
  }

  const cacheKey = await stableHash({
    version: 2,
    trip: body.trip,
    hotel: body.hotel,
    places: places.map((item: any) => [
      item.id,
      item.name,
      item.category,
      item.aiRecommendedItems,
      item.recommendedMenu,
    ]),
  });
  const cached = await readServerCache("ai-guide", cacheKey);
  if (cached) return Response.json({ guide: cached, cacheHit: true });

  const koreaTime = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(18_000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        {
          role: "system",
          content:
            "You create practical Korean family travel guidebooks. Use only provided places. Return JSON only: {title,overview,placeDetails:[{id,description,items:[{name,price}]}],days:[{day,title,stops:[{id,time,reason}],tips}],familyTips,weatherBackup}. Build a slow-paced itinerary for elders and children. Use the requested currency only and do not invent unsupported prices.",
        },
        { role: "user", content: JSON.stringify({ currentTimeKST: koreaTime, trip: body.trip, hotel: body.hotel, places }) },
      ],
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "AI guidebook could not be generated." }, { status: response.status });
  }

  const data = await response.json();
  try {
    const guide = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    await writeServerCache("ai-guide", cacheKey, guide, 60 * 60 * 24 * 14);
    return Response.json({ guide, cacheHit: false });
  } catch {
    return Response.json({ error: "AI guidebook JSON could not be parsed." }, { status: 502 });
  }
}
