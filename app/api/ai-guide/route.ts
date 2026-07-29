import { readServerCache, stableHash, writeServerCache } from "../../lib/server/cache";

type GuidePlace = {
  id: string;
  mapNumber: number;
  category: string;
  markerColor: string;
  nameKo: string;
  nameLocal: string;
  nameEn: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  hours?: string;
  price?: string;
  photoUrl?: string;
  googleMapsUrl?: string;
  description?: string;
  signatureItems?: { name: string; price: string }[];
};

const CATEGORY_SPECS = [
  { category: "관광지", color: "#ef8a2f", query: "대표 관광지 명소 성 신사 박물관 공원 사진스팟", limit: 6 },
  { category: "맛집", color: "#df4f42", query: "현지 대표 맛집 식당 향토 음식 인기 음식점", limit: 5 },
  { category: "쇼핑", color: "#2f9b68", query: "기념품 쇼핑 전통공예 지역 한정 상품 상점", limit: 4 },
  { category: "마켓", color: "#2781bd", query: "시장 마켓 상점가 로컬 마트", limit: 3 },
  { category: "카페", color: "#8c66c3", query: "카페 디저트 베이커리 분위기 좋은 카페", limit: 4 },
  { category: "사진스팟", color: "#d9a72f", query: "전망대 산책로 해변 공원 사진 명소", limit: 3 },
  { category: "교통", color: "#222222", query: "역 버스터미널 공항 교통 거점", limit: 2 },
];

