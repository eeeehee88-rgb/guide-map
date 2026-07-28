import { readServerCache, stableHash, writeServerCache } from "../../lib/server/cache";

function fallbackRecommendation(body: any, candidates: any[], reason = "fallback") {
  return {
    overview: "AI 추천 응답이 지연되어 Google 장소 후보를 먼저 정리했어요. 사진과 상세 정보는 이어서 보강합니다.",
    localizations: candidates.map((item: any) => ({ id: item.id, koreanName: item.name })),
    recommendations: candidates.map((item: any, index: number) => ({
      id: item.id,
      reason: `${body?.trip?.area || "여행지"}에서 평점과 접근성을 기준으로 먼저 볼 만한 장소입니다.`,
      famousItems: item.recommendedMenu ? [item.recommendedMenu] : [],
      recommendedItems: item.recommendedMenu
        ? [{ name: item.recommendedMenu, price: item.googlePriceRange || item.googlePriceLevel || "가격 확인" }]
        : [],
      priceGuide: item.googlePriceRange || item.googlePriceLevel || "현장 가격 확인",
      evidence: item.rating ? `Google 평점 ${item.rating}${item.reviewCount ? `, 리뷰 ${item.reviewCount}` : ""}` : "Google 장소 후보",
      familyTip: "가족 구성원의 이동 거리와 운영시간을 확인하고 방문해 주세요.",
      visitTip: "방문 전 영업시간과 혼잡도를 확인해 주세요.",
      parkingTip: "주차장은 Google 지도에서 주변 주차장을 함께 확인해 주세요.",
      bestTime: "오전 또는 혼잡 시간 전",
      priority: index + 1,
    })),
    fallbackReason: reason,
  };
}

function parseModelJson(content: string) {
  const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("No JSON object found");
  }
}

export async function POST(request: Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({ error: "AI configuration is required." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0, 8) : [];
  if (!body?.trip || !candidates.length) {
    return Response.json({ error: "Trip and candidate places are required." }, { status: 400 });
  }

  const cacheKey = await stableHash({
    version: 5,
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

  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content:
              "You are a Korean family travel editor. Use only the provided candidate places and keep each recommendation id exactly as provided. Return valid compact JSON only: {overview,localizations:[{id,koreanName}],recommendations:[{id,reason,famousItems,recommendedItems:[{name,price}],priceGuide,evidence,familyTip,visitTip,parkingTip,bestTime,priority}]}. Do not create an itinerary or guidebook. Keep copy concrete, family-friendly, and avoid inventing unsupported prices.",
          },
          { role: "user", content: JSON.stringify({ currentTimeKST: koreaTime, trip: body.trip, candidates }) },
        ],
      }),
    });
  } catch {
    return Response.json({ result: fallbackRecommendation(body, candidates, "timeout"), cacheHit: false, fallback: true });
  }

  if (!response.ok) {
    return Response.json({ result: fallbackRecommendation(body, candidates, `upstream-${response.status}`), cacheHit: false, fallback: true });
  }

  const data = await response.json();
  try {
    const result = parseModelJson(data.choices?.[0]?.message?.content || "{}");
    if (!Array.isArray(result?.recommendations) || !result.recommendations.length) {
      throw new Error("Empty recommendations");
    }
    await writeServerCache("ai-recommend", cacheKey, result, 60 * 60 * 24 * 7);
    return Response.json({ result, cacheHit: false });
  } catch {
    return Response.json({ result: fallbackRecommendation(body, candidates, "parse-error"), cacheHit: false, fallback: true });
  }
}
