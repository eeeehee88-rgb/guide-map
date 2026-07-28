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

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildFallbackGuide(body:any, places:any[]) {
  const area = text(body?.trip?.area,"여행지");
  const familyTips = [
    "지도 번호와 장소 목록을 맞춰 보며 이동해 주세요.",
    "운영시간과 휴무일은 방문 직전 Google 지도에서 다시 확인해 주세요.",
    "아이와 어르신이 함께라면 식사와 카페 휴식 시간을 먼저 확보해 주세요."
  ];
  const stops = places.slice(0,7).map((place:any,index:number)=>({
    id:String(place.id),
    time:index===0?"오전":index<4?"낮":"오후",
    reason:text(place.reason || place.description,`${area} 추천 장소입니다.`)
  }));
  return {
    title:`${area} 가족 여행 가이드북`,
    overview:`${area}에서 실제 지도 좌표가 있는 추천 장소를 번호 순서로 묶은 가족 여행 가이드입니다.`,
    placeDetails:places.map((place:any)=>({
      id:String(place.id),
      description:text(place.description || place.reason,`${text(place.name,"추천 장소")} 방문 전 운영정보를 확인해 주세요.`),
      items:Array.isArray(place.recommendedItems) && place.recommendedItems.length
        ? place.recommendedItems.slice(0,4)
        : [{name:text(place.recommendedMenu || place.category,"대표 항목"),price:text(place.price || place.googlePriceRange || place.googlePriceLevel,"방문 전 확인")}],
      visitInfo:{
        hours:text(place.hours,"방문 전 확인"),
        closed:"방문 전 확인",
        busyTime:"점심·오후 피크 시간 확인",
        bestTime:text(place.bestTime,"오전 또는 붐비기 전"),
        kids:text(place.familyTip,"아이 동반 시 이동거리와 대기시간 확인"),
        reservation:"필요 시 방문 전 확인",
        payment:"현금/카드 가능 여부 확인"
      }
    })),
    days:[{day:1,title:`${area} 핵심 동선`,stops,tips:familyTips}],
    familyTips,
    weatherBackup:["실내 카페, 쇼핑, 박물관형 장소를 우선 확인해 주세요."],
    localTips:["사진은 오전 빛이 부드러운 시간대가 좋습니다.","인기 맛집은 혼잡 시간 전후로 방문해 주세요."],
    checklist:["번호와 설명 일치 확인","운영시간 재확인","결제수단 확인","비오는 날 대체코스 확인"]
  };
}

function normalizeGuide(raw:any, fallback:any) {
  return {
    ...fallback,
    ...(raw && typeof raw === "object" ? raw : {}),
    title:text(raw?.title,fallback.title),
    overview:text(raw?.overview,fallback.overview),
    placeDetails:Array.isArray(raw?.placeDetails) && raw.placeDetails.length ? raw.placeDetails : fallback.placeDetails,
    days:Array.isArray(raw?.days) && raw.days.length ? raw.days : fallback.days,
    familyTips:Array.isArray(raw?.familyTips) && raw.familyTips.length ? raw.familyTips : fallback.familyTips,
    weatherBackup:Array.isArray(raw?.weatherBackup) && raw.weatherBackup.length ? raw.weatherBackup : fallback.weatherBackup,
    localTips:Array.isArray(raw?.localTips) && raw.localTips.length ? raw.localTips : fallback.localTips,
    checklist:Array.isArray(raw?.checklist) && raw.checklist.length ? raw.checklist : fallback.checklist
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const places = Array.isArray(body?.places) ? body.places.slice(0, 18) : [];
  if (!body?.trip || !places.length) {
    return Response.json({ error: "Trip and recommended places are required." }, { status: 400 });
  }
  const fallbackGuide = buildFallbackGuide(body, places);
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({ guide: fallbackGuide, fallback: true, reason: "missing_api_key" });

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

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(28_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3000,
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
      return Response.json({ guide: fallbackGuide, fallback: true, reason: `ai_status_${response.status}` });
    }

    const data = await response.json();
    const guide = normalizeGuide(parseModelJson(data.choices?.[0]?.message?.content || "{}"), fallbackGuide);
    await writeServerCache("ai-guide", cacheKey, guide, 60 * 60 * 24 * 14);
    return Response.json({ guide, cacheHit: false });
  } catch {
    return Response.json({ guide: fallbackGuide, fallback: true, reason: "ai_parse_or_timeout" });
  }
}