const GUIDEBOOK_SYSTEM_PROMPT = `
너는 Guide-trip의 기존 추천 기능과 완전히 별개로 동작하는 여행 가이드북 제작 엔진이다.
사용자가 저장한 추천 리스트, 기존 앱의 장소 목록, 추천 이유를 절대 참고하지 않는다.
title과 subtitle에는 "상업용" 같은 내부 표현을 넣지 않는다. 여행자가 보는 실제 표지 문구만 쓴다.
오직 입력된 여행 지역과 서버가 Google Maps 기준으로 수집한 좌표/장소/운영정보만 사용한다.

여행 가이드북 제작 프롬프트 (최종 버전)

기본 스타일
A4 가로(297x210mm) 여행 가이드북을 제작한다.
전체 디자인은 일본 여행잡지 + 인포그래픽 스타일이며, 실제로 여행 중 들고 다니며 사용할 수 있는 수준의 정보와 지도를 제작한다.
색감은 따뜻한 베이지, 아이보리, 파스텔톤을 사용하고, 옛 여행책 느낌과 현대적인 인포그래픽을 적절히 섞는다.
전체 페이지는 보기 쉬운 굵은 제목, 색상별 카테고리, 번호 시스템, 사진, 일러스트, 지도, 아이콘을 적극 활용한다.

지도 제작 규칙(가장 중요)
절대 AI가 임의로 배치하지 않는다.
Google Maps 실제 지도를 기준으로 도로, 골목, 건물 위치, 철도, 역, 강, 해변, 공원, 관광지를 실제 거리 비율에 맞게 제작한다.
거리감은 실제 Google Maps 기준으로 최대한 동일하게 표현한다.
위치가 바뀌거나 관광지가 다른 골목으로 이동하면 안 된다.
반드시 Google Maps -> 실제 위치 확인 -> 거리 확인 -> 방향 확인 -> 지도 제작 순으로 진행한다.
실제 Google Maps 기준 좌표와 거리 오차는 +/-5% 이내 유지를 목표로 한다.

지도 스타일
실제 지도를 그대로 복사하는 것이 아니라 손그림 일러스트 느낌으로 제작한다.
건물은 입체 일러스트 또는 미니어처 느낌으로 표현한다.
골목은 실제 골목처럼 촘촘하게 표현한다.
지도는 귀엽고 아기자기한 느낌을 살린다.

지도 위 표현
관광지, 맛집, 쇼핑, 시장, 마트, 카페, 해변, 사진스팟 등을 번호(1~)로 표기한다.
번호는 페이지 전체에서 이어진다.
색상 구분: 주황 관광지, 빨강 맛집, 초록 쇼핑, 파랑 마켓, 보라 카페, 노랑 사진스팟, 검정 교통.
지도 번호와 오른쪽 설명 번호가 100% 일치해야 한다.
없는 번호, 중복 번호, 설명 없는 지도 번호를 만들지 않는다.

페이지 구성
1페이지: 지도 중심. 전체의 약 70%. 좌측에는 교통, 가는 법, 범례, 작은 위치도. 우측에는 실제 지도, 사진, 건물, 번호, 관광지.
2페이지: 추천 동선, 도보시간, 추천 순서, 맛집, 쇼핑, 현지 기념품, 여행 팁, 방문 시간.
3페이지: 지역 특징에 맞게 해변, 산책로, 시장, 야경, 온천 등 맞춤 구성.

맛집 정보
각 상점은 대표 음식 사진을 반드시 넣는 전제로 설명한다.
이름은 한글 -> 현지어 -> 영문 순서로 표기한다.
운영시간, 휴무일, 대표메뉴, 예상금액, 붐비는 시간, 추천시간, 아이동반 여부, 예약 여부, 현금/카드 여부를 포함한다.
운영시간은 Google 정보를 우선으로 하고, 정보가 없으면 방문 전 확인이라고 쓴다.

쇼핑 리스트
지역에서만 살 수 있는 지역 한정, 기념품, 과자, 전통공예, 술, 차, 식기, 도자기, 생활용품을 우선 소개하고 평균가격을 넣는다.

사진
사진은 실제 대표 사진을 사용한다. 음식은 대표 메뉴, 건물은 대표 외관, 카페는 대표 좌석, 해변은 대표 전망을 사용한다.

여행팁
매 페이지마다 현지인이 알려주는 팁, 혼잡시간, 사진 잘 나오는 시간, 추천 방문시간, 비오는 날 대체코스, 주의사항 중 일부를 넣는다.

검수 규칙
제작 완료 후 스스로 검수한다.
번호가 전부 있는가, 번호 위치가 맞는가, 실제 Google Maps와 위치가 동일한가, 거리감이 맞는가, 운영시간과 휴무일이 맞는가,
사진이 대표사진인가, 지도와 설명 번호가 일치하는가, A4 가로 비율인가, 오탈자가 없는가, 한글/현지어 표기가 맞는가,
분류 색상이 맞는가, 여행자가 실제 들고 다니며 길을 찾을 수 있는 수준인가를 확인한다.

반환은 JSON만 한다.
스키마:
{
  "title": string,
  "subtitle": string,
  "overview": string,
  "locationInset": string,
  "mapBrief": string,
  "places": [{
    "id": string,
    "mapNumber": number,
    "category": string,
    "markerColor": string,
    "nameKo": string,
    "nameLocal": string,
    "nameEn": string,
    "address": string,
    "lat": number,
    "lng": number,
    "description": string,
    "hours": string,
    "closed": string,
    "signatureItems": [{"name": string, "price": string}],
    "busyTime": string,
    "bestTime": string,
    "kids": string,
    "reservation": string,
    "payment": string,
    "tip": string
  }],
  "days": [{"day": number, "title": string, "stops": [{"id": string, "time": string, "move": string, "reason": string}], "tips": string[]}],
  "foodGuide": [{"id": string, "why": string, "menu": string, "price": string, "photoDirection": string}],
  "shoppingGuide": [{"id": string, "item": string, "price": string, "whyLocal": string}],
  "themePage": {"title": string, "sections": [{"title": string, "body": string, "places": string[]}]},
  "familyTips": string[],
  "weatherBackup": string[],
  "localTips": string[],
  "checklist": string[],
  "selfReview": string[]
}
`;

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function parseModelJson(content: string) {
  const trimmed = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Invalid JSON");
  }
}

function formatMoney(value: any, fallbackCurrency: string) {
  if (!value) return "";
  const currency = text(value.currencyCode, fallbackCurrency);
  const units = Number(value.units ?? 0);
  const nanos = Number(value.nanos ?? 0);
  const amount = units + nanos / 1_000_000_000;
  if (!amount) return "";
  const prefix = currency === "JPY" ? "JPY" : currency === "KRW" ? "KRW" : currency;
  return `${prefix} ${Math.round(amount).toLocaleString("ko-KR")}`;
}

