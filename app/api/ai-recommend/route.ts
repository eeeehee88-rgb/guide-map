import { readServerCache, stableHash, writeServerCache } from "../../lib/server/cache";

export async function POST(request: Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({ error: "AI configuration is required." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0, 18) : [];
  if (!body?.trip || !candidates.length) {
    return Response.json({ error: "Trip and candidate places are required." }, { status: 400 });
  }

  const cacheKey = await stableHash({
    version: 2,
    trip: body.trip,
    candidates: candidates.map((item: any) => [
      item.id,
      item.name,
      item.category,
      item.rating,
      item.reviewCount,
      item.recommendedMenu,
    ]),
  });
  const cached = await readServerCache("ai-recommend", cacheKey);
  if (cached) return Response.json({ result: cached, cacheHit: true });

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
      max_tokens: 2200,
      messages: [
        {
          role: "system",
          content:
            "You are a Korean family travel editor. Use only the provided candidate places. Return JSON only: {overview, localizations:[{id,koreanName}], recommendations:[{id,reason,famousItems,recommendedItems:[{name,price}],priceGuide,evidence,familyTip,visitTip,parkingTip,bestTime,priority}], guide:{title,overview,days:[{day,title,stops:[{id,time,reason}],tips}],familyTips,weatherBackup}}. Keep copy concrete, family-friendly, and avoid inventing unsupported prices.",
        },
        { role: "user", content: JSON.stringify({ currentTimeKST: koreaTime, trip: body.trip, candidates }) },
      ],
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "AI recommendations could not be generated." }, { status: response.status });
  }

  const data = await response.json();
  try {
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    await writeServerCache("ai-recommend", cacheKey, result, 60 * 60 * 24 * 7);
    return Response.json({ result, cacheHit: false });
  } catch {
    return Response.json({ error: "AI recommendation JSON could not be parsed." }, { status: 502 });
  }
}
