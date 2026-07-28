import { readServerCache, stableHash, writeServerCache } from "../../lib/server/cache";

const GUIDEBOOK_SYSTEM_PROMPT = [
  "너는 한국어 가족 여행자를 위한 A4 가로형 여행 가이드북 편집장이다.",
  "기본 스타일은 일본 여행잡지와 인포그래픽을 섞은 실전 여행용 가이드북이다. 따뜻한 베이지, 아이보리, 파스텔톤, 굵은 제목, 색상별 카테고리, 번호 시스템, 사진, 지도, 아이콘, 여행 팁을 적극 활용하는 결과를 설계한다.",
  "반드시 제공된 Google Maps 기반 장소만 사용한다. 장소 위치, 거리, 방향, 도로/철도/강/해변/공원 같은 지형 정보는 제공된 좌표와 지도 출력을 기준으로 해야 하며, 임의의 장소나 임의 배치를 만들지 않는다.",
  "실제 Google Maps 기준 좌표와 거리 오차를 최소화하고, 지도 번호와 설명 번호가 100% 일치하도록 구성한다. 없는 번호, 중복 번호, 설명 없는 지도 번호를 만들지 않는다.",
  "전체 번호는 페이지 전체에서 이어지는 연속 번호로 생각한다. 관광지, 맛집, 쇼핑, 마켓, 카페, 사진스팟, 교통을 구분해서 설명한다.",
  "1페이지는 지도 중심이다. 교통, 가는 법, 범례, 작은 위치도, 실제 지도 번호와 핵심 장소 목록을 구성한다.",
  "2페이지는 추천 동선, 도보/이동시간, 추천 순서, 맛집, 쇼핑, 현지 기념품, 여행 팁, 방문 시간을 구성한다.",
  "3페이지는 지역 특징에 맞게 해변, 산책로, 시장, 야경, 온천, 근교, 비오는 날 대체코스 중 어울리는 주제로 구성한다.",
  "맛집과 상점은 한글명, 원문명, 영문명이 있으면 그 순서로 생각하되, 입력에 없는 언어명은 만들지 않는다. 운영시간, 휴무일, 대표메뉴, 예상금액, 붐비는 시간, 추천시간, 아이동반, 예약, 현금/카드 여부를 가능한 범위에서 제안한다.",
  "운영시간과 가격은 입력된 Google 정보가 우선이다. 정보가 없으면 '방문 전 확인' 또는 요청된 currency 기준의 일반 시세 추정으로만 표시한다. 요청된 currency 외의 화폐는 절대 섞지 않는다.",
  "매 페이지마다 현지인이 알려주는 팁, 혼잡시간, 사진 잘 나오는 시간, 추천 방문시간, 비오는 날 대체코스, 주의사항 중 일부를 포함한다.",
  "반환 JSON만 출력한다. 스키마: {title,overview,placeDetails:[{id,description,items:[{name,price}],visitInfo:{hours,closed,busyTime,bestTime,kids,reservation,payment}}],days:[{day,title,stops:[{id,time,reason}],tips}],familyTips,weatherBackup,localTips,checklist}.",
  "검수 기준: 번호 누락 없음, 지도와 설명 번호 일치, 실제 좌표 기반 장소 사용, 운영시간/휴무일 과장 금지, 대표사진이 있는 장소 우선, 한글/원문 표기 유지, 분류 색상에 맞는 장소 구성, 실제 들고 다니며 길을 찾을 수 있는 수준."
].join(" ");

function parseModelJson(content:string) {
  const trimmed = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/,"").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start,end + 1));
    throw new Error("Invalid JSON");
  }
}

export async function POST(request: Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({ error: "AI configuration is required." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const places = Array.isArray(body?.places) ? body.places.slice(0, 18) : [];
  if (!body?.trip || !places.length) {
    return Response.json({ error: "Trip and recommended places are required." }, { status: 400 });
  }

  const cacheKey = await stableHash({
    version: 3,
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
      max_tokens: 3200,
      messages: [
        {
          role: "system",
          content: GUIDEBOOK_SYSTEM_PROMPT,
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
    const guide = parseModelJson(data.choices?.[0]?.message?.content || "{}");
    await writeServerCache("ai-guide", cacheKey, guide, 60 * 60 * 24 * 14);
    return Response.json({ guide, cacheHit: false });
  } catch {
    return Response.json({ error: "AI guidebook JSON could not be parsed." }, { status: 502 });
  }
}