function priceRange(place: any, currency: string) {
  const start = formatMoney(place.priceRange?.startPrice, currency);
  const end = formatMoney(place.priceRange?.endPrice, currency);
  if (start && end) return `${start} ~ ${end}`;
  if (start) return `${start} 이상`;
  const level = text(place.priceLevel);
  const labels: Record<string, string> = {
    PRICE_LEVEL_FREE: "무료",
    PRICE_LEVEL_INEXPENSIVE: "저렴한 편",
    PRICE_LEVEL_MODERATE: "보통 가격대",
    PRICE_LEVEL_EXPENSIVE: "가격대 높음",
    PRICE_LEVEL_VERY_EXPENSIVE: "고가",
  };
  return labels[level] || "";
}

function photoUrl(place: any, key: string) {
  const name = place.photos?.[0]?.name;
  return name ? `https://places.googleapis.com/v1/${name}/media?maxWidthPx=900&maxHeightPx=620&key=${encodeURIComponent(key)}` : "";
}

function pointDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function geocodeArea(area: string, country: string, key: string) {
  const hint = country === "KR" ? "대한민국" : "일본";
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", `${area} ${hint}`);
  url.searchParams.set("language", "ko");
  url.searchParams.set("region", country.toLowerCase());
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("지역 위치 확인에 실패했습니다.");
  const data = await response.json();
  const result = data.results?.[0];
  if (!result?.geometry?.location) throw new Error("가이드북을 만들 지역을 찾지 못했습니다.");
  return {
    lat: Number(result.geometry.location.lat),
    lng: Number(result.geometry.location.lng),
    formattedAddress: text(result.formatted_address, area),
  };
}

async function searchGooglePlaces(area: string, center: { lat: number; lng: number }, country: string, key: string) {
  const currency = country === "KR" ? "KRW" : "JPY";
  const batches = await Promise.allSettled(CATEGORY_SPECS.map(async (spec) => {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.googleMapsUri",
          "places.primaryTypeDisplayName",
          "places.rating",
          "places.userRatingCount",
          "places.businessStatus",
          "places.photos",
          "places.priceLevel",
          "places.priceRange",
          "places.regularOpeningHours",
          "places.websiteUri",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: `${area} ${spec.query}`,
        languageCode: "ko",
        regionCode: country,
        maxResultCount: Math.min(10, Math.max(spec.limit, 6)),
        locationBias: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: 30000 } },
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return asArray<any>(data.places)
      .filter((place) => place.location?.latitude && place.location?.longitude)
      .filter((place) => pointDistanceKm(center, { lat: Number(place.location.latitude), lng: Number(place.location.longitude) }) <= 35)
      .slice(0, spec.limit)
      .map((place) => ({ place, spec }));
  }));

  const seen = new Set<string>();
  const places: GuidePlace[] = [];
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const item of batch.value) {
      const place = item.place;
      if (!place.id || seen.has(place.id)) continue;
      seen.add(place.id);
      const name = text(place.displayName?.text, `${area} ${item.spec.category}`);
      const hours = asArray<string>(place.regularOpeningHours?.weekdayDescriptions)[0] || "";
      places.push({
        id: place.id,
        mapNumber: places.length + 1,
        category: item.spec.category,
        markerColor: item.spec.color,
        nameKo: name,
        nameLocal: name,
        nameEn: "",
        address: text(place.formattedAddress, ""),
        lat: Number(place.location.latitude),
        lng: Number(place.location.longitude),
        rating: typeof place.rating === "number" ? place.rating : undefined,
        reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : undefined,
        hours,
        price: priceRange(place, currency),
        photoUrl: photoUrl(place, key),
        googleMapsUrl: text(place.googleMapsUri, ""),
        description: `${item.spec.category} 후보입니다. Google Maps 위치 기준으로 가이드북에 배치합니다.`,
        signatureItems: [],
      });
    }
  }
  return places.slice(0, 24).map((place, index) => ({ ...place, mapNumber: index + 1 }));
}

function buildFallbackGuide(body: any, areaCenter: { lat: number; lng: number; formattedAddress: string }, places: GuidePlace[]) {
  const area = text(body?.trip?.area, "여행지");
  const sourcePlaces = places.length ? places : [{
    id: "area-center",
    mapNumber: 1,
    category: "교통",
    markerColor: "#222222",
    nameKo: `${area} 중심`,
    nameLocal: `${area} 중심`,
    nameEn: "",
    address: areaCenter.formattedAddress,
    lat: areaCenter.lat,
    lng: areaCenter.lng,
  } as GuidePlace];
  const stops = sourcePlaces.slice(0, 8).map((place, index) => ({
    id: place.id,
    time: index === 0 ? "09:30" : `${10 + index}:30`,
    move: index === 0 ? "출발" : "도보 또는 대중교통 이동",
    reason: `${place.mapNumber}번 ${place.nameKo} 방문`,
  }));
  return {
    title: `${area} 여행 가이드북`,
    subtitle: "Google Maps 실제 좌표 기반 A4 가로 여행잡지",
    overview: `${area}의 실제 Google Maps 장소와 좌표를 기준으로 번호, 동선, 맛집, 쇼핑 정보를 구성했습니다.`,
    locationInset: `${areaCenter.formattedAddress} 기준`,
    mapBrief: "지도 번호와 설명 번호가 일치하도록 Google Maps 좌표 기준으로 배치합니다.",
    places: sourcePlaces,
    days: [{ day: 1, title: `${area} 핵심 동선`, stops, tips: ["운영시간은 방문 직전 Google 지도에서 재확인하세요.", "사진은 오전 또는 해질녘이 부드럽습니다."] }],
    foodGuide: sourcePlaces.filter((place) => ["맛집", "카페"].includes(place.category)).slice(0, 6).map((place) => ({
      id: place.id,
      why: "지역 평점과 접근성을 기준으로 고른 식사 후보입니다.",
      menu: place.signatureItems?.[0]?.name || "대표 메뉴 현장 확인",
      price: place.price || "가격 현장 확인",
      photoDirection: "대표 메뉴 또는 외관 사진",
    })),
    shoppingGuide: sourcePlaces.filter((place) => ["쇼핑", "마켓"].includes(place.category)).slice(0, 6).map((place) => ({
      id: place.id,
      item: "지역 한정 기념품",
      price: place.price || "평균가격 현장 확인",
      whyLocal: "해당 지역 방문 기념으로 사기 좋은 품목입니다.",
    })),
    themePage: {
      title: `${area} 지역 특징`,
      sections: [
        { title: "산책과 사진", body: "실제 거리와 이동 방향을 기준으로 무리 없는 산책 흐름을 구성합니다.", places: sourcePlaces.slice(0, 4).map((place) => place.id) },
        { title: "비 오는 날 대체", body: "실내 식당, 카페, 쇼핑 지점을 우선으로 재배치합니다.", places: sourcePlaces.filter((place) => ["맛집", "카페", "쇼핑"].includes(place.category)).slice(0, 4).map((place) => place.id) },
      ],
    },
    familyTips: ["아이 동반 시 이동거리와 대기시간을 먼저 확인하세요.", "식사는 혼잡 시간보다 30분 빠르게 움직이면 편합니다.", "현금만 가능한 소규모 상점이 있을 수 있습니다."],
    weatherBackup: ["비가 오면 실내 카페, 쇼핑, 박물관형 장소를 우선 방문하세요."],
    localTips: ["오전에는 사진이 깔끔하고 대기 줄이 짧은 편입니다.", "지역 한정 상품은 역 주변보다 로컬 상점가에서 먼저 확인하세요."],
    checklist: ["번호와 설명 일치", "운영시간 재확인", "결제수단 확인", "비 오는 날 대체코스 확인"],
    selfReview: ["Google Maps 장소 좌표 기반", "번호 중복 없음", "A4 가로 비율 렌더링 가능"],
  };
}

function normalizeGuide(raw: any, fallback: ReturnType<typeof buildFallbackGuide>, sourcePlaces: GuidePlace[]) {
  const rawPlaces = asArray<any>(raw?.places);
  const placeMap = new Map(sourcePlaces.map((place) => [place.id, place]));
  const places = sourcePlaces.map((source) => {
    const generated = rawPlaces.find((place) => place?.id === source.id) || {};
    return {
      ...source,
      ...generated,
      id: source.id,
      mapNumber: source.mapNumber,
      category: source.category,
      markerColor: source.markerColor,
      lat: source.lat,
      lng: source.lng,
      address: text(generated.address, source.address),
      photoUrl: source.photoUrl,
      googleMapsUrl: source.googleMapsUrl,
      nameKo: text(generated.nameKo, source.nameKo),
      nameLocal: text(generated.nameLocal, source.nameLocal),
      nameEn: text(generated.nameEn, source.nameEn),
      hours: text(generated.hours, source.hours || "방문 전 확인"),
      price: text(generated.price, source.price || ""),
      signatureItems: asArray<{ name: string; price: string }>(generated.signatureItems).length
        ? asArray<{ name: string; price: string }>(generated.signatureItems).slice(0, 4)
        : source.signatureItems,
    };
  });
  const days = asArray<any>(raw?.days).length ? asArray<any>(raw.days) : fallback.days;
  days.forEach((day: any) => {
    day.stops = asArray<any>(day.stops).filter((stop) => placeMap.has(stop.id));
  });
  return {
    ...fallback,
    ...(raw && typeof raw === "object" ? raw : {}),
    title: text(raw?.title, fallback.title),
    subtitle: text(raw?.subtitle, fallback.subtitle),
    overview: text(raw?.overview, fallback.overview),
    locationInset: text(raw?.locationInset, fallback.locationInset),
    mapBrief: text(raw?.mapBrief, fallback.mapBrief),
    places,
    days,
    foodGuide: asArray(raw?.foodGuide).length ? raw.foodGuide : fallback.foodGuide,
    shoppingGuide: asArray(raw?.shoppingGuide).length ? raw.shoppingGuide : fallback.shoppingGuide,
    themePage: raw?.themePage && typeof raw.themePage === "object" ? raw.themePage : fallback.themePage,
    familyTips: asArray<string>(raw?.familyTips).length ? raw.familyTips : fallback.familyTips,
    weatherBackup: asArray<string>(raw?.weatherBackup).length ? raw.weatherBackup : fallback.weatherBackup,
    localTips: asArray<string>(raw?.localTips).length ? raw.localTips : fallback.localTips,
    checklist: asArray<string>(raw?.checklist).length ? raw.checklist : fallback.checklist,
    selfReview: asArray<string>(raw?.selfReview).length ? raw.selfReview : fallback.selfReview,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const area = text(body?.trip?.area);
  if (!body?.trip || !area) {
    return Response.json({ error: "Trip area is required." }, { status: 400 });
  }

  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!mapsKey) {
    return Response.json({ error: "Google Maps key is not configured." }, { status: 503 });
  }

  const country = body.trip.country === "KR" ? "KR" : "JP";
  const cacheKey = await stableHash({
    version: 6,
    service: "commercial-guidebook",
    trip: body.trip,
    hotel: body.hotel,
  });
  const cached = await readServerCache("ai-guide", cacheKey);
  if (cached) return Response.json({ guide: cached, cacheHit: true });

  const areaCenter = await geocodeArea(area, country, mapsKey);
  const places = await searchGooglePlaces(area, areaCenter, country, mapsKey);
  const fallbackGuide = buildFallbackGuide(body, areaCenter, places);

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({ guide: fallbackGuide, fallback: true, reason: "missing_api_key" });

  const koreaTime = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(40_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        temperature: 0.35,
        max_tokens: 6200,
        messages: [
          { role: "system", content: GUIDEBOOK_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              currentTimeKST: koreaTime,
              instruction: "아래 Google Maps 수집 장소만 사용해서 A4 가로 여행 가이드북을 제작하세요. 기존 추천 서비스와 연결하지 마세요. title/subtitle에는 '상업용' 같은 내부 표현을 쓰지 마세요.",
              trip: body.trip,
              hotel: body.hotel,
              areaCenter,
              googleMapsPlaces: places,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json({ guide: fallbackGuide, fallback: true, reason: `ai_status_${response.status}` });
    }

    const data = await response.json();
    const guide = normalizeGuide(parseModelJson(data.choices?.[0]?.message?.content || "{}"), fallbackGuide, places);
    await writeServerCache("ai-guide", cacheKey, guide, 60 * 60 * 24 * 14);
    return Response.json({ guide, cacheHit: false });
  } catch {
    return Response.json({ guide: fallbackGuide, fallback: true, reason: "ai_parse_or_timeout" });
  }
}
