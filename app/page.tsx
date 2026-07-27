"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Building2, Bus, CalendarDays, Car, Clock3, Download, Footprints, LocateFixed,
  Heart, MapPin, Navigation, Plus, Printer, Search, TrainFront, Trash2, Users, X
} from "lucide-react";
import { toJpeg } from "html-to-image";

type Category = "전체" | "관광" | "맛집" | "카페" | "디저트" | "쇼핑" | "전통시장" | "주류" | "이자카야·술집" | "온천·휴식" | "아이와 함께" | "역사";
type Point = {
  id: string; name: string; sub: string; category: Exclude<Category, "전체"> | "숙소" | "검색";
  lat: number; lng: number; color: string; description: string; tip: string; hours: string; query: string;
  placeType?: string; rating?: number; reviewCount?: number; businessStatus?: string;
  originalName?: string; originalAddress?: string;
  photoUrl?: string;
  recommendedMenu?: string;
};
type Hotel = { name: string; address: string; lat: number; lng: number };
type Traveler = { id:string; relation:string; age:string };
type TripProfile = { travelers:Traveler[]; startDate:string; endDate:string };
type SearchResult = { display_name: string; lat: string; lon: string; name?: string; originalName?: string; originalAddress?: string };
type TransitStep = { instruction:string; line?:string; vehicle?:string; departure?:string; arrival?:string; stops?:number; minutes:number };
type RouteInfo = { minutes: number; distance: number; coordinates: [number, number][]; estimated?: boolean; transitSteps?:TransitStep[]; transfers?:number };

const spots: Point[] = [
  { id:"kirin", name:"키린테이", sub:"1927년 창업 로컬 식당", category:"맛집", lat:35.38118, lng:136.94755, color:"#ef6a4c", hours:"점심 11:00–14:30", description:"정식과 이누야마 덴가쿠 돈가스를 파는 50석 규모의 노포.", tip:"역에서 가깝고 메뉴가 익숙해 첫날 가족 식사로 좋아요.", query:"キリン亭 犬山" },
  { id:"matsuno", name:"마쓰노야", sub:"140년 전통 덴가쿠 전문점", category:"맛집", lat:35.3805671, lng:136.935734, color:"#ef6a4c", hours:"11:00–15:00 · 목 휴무", description:"두부·토란·돼지고기 덴가쿠와 나메시가 대표 메뉴.", tip:"좌석과 주차장이 넓어 렌터카 이용일에 가장 편해요.", query:"松野屋 犬山" },
  { id:"juhyoya", name:"주효야 이노우에테이", sub:"모리구치즈케 명가", category:"맛집", lat:35.38470, lng:136.93920, color:"#ef6a4c", hours:"10:00–16:30", description:"생선 카스즈케 정식과 간장 누룽지 꼬치가 유명한 전통 식당.", tip:"좌식 공간에서 천천히 쉬며 먹을 수 있어요.", query:"香味茶寮 壽俵屋 犬山井上邸" },
  { id:"honmachi", name:"혼마치 사료", sub:"100년 고민가 카페", category:"카페", lat:35.3831648, lng:136.9395343, color:"#c56892", hours:"11:00–17:00", description:"말차, 화과자, 7종 덴가쿠 정식을 즐기는 전통 카페.", tip:"어른은 고민가와 말차, 아이는 금붕어 디저트를 즐겨요.", query:"本町茶寮 犬山" },
  { id:"hachi", name:"하치카페 이누야마", sub:"키즈 공간이 있는 타르트 카페", category:"카페", lat:35.37995, lng:136.94395, color:"#c56892", hours:"방문 전 영업 확인", description:"타르트와 샌드위치, 넓은 키즈 스페이스가 있는 역 근처 카페.", tip:"5살 아이가 지쳤을 때 쓰기 좋은 휴식 카드예요.", query:"ハチカフェ 犬山店" },
  { id:"town", name:"이누야마 성하마을", sub:"혼마치도리 전통거리", category:"역사", lat:35.38420, lng:136.93955, color:"#247565", hours:"거리 산책 자유", description:"전통가옥, 꼬치 간식, 공방과 작은 박물관이 이어지는 핵심 거리.", tip:"평지 중심이라 세 세대가 함께 걷기 좋아요.", query:"犬山城下町 本町通り" },
  { id:"donden", name:"돈덴칸", sub:"이누야마 축제 수레 전시관", category:"역사", lat:35.38255, lng:136.93947, color:"#247565", hours:"당일 휴관 확인", description:"실제 축제 수레를 가까이서 볼 수 있는 짧은 실내 관람지.", tip:"날씨가 나쁘거나 성 관람이 힘들 때 좋아요.", query:"どんでん館 犬山" },
  { id:"karakuri", name:"가라쿠리 뮤지엄", sub:"전통 기계인형 박물관", category:"역사", lat:35.3854034, lng:136.9392384, color:"#247565", hours:"실연 시간 확인", description:"축제 수레의 기계인형 구조와 움직임을 소개하는 박물관.", tip:"9살 아이가 특히 흥미롭게 볼 만해요.", query:"IMASEN 犬山からくりミュージアム" },
  { id:"sanko", name:"산코 이나리 신사", sub:"붉은 도리이와 하트 에마", category:"역사", lat:35.386459, lng:136.939275, color:"#247565", hours:"경내 참배 가능", description:"이누야마성 아래 자리한 가족 화목·인연 기원 신사.", tip:"성을 오르지 않아도 사진과 여행 분위기를 즐길 수 있어요.", query:"三光稲荷神社 犬山" },
  { id:"haritsuna", name:"하리쓰나 신사", sub:"이누야마 축제의 중심 신사", category:"역사", lat:35.387327, lng:136.9398404, color:"#247565", hours:"경내 참배 가능", description:"오랜 축제 역사와 지역 신앙을 만나는 이누야마성 길목의 신사.", tip:"산코 이나리와 붙어 있어 이동 부담 없이 함께 봐요.", query:"針綱神社 犬山" },
  { id:"castle", name:"국보 이누야마성", sub:"현존 목조 천수", category:"역사", lat:35.3883304, lng:136.9392776, color:"#247565", hours:"입장·대기시간 확인", description:"기소강과 노비평야를 내려다보는 이누야마의 대표 명소.", tip:"천수 계단이 매우 가팔라 할머니와 5살 아이는 아래에서 쉬어도 좋아요.", query:"国宝 犬山城" },
  { id:"river", name:"기소강 산책로", sub:"성 전망이 보이는 강변", category:"역사", lat:35.39005, lng:136.94440, color:"#247565", hours:"산책 자유", description:"기소강을 따라 이누야마성을 바라보는 완만한 산책 구간.", tip:"계단 많은 성 내부 대신 선택하기 좋은 여유 코스예요.", query:"木曽川遊歩道 犬山" }
];

const station: Point = {
  id:"station", name:"이누야마역", sub:"메이테쓰 이누야마역", category:"역사",
  lat:35.3802772, lng:136.9457636, color:"#3f6bb1", hours:"", description:"여행의 기본 출발점", tip:"", query:"犬山駅"
};

const categories: Category[] = ["전체","관광","맛집","카페","디저트","쇼핑","전통시장","주류","이자카야·술집","온천·휴식","아이와 함께","역사"];

function distanceText(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function pointDistanceKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

const placeTranslations: [string, string][] = [
  ["犬山城下町", "이누야마 성하마을"], ["犬山城", "이누야마성"], ["犬山駅", "이누야마역"],
  ["三光稲荷神社", "산코 이나리 신사"], ["針綱神社", "하리쓰나 신사"], ["成田山名古屋別院大聖寺", "나리타산 나고야 별원 다이쇼지"],
  ["どんでん館", "돈덴칸"], ["からくりミュージアム", "가라쿠리 뮤지엄"], ["木曽川", "기소강"],
  ["本町茶寮", "혼마치 사료"], ["松野屋", "마쓰노야"], ["キリン亭", "키린테이"],
  ["ハチカフェ", "하치카페"], ["壽俵屋", "주효야"], ["犬山市文化史料館", "이누야마시 문화사료관"],
  ["犬山市", "이누야마시"], ["愛知県", "아이치현"], ["日本", "일본"], ["名古屋", "나고야"],
  ["神社", "신사"], ["寺", "사찰"], ["城", "성"], ["駅", "역"], ["公園", "공원"],
  ["博物館", "박물관"], ["資料館", "자료관"], ["美術館", "미술관"], ["店", "점"], ["本店", "본점"],
  ["カフェ", "카페"], ["ホテル", "호텔"], ["レストラン", "레스토랑"], ["ミュージアム", "뮤지엄"]
];

function koreanPlaceText(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  let translated = value;
  placeTranslations.forEach(([japanese, korean]) => { translated = translated.replaceAll(japanese, korean); });
  translated = translated
    .replace(/〒\s*\d{3}-\d{4}/g, "")
    .replace(/[都道府県郡区町村丁目番地号]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(translated) ? fallback : translated || fallback;
}

function containsJapanese(value: string | undefined) {
  return Boolean(value && /[\u3040-\u30ff\u3400-\u9fff]/.test(value));
}

function localizePoint(point: Point, fallback = "저장한 현지 장소"): Point {
  if (point.category !== "검색") return point;
  const name = koreanPlaceText(point.name, fallback);
  const address = koreanPlaceText(point.sub, "일본 아이치현 이누야마시");
  return { ...point, name, sub:address, description:address };
}

function googlePlaceDetails(place:any, fallbackName:string) {
  const rawName = (place.displayName || "").trim();
  const rawAddress = (place.formattedAddress || "").trim();
  const address = koreanPlaceText(place.formattedAddress, "일본 현지 주소");
  const placeType = koreanPlaceText(place.primaryTypeDisplayName, "일본 현지 장소");
  const rating = typeof place.rating === "number" ? place.rating : undefined;
  const reviewCount = typeof place.userRatingCount === "number" ? place.userRatingCount : undefined;
  const weekday = place.regularOpeningHours?.weekdayDescriptions?.[new Date().getDay()];
  const hours = koreanPlaceText(weekday, "영업시간은 방문 전에 확인해 주세요.");
  const summarySource = typeof place.editorialSummary === "string" ? place.editorialSummary : place.editorialSummary?.text;
  const ratingText = rating ? ` Google 이용자 평점은 ${rating.toFixed(1)}점${reviewCount ? `, 후기 ${reviewCount.toLocaleString("ko-KR")}개` : ""}입니다.` : "";
  const description = koreanPlaceText(summarySource, `${placeType}입니다.${ratingText}`);
  const localizedName = koreanPlaceText(rawName, "");
  const koreanName = localizedName || (containsJapanese(rawName) ? placeType : rawName) || fallbackName;
  return {
    name:koreanName,
    originalName:rawName && rawName !== koreanName ? rawName : undefined,
    originalAddress:rawAddress && rawAddress !== address ? rawAddress : undefined,
    address, placeType, rating, reviewCount, hours, description,
    businessStatus:place.businessStatus === "OPERATIONAL" ? "영업 중인 장소" : undefined
  };
}

function guideGroup(point:Point) {
  if (point.category !== "검색") return point.category;
  const type = point.placeType || "";
  if (["관광","맛집","카페","쇼핑","주류","이자카야·술집","온천·휴식","디저트","전통시장","아이와 함께"].includes(type)) return type;
  if (/식당|음식|라멘|요리|레스토랑|스시|우동|소바|돈카츠/.test(type)) return "맛집";
  if (/카페|커피|디저트|제과|베이커리/.test(type)) return "카페";
  if (/쇼핑|백화점|상점|시장|편의점|마트|슈퍼|약국|드럭스토어/.test(type)) return "쇼핑";
  if (/주류|술|사케|와인/.test(type)) return "주류";
  if (/이자카야|바 |술집|펍/.test(type)) return "이자카야·술집";
  if (/온천|스파|목욕/.test(type)) return "온천·휴식";
  return "관광";
}

function recommendedMenuFor(name:string, type:string, primaryType?:string) {
  const text = `${name} ${primaryType || ""}`.toLowerCase();
  if (/라멘|らーめん|ラーメン/.test(text)) return "대표 라멘과 매장 인기 토핑";
  if (/우동|うどん/.test(text)) return "대표 우동과 계절 튀김";
  if (/스시|초밥|寿司|鮨/.test(text)) return "제철 모둠초밥 또는 추천 세트";
  if (/돈카츠|とんかつ|豚カツ/.test(text)) return "대표 돈카츠 정식";
  if (/야키니쿠|焼肉/.test(text)) return "인기 모둠구이와 가족 세트";
  if (/오코노미|お好み/.test(text)) return "대표 오코노미야키";
  if (/소바|そば|蕎麦/.test(text)) return "대표 소바와 튀김 세트";
  if (/이자카야|居酒屋|술집/.test(text) || type === "이자카야·술집") return "모둠꼬치, 사시미와 지역 사케";
  if (/카페|coffee|커피/.test(text) || type === "카페") return "시그니처 음료와 인기 디저트";
  if (/디저트|베이커리|제과/.test(text) || type === "디저트") return "매장 대표 디저트와 계절 한정 메뉴";
  if (type === "맛집") return "지역 특선 정식과 매장 대표 메뉴";
  return "";
}

function subwayLinesFor(area:string) {
  const key = area.toLowerCase();
  if (/이누야마|犬山|inuyama/.test(key)) return [
    {name:"메이테쓰 이누야마선",color:"#e53935",stations:["나고야","가미오타이","이와쿠라","고난","가시와모리","이누야마"]},
    {name:"메이테쓰 고마키선",color:"#e53935",stations:["가미이다","아지마","고마키","가쿠덴","이누야마"]},
    {name:"메이테쓰 히로미선",color:"#e53935",stations:["이누야마","도미오카마에","젠지노","신카니","미타케"]},
    {name:"메이테쓰 가카미가하라선",color:"#e53935",stations:["이누야마유엔","신우누마","미카키노","메이테쓰기후"]}
  ];
  if (/도코나메|常滑|tokoname/.test(key)) return [
    {name:"메이테쓰 도코나메선",color:"#e53935",stations:["메이테쓰나고야","가나야마","진구마에","오타가와","신마이코","도코나메"]},
    {name:"메이테쓰 공항선",color:"#e53935",stations:["도코나메","린쿠토코나메","주부국제공항"]}
  ];
  if (/나고야|名古屋|nagoya/.test(key)) return [
    {name:"히가시야마선",color:"#f4b400",stations:["다카바타","나고야","후시미","사카에","모토야마","후지가오카"]},
    {name:"메이조선",color:"#8e44ad",stations:["가나야마","사카에","오조네","모토야마","야고토"]},
    {name:"사쿠라도리선",color:"#e53935",stations:["다이코도리","나고야","마루노우치","히사야오도리","도쿠시게"]},
    {name:"쓰루마이선",color:"#3498db",stations:["가미오타이","마루노우치","후시미","오스칸논","야고토","아카이케"]},
    {name:"메이코선",color:"#8e44ad",stations:["가나야마","히비노","나고야코"]},
    {name:"가미이다선",color:"#ec407a",stations:["헤이안도리","가미이다"]}
  ];
  if (/도쿄|東京|tokyo/.test(key)) return [
    {name:"긴자선",color:"#f39c12",stations:["시부야","오모테산도","아카사카미쓰케","긴자","우에노","아사쿠사"]},
    {name:"마루노우치선",color:"#e53935",stations:["신주쿠","아카사카미쓰케","도쿄","이케부쿠로"]},
    {name:"히비야선",color:"#9e9e9e",stations:["나카메구로","롯폰기","긴자","아키하바라","우에노"]}
  ];
  if (/오사카|大阪|osaka/.test(key)) return [
    {name:"미도스지선",color:"#e53935",stations:["신오사카","우메다","혼마치","난바","덴노지"]},
    {name:"다니마치선",color:"#8e44ad",stations:["히가시우메다","덴마바시","다니마치","덴노지"]},
    {name:"주오선",color:"#2e8b57",stations:["벤텐초","혼마치","모리노미야","나가타"]}
  ];
  if (/교토|京都|kyoto/.test(key)) return [
    {name:"가라스마선",color:"#2e8b57",stations:["국제회관","가라스마오이케","시조","교토","다케다"]},
    {name:"도자이선",color:"#e67e22",stations:["로쿠지조","산조케이한","가라스마오이케","우즈마사텐진가와"]}
  ];
  if (/삿포로|札幌|sapporo/.test(key)) return [
    {name:"난보쿠선",color:"#2e8b57",stations:["아사부","삿포로","오도리","스스키노","마코마나이"]},
    {name:"도자이선",color:"#e67e22",stations:["미야노사와","오도리","신삿포로"]},
    {name:"도호선",color:"#3498db",stations:["사카에마치","삿포로","오도리","후쿠즈미"]}
  ];
  if (/후쿠오카|福岡|fukuoka/.test(key)) return [
    {name:"공항선",color:"#e67e22",stations:["후쿠오카공항","하카타","기온","덴진","메이노하마"]},
    {name:"하코자키선",color:"#3498db",stations:["나카스카와바타","하코자키","가이즈카"]},
    {name:"나나쿠마선",color:"#2e8b57",stations:["하카타","야쿠인","롯폰마쓰","하시모토"]}
  ];
  if (/요코하마|横浜|yokohama/.test(key)) return [
    {name:"블루라인",color:"#1687c9",stations:["아자미노","신요코하마","요코하마","사쿠라기초","간나이","쇼난다이"]},
    {name:"그린라인",color:"#45a735",stations:["히요시","센터키타","센터미나미","나카야마"]},
    {name:"JR 게이힌도호쿠·네기시선",color:"#23a9e0",stations:["요코하마","사쿠라기초","간나이","이시카와초","오후나"]}
  ];
  if (/고베|神戸|kobe/.test(key)) return [
    {name:"세이신·야마테선",color:"#2e8b57",stations:["신고베","산노미야","겐초마에","신나가타","세이신추오"]},
    {name:"가이간선",color:"#3498db",stations:["산노미야·하나도케이마에","하버랜드","신나가타"]},
    {name:"JR 고베선",color:"#1976d2",stations:["오사카","아마가사키","산노미야","고베","아카시"]}
  ];
  if (/나라|奈良|nara/.test(key)) return [
    {name:"긴테쓰 나라선",color:"#d32f2f",stations:["오사카난바","쓰루하시","이코마","야마토사이다이지","긴테쓰나라"]},
    {name:"JR 야마토지선",color:"#2e8b57",stations:["JR난바","덴노지","오지","호류지","나라"]}
  ];
  if (/히로시마|広島|hiroshima/.test(key)) return [
    {name:"히로덴 1호선",color:"#e53935",stations:["히로시마역","핫초보리","가미야초","시청앞","히로시마항"]},
    {name:"히로덴 2호선",color:"#f39c12",stations:["히로시마역","핫초보리","원폭돔앞","니시히로시마","미야지마구치"]},
    {name:"아스트램라인",color:"#2e8b57",stations:["혼도리","겐초마에","신하쿠시마","오마치","고이키코엔마에"]}
  ];
  if (/센다이|仙台|sendai/.test(key)) return [
    {name:"난보쿠선",color:"#2e8b57",stations:["이즈미추오","센다이","이쓰쓰바시","나가마치","도미자와"]},
    {name:"도자이선",color:"#3498db",stations:["야기야마도부쓰코엔","센다이","렌보","아라이"]}
  ];
  return [];
}

export default function Home() {
  const mapEl = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [mapsKey, setMapsKey] = useState("");
  const [category, setCategory] = useState<Category>("전체");
  const [selected, setSelected] = useState<Point>(spots[0]);
  const [sheet, setSheet] = useState<"places" | "search" | "saved" | "route" | "hotel" | "trip">("places");
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelQuery, setHotelQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [originId, setOriginId] = useState("station");
  const [destinationId, setDestinationId] = useState("castle");
  const [mode, setMode] = useState<"walk" | "drive" | "transit">("walk");
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeSearchTarget, setRouteSearchTarget] = useState<"origin" | "destination">("destination");
  const [routeSearchQuery, setRouteSearchQuery] = useState("");
  const [routeSearching, setRouteSearching] = useState(false);
  const [routeSearchResults, setRouteSearchResults] = useState<Point[]>([]);
  const [routeSearchPoints, setRouteSearchPoints] = useState<Point[]>([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeResults, setPlaceResults] = useState<Point[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Point[]>([]);
  const [travelArea, setTravelArea] = useState("이누야마");
  const [areaMoving, setAreaMoving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStart, setGuideStart] = useState("");
  const [guideEnd, setGuideEnd] = useState("");
  const [travelers, setTravelers] = useState<Traveler[]>([
    {id:"grandmother",relation:"할머니",age:""},
    {id:"mother",relation:"엄마",age:""},
    {id:"father",relation:"아빠",age:""},
    {id:"child-9",relation:"여아",age:"9"},
    {id:"child-5",relation:"여아",age:"5"}
  ]);
  const [tripSaved, setTripSaved] = useState(false);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideRecommendations, setGuideRecommendations] = useState<Point[]>([]);
  const [areaPoint, setAreaPoint] = useState<Point | null>(null);
  const [areaBounds, setAreaBounds] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<Point | null>(null);

  const hotelPoint: Point | null = hotel ? {
    id:"hotel", name:hotel.name, sub:hotel.address, category:"숙소", lat:hotel.lat, lng:hotel.lng,
    color:"#7a5caf", hours:"", description:"내가 등록한 숙소", tip:"", query:hotel.address
  } : null;
  const allPoints = [station, ...(areaPoint ? [areaPoint] : []), ...(currentLocation ? [currentLocation] : []), ...(hotelPoint ? [hotelPoint] : []), ...spots, ...savedPlaces, ...placeResults, ...guideRecommendations, ...routeSearchPoints];
  const pointById = (id: string) => allPoints.find((p) => p.id === id) || areaPoint || station;
  const isInuyamaArea = /이누야마|犬山/i.test(travelArea);
  const isPointInCurrentArea = (point:{lat:number;lng:number}) => {
    const center = areaPoint || (isInuyamaArea ? station : null);
    const insideBounds = areaBounds?.contains
      ? areaBounds.contains({ lat:point.lat, lng:point.lng })
      : true;
    const insideRadius = center ? pointDistanceKm(center, point) <= 20 : true;
    return insideBounds && insideRadius;
  };
  const recommendationPool = guideRecommendations.length ? guideRecommendations : isInuyamaArea ? spots : [];
  const regionalSavedPlaces = savedPlaces.filter(isPointInCurrentArea);
  const regionalPlaceResults = placeResults.filter(isPointInCurrentArea);
  const combinedPlacePool = [...regionalPlaceResults, ...recommendationPool]
    .filter((point,index,items)=>items.findIndex((item)=>item.id===point.id || item.name===point.name)===index);
  const visibleSpots = category === "전체" ? combinedPlacePool : combinedPlacePool.filter((p) => guideGroup(p) === category);
  const subwayLines = subwayLinesFor(travelArea);
  const hasSubwayArea = subwayLines.length > 0;

  const updateCurrentLocation = (centerMap:boolean, showError:boolean) => {
    if (!navigator.geolocation) {
      if (showError) setRouteError("이 기기에서는 현재 위치를 사용할 수 없어요.");
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const next:Point = {
        id:"current-location", name:"내 현재 위치", sub:"이 기기에서 확인한 현재 위치",
        category:"검색", lat:position.coords.latitude, lng:position.coords.longitude,
        color:"#e53935", hours:"", description:"현재 사용 중인 기기의 위치입니다.",
        tip:"기기마다 위치 권한을 허용하면 각 기기의 현재 위치가 표시됩니다.", query:""
      };
      setCurrentLocation(next);
      if (centerMap) {
        mapRef.current?.setCenter({lat:next.lat,lng:next.lng});
        mapRef.current?.setZoom(16);
        setSheetCollapsed(true);
      }
    }, () => {
      if (showError) setRouteError("위치 권한을 허용하면 지도에 현재 위치를 표시할 수 있어요.");
    }, { enableHighAccuracy:true, timeout:12000, maximumAge:60000 });
  };

  useEffect(() => {
    const saved = localStorage.getItem("inuyama-hotel");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHotel(parsed);
        setOriginId("hotel");
      } catch {}
    }
    const savedList = localStorage.getItem("inuyama-saved-places");
    if (savedList) {
      try {
        const localized = JSON.parse(savedList).map((point:Point, index:number) => localizePoint(point, `저장한 현지 장소 ${index + 1}`));
        setSavedPlaces(localized);
        localStorage.setItem("inuyama-saved-places", JSON.stringify(localized));
      } catch {}
    }
    const savedArea = localStorage.getItem("travel-search-area");
    if (savedArea) setTravelArea(savedArea);
    const savedTrip = localStorage.getItem("family-trip-profile");
    if (savedTrip) {
      try {
        const parsed:TripProfile = JSON.parse(savedTrip);
        if (Array.isArray(parsed.travelers) && parsed.travelers.length) setTravelers(parsed.travelers);
        if (parsed.startDate) setGuideStart(parsed.startDate);
        if (parsed.endDate) setGuideEnd(parsed.endDate);
        setTripSaved(true);
      } catch {}
    }
    const loadGoogle = async () => {
      if ((window as any).google?.maps) {
        setGoogleReady(true);
        return;
      }
      const response = await fetch("/api/maps-key");
      const { key } = await response.json();
      if (!key) {
        setRouteError("Google 지도 키를 불러오지 못했어요.");
        return;
      }
      setMapsKey(key);
      await new Promise<void>((resolve, reject) => {
        const callback = `initInuyamaMap${Date.now()}`;
        (window as any)[callback] = () => {
          delete (window as any)[callback];
          resolve();
        };
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=ko&region=KR&v=weekly&libraries=places&callback=${callback}`;
        script.async = true;
        script.onerror = () => reject(new Error("Google Maps load failed"));
        document.head.appendChild(script);
      });
      setGoogleReady(true);
    };
    loadGoogle().catch(() => setRouteError("Google 지도를 불러오지 못했어요. Demo Key 할당량과 허용 설정을 확인해 주세요."));
  }, []);

  useEffect(() => {
    if (!googleReady) return;
    updateCurrentLocation(false, false);
  }, [googleReady]);

  useEffect(() => {
    const google = (window as any).google;
    if (!googleReady || !mapEl.current || !google?.maps) return;
    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapEl.current, {
        center:{ lat:35.3845, lng:136.9417 },
        zoom:15,
        mapTypeControl:false,
        streetViewControl:false,
        fullscreenControl:false,
        zoomControl:true,
        gestureHandling:"greedy",
        clickableIcons:true
      });
      mapRef.current.addListener("click", async (event:any) => {
        if (!event.placeId) return;
        event.stop();
        try {
          const { Place } = await google.maps.importLibrary("places");
          const place = new Place({ id:event.placeId });
          await place.fetchFields({ fields:["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","rating","userRatingCount","regularOpeningHours","businessStatus"] });
          if (!place.location) return;
          const clickedPoint = { lat:place.location.lat(), lng:place.location.lng() };
          const currentCenter = areaPoint || (isInuyamaArea ? station : null);
          const isInsideBounds = areaBounds?.contains ? areaBounds.contains(clickedPoint) : true;
          const isInsideRadius = currentCenter ? pointDistanceKm(currentCenter, clickedPoint) <= 20 : true;
          if (!isInsideBounds || !isInsideRadius) {
            setRouteError(`${travelArea} 지역 안의 장소만 선택할 수 있어요.`);
            return;
          }
          const details = googlePlaceDetails(place, "지도에서 선택한 장소");
          const point:Point = {
            id:`google-${place.id}`,
            name:details.name,
            sub:details.address,
            category:"검색",
            lat:place.location.lat(),
            lng:place.location.lng(),
            color:"#356fbd",
            hours:details.hours,
            description:details.description,
            tip:"영업시간과 가족 이동 동선을 확인한 뒤 방문해 주세요.",
            query:place.googleMapsURI || place.displayName || ""
            ,placeType:details.placeType, rating:details.rating, reviewCount:details.reviewCount, businessStatus:details.businessStatus,
            originalName:details.originalName, originalAddress:details.originalAddress
          };
          setPlaceResults((current) => current.some((item) => item.id === point.id) ? current : [point, ...current]);
          setSelected(point);
          setSheet("places");
          setSheetCollapsed(false);
        } catch {
          setRouteError("선택한 장소 정보를 불러오지 못했어요.");
        }
      });
    }
    markerLayerRef.current.forEach((marker) => marker.setMap(null));
    markerLayerRef.current = [];
    const markerPoints = [...(isInuyamaArea ? [station] : areaPoint ? [areaPoint] : []), ...(currentLocation ? [currentLocation] : []), ...(hotelPoint ? [hotelPoint] : []), ...visibleSpots, ...regionalPlaceResults, ...regionalSavedPlaces, ...routeSearchPoints]
      .filter((point, index, items) => items.findIndex((item) => item.id === point.id) === index);
    markerPoints.forEach((point) => {
      const isCurrentLocation = point.id === "current-location";
      const marker = new google.maps.Marker({
        map:mapRef.current,
        position:{ lat:point.lat, lng:point.lng },
        title:point.originalName ? `${point.name} / ${point.originalName}` : point.name,
        label:{
          text:isCurrentLocation ? "현재" : point.category === "숙소" ? "숙소" : point.id === "station" ? "역" : point.name.slice(0,2),
          color:"#ffffff",
          fontSize:"10px",
          fontWeight:"800"
        },
        icon:{
          path:google.maps.SymbolPath.CIRCLE,
          fillColor:isCurrentLocation ? "#e53935" : point.color,
          fillOpacity:1,
          strokeColor:"#ffffff",
          strokeWeight:selected.id === point.id ? 4 : 3,
          scale:isCurrentLocation ? 11 : selected.id === point.id ? 18 : 15
        },
        zIndex:isCurrentLocation ? 30 : selected.id === point.id ? 20 : 10
      });
      marker.addListener("click", () => {
        setSelected(point);
        setSheet("places");
        setSheetCollapsed(false);
        mapRef.current.panTo({ lat:point.lat, lng:point.lng });
      });
      markerLayerRef.current.push(marker);
    });
  }, [googleReady, category, selected.id, hotel, placeResults, savedPlaces, guideRecommendations, areaPoint, currentLocation, travelArea, routeSearchPoints]);

  const chooseHotel = (result: SearchResult) => {
    const next = {
      name: result.name || result.display_name.split(",")[0],
      address: result.display_name,
      lat: Number(result.lat), lng: Number(result.lon)
    };
    setHotel(next);
    localStorage.setItem("inuyama-hotel", JSON.stringify(next));
    setOriginId("hotel");
    setResults([]);
    setHotelQuery("");
    setSheet("route");
    mapRef.current?.setCenter({lat:next.lat,lng:next.lng});
    mapRef.current?.setZoom(16);
  };

  const persistSavedPlaces = (next: Point[]) => {
    setSavedPlaces(next);
    localStorage.setItem("inuyama-saved-places", JSON.stringify(next));
  };

  const toggleSavedPlace = (point: Point) => {
    const exists = savedPlaces.some((item) => item.id === point.id);
    persistSavedPlaces(exists ? savedPlaces.filter((item) => item.id !== point.id) : [...savedPlaces, point]);
  };

  const searchGooglePlaces = async (queryOverride?:string) => {
    const query = (queryOverride || placeQuery).trim();
    if (!query) return;
    if (queryOverride) setPlaceQuery(query);
    setPlaceSearching(true);
    setPlaceResults([]);
    setRouteError("");
    const preservedZoom = mapRef.current?.getZoom();
    try {
      const google = (window as any).google;
      const { Place } = await google.maps.importLibrary("places");
      const center = mapRef.current?.getCenter();
      const { places } = await Place.searchByText({
        textQuery:`${query} ${travelArea.trim() || "일본"}`,
        fields:["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","rating","userRatingCount","regularOpeningHours","businessStatus"],
        ...(areaBounds ? { locationRestriction:areaBounds } : center ? { locationBias:{ center, radius:7000 } } : {}),
        language:"ko",
        maxResultCount:12
      });
      const next:Point[] = places.filter((place:any) => {
        if (!place.location) return false;
        const point = { lat:place.location.lat(), lng:place.location.lng() };
        const currentCenter = areaPoint || (isInuyamaArea ? station : null);
        const insideBounds = areaBounds?.contains ? areaBounds.contains(point) : true;
        const insideRadius = currentCenter ? pointDistanceKm(currentCenter, point) <= 20 : true;
        return insideBounds && insideRadius;
      }).map((place:any, index:number) => {
        const details = googlePlaceDetails(place, `${travelArea || "일본"} 검색 장소 ${index + 1}`);
        return {
        id:`google-${place.id}`,
        name:details.name,
        sub:details.address,
        category:"검색",
        lat:place.location.lat(),
        lng:place.location.lng(),
        color:"#356fbd",
        hours:details.hours,
        description:details.description,
        tip:"영업시간과 가족 이동 동선을 확인한 뒤 방문해 주세요.",
        query:place.googleMapsURI || place.displayName || ""
        ,placeType:details.placeType, rating:details.rating, reviewCount:details.reviewCount, businessStatus:details.businessStatus,
        originalName:details.originalName, originalAddress:details.originalAddress
      }});
      setPlaceResults(next);
      if (next[0]) setSelected(next[0]);
      if (!next.length) setRouteError(`${travelArea} 지역 안에서 '${query}' 검색 결과를 찾지 못했어요.`);
    } catch {
      setRouteError("장소 검색을 사용할 수 없어요. Demo Key의 Places 할당량을 확인해 주세요.");
    } finally {
      if (typeof preservedZoom === "number") mapRef.current?.setZoom(preservedZoom);
      setPlaceSearching(false);
    }
  };

  const moveToArea = async () => {
    if (!travelArea.trim()) return;
    setAreaMoving(true);
    setRouteError("");
    try {
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();
      const { results:areaResults } = await geocoder.geocode({ address:`${travelArea.trim()} 일본`, language:"ko", region:"JP" });
      if (!areaResults?.[0]) throw new Error();
      mapRef.current?.setCenter(areaResults[0].geometry.location);
      mapRef.current?.setZoom(13);
      setAreaBounds(areaResults[0].geometry.viewport);
      localStorage.setItem("travel-search-area", travelArea.trim());
      setPlaceResults([]);
      setGuideRecommendations([]);
      setCategory("전체");
      await buildAreaGuide(areaResults[0].geometry.location, areaResults[0].geometry.viewport);
    } catch {
      setRouteError("지역을 찾지 못했어요. 예: 교토, 오사카, 삿포로처럼 입력해 주세요.");
    } finally {
      setAreaMoving(false);
    }
  };

  const buildAreaGuide = async (providedCenter?: any, providedBounds?: any) => {
    if (!travelArea.trim()) return;
    setGuideLoading(true);
    setGuideRecommendations([]);
    setPlaceResults([]);
    setCategory("전체");
    setRouteError("");
    try {
      const google = (window as any).google;
      let center = providedCenter;
      let bounds = providedBounds;
      if (!center?.lat) {
        const geocoder = new google.maps.Geocoder();
        const { results:areaResults } = await geocoder.geocode({ address:`${travelArea.trim()} 일본`, language:"ko", region:"JP" });
        if (!areaResults?.[0]) throw new Error();
        center = areaResults[0].geometry.location;
        bounds = areaResults[0].geometry.viewport;
      }
      if (!bounds) throw new Error();
      setAreaBounds(bounds);
      mapRef.current?.setCenter(center);
      mapRef.current?.setZoom(13);
      const centerLat = typeof center.lat === "function" ? center.lat() : center.lat;
      const centerLng = typeof center.lng === "function" ? center.lng() : center.lng;
      const nextAreaPoint:Point = {
        id:"area-center", name:`${travelArea.trim()} 중심`, sub:`${travelArea.trim()} 여행 기준 위치`,
        category:"검색", lat:centerLat, lng:centerLng, color:"#174da4", hours:"",
        description:`${travelArea.trim()} 지역 길찾기의 기본 출발점입니다.`, tip:"", query:`${travelArea.trim()} 일본`
      };
      setAreaPoint(nextAreaPoint);
      setSelected(nextAreaPoint);
      setOriginId("area-center");
      localStorage.setItem("travel-search-area", travelArea.trim());
      const { Place } = await google.maps.importLibrary("places");
      const types = [
        { label:"관광", query:"대표 관광지 명소", color:"#275fbd" },
        { label:"맛집", query:"현지인 인기 맛집", color:"#ef6a4c" },
        { label:"카페", query:"인기 카페 디저트", color:"#c56892" },
        { label:"쇼핑", query:"쇼핑 백화점 전통시장", color:"#e54473" },
        { label:"주류", query:"사케 위스키 주류 전문점", color:"#8052a5" },
        { label:"이자카야·술집", query:"현지인 이자카야 술집", color:"#a65068" },
        { label:"온천·휴식", query:"온천 스파 가족 휴식", color:"#6b55b5" },
        { label:"디저트", query:"유명 디저트 베이커리", color:"#d36a9a" },
        { label:"전통시장", query:"전통시장 상점가", color:"#d88b24" },
        { label:"아이와 함께", query:"아이와 가족 체험 명소", color:"#2e9b78" }
      ];
      const batches = await Promise.allSettled(types.map(async (type) => {
        const { places } = await Place.searchByText({
          textQuery:`${travelArea.trim()} ${type.query}`,
          fields:["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","rating","userRatingCount","regularOpeningHours","businessStatus","photos"],
          locationRestriction:bounds,
          language:"ko",
          maxResultCount:5
        });
        return places.filter((place:any)=>{
          if (!place.location || !bounds.contains(place.location)) return false;
          return pointDistanceKm(
            { lat:centerLat, lng:centerLng },
            { lat:place.location.lat(), lng:place.location.lng() }
          ) <= 20;
        }).slice(0,4).map((place:any,index:number) => {
          const details = googlePlaceDetails(place, `${travelArea.trim()} ${type.label} 추천 ${index+1}`);
          return {
            id:`guide-${type.label}-${place.id}`,
            name:details.name, sub:details.address, category:"검색" as const,
            lat:place.location.lat(), lng:place.location.lng(), color:type.color,
            hours:details.hours, description:details.description,
            tip:`${type.label} 분야의 평점과 인지도를 참고한 추천 장소예요.`,
            query:place.googleMapsURI || place.displayName || "",
            placeType:type.label, rating:details.rating, reviewCount:details.reviewCount,
            businessStatus:details.businessStatus,
            originalName:details.originalName, originalAddress:details.originalAddress,
            photoUrl:place.photos?.[0]?.getURI?.({ maxWidth:400, maxHeight:240 }),
            recommendedMenu:recommendedMenuFor(place.displayName || "", type.label, place.primaryTypeDisplayName)
          };
        });
      }));
      const next = batches.flatMap((batch) => batch.status === "fulfilled" ? batch.value : [])
        .filter((point,index,items)=>items.findIndex((item)=>item.name===point.name)===index);
      if (!next.length) throw new Error();
      setGuideRecommendations(next);
      setSelected(next[0]);
      setDestinationId(next[0].id);
      routeLayerRef.current?.setMap(null);
      routeLayerRef.current = null;
      setRoute(null);
    } catch {
      setRouteError("지역 추천 정보를 만들지 못했어요. Google Places 할당량을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setGuideLoading(false);
    }
  };

  const downloadGuideImage = async () => {
    if (!guideRef.current) return;
    setGuideSaving(true);
    try {
      const dataUrl = await toJpeg(guideRef.current, {
        quality:.96, pixelRatio:1.5, backgroundColor:"#ffffff", width:720,
        style:{ transform:"none", margin:"0", width:"720px" }
      });
      const link = document.createElement("a");
      link.download = `${travelArea || "일본"}-가족여행-가이드.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      setGuideSaving(false);
    }
  };

  const searchHotel = async () => {
    if (!hotelQuery.trim()) return;
    setSearching(true);
    setResults([]);
    setRouteError("");
    try {
      const google = (window as any).google;
      if (!google?.maps) throw new Error();
      const { Place } = await google.maps.importLibrary("places");
      const center = areaPoint
        ? { lat:areaPoint.lat, lng:areaPoint.lng }
        : mapRef.current?.getCenter();
      const { places } = await Place.searchByText({
        textQuery:`${hotelQuery.trim()} ${travelArea.trim()} 일본`,
        fields:["id","displayName","formattedAddress","location","primaryTypeDisplayName"],
        ...(center ? { locationBias:{ center, radius:30000 } } : {}),
        language:"ko",
        maxResultCount:8
      });
      const next:SearchResult[] = places.filter((place:any)=>place.location).map((place:any)=>({
        name:koreanPlaceText(place.displayName, koreanPlaceText(place.primaryTypeDisplayName, "숙소")),
        display_name:koreanPlaceText(place.formattedAddress, "일본 현지 주소"),
        originalName:place.displayName,
        originalAddress:place.formattedAddress,
        lat:String(place.location.lat()),
        lon:String(place.location.lng())
      }));
      setResults(next);
      if (!next.length) setRouteError("검색 결과가 없어요. 숙소명 또는 일본 주소를 조금 더 자세히 입력해 주세요.");
    } catch {
      setRouteError("숙소 검색에 실패했어요. 숙소명이나 일본 주소로 다시 검색해 주세요.");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    updateCurrentLocation(true, true);
  };

  const searchRoutePlaces = async () => {
    if (!routeSearchQuery.trim()) return;
    setRouteSearching(true);
    setRouteSearchResults([]);
    setRouteError("");
    try {
      const google = (window as any).google;
      const { Place } = await google.maps.importLibrary("places");
      const center = mapRef.current?.getCenter();
      const { places } = await Place.searchByText({
        textQuery:`${routeSearchQuery.trim()} 일본`,
        fields:["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName"],
        ...(center ? { locationBias:{ center, radius:50000 } } : {}),
        language:"ko",
        maxResultCount:8
      });
      const next:Point[] = places.filter((place:any)=>place.location).map((place:any,index:number)=>{
        const details = googlePlaceDetails(place, `검색 장소 ${index+1}`);
        return {
          id:`route-${place.id}`, name:details.name, sub:details.address, category:"검색",
          lat:place.location.lat(), lng:place.location.lng(), color:"#6a57a5",
          hours:"", description:"길찾기를 위해 직접 검색한 장소입니다.", tip:"",
          query:place.googleMapsURI || place.displayName || "",
          placeType:details.placeType, originalName:details.originalName, originalAddress:details.originalAddress
        };
      });
      setRouteSearchResults(next);
      if (!next.length) setRouteError("일본 내에서 검색 결과를 찾지 못했어요. 지역명과 장소명을 함께 입력해 보세요.");
    } catch {
      setRouteError("길찾기 장소 검색에 실패했어요. 장소명이나 주소를 다시 확인해 주세요.");
    } finally {
      setRouteSearching(false);
    }
  };

  const chooseRouteSearchPlace = (point:Point) => {
    setRouteSearchPoints((current)=>current.some((item)=>item.id===point.id) ? current : [...current,point]);
    if (routeSearchTarget === "origin") setOriginId(point.id);
    else setDestinationId(point.id);
    setRouteSearchResults([]);
    setRouteSearchQuery("");
    setRoute(null);
    routeLayerRef.current?.setMap(null);
    routeLayerRef.current = null;
    mapRef.current?.panTo({lat:point.lat,lng:point.lng});
  };

  const calculateFallback = (a: Point, b: Point): RouteInfo => {
    const R = 6371;
    const dLat = (b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
    const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
    const km = R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))*(mode === "walk" ? 1.28 : 1.45);
    const speed = mode === "walk" ? 3.7 : 24;
    return { minutes:Math.max(1, Math.round(km/speed*60)), distance:km, coordinates:[[a.lat,a.lng],[b.lat,b.lng]], estimated:true };
  };

  const getRoute = async () => {
    const a = pointById(originId), b = pointById(destinationId);
    if (a.id === b.id) {
      setRouteError("출발지와 도착지를 다르게 선택해 주세요.");
      return;
    }
    setRouteLoading(true);
    setRouteError("");
    try {
      const google = (window as any).google;
      if (!google?.maps) throw new Error();
      const service = new google.maps.DirectionsService();
      const travelMode = mode === "walk" ? google.maps.TravelMode.WALKING
        : mode === "drive" ? google.maps.TravelMode.DRIVING
        : google.maps.TravelMode.TRANSIT;
      const result = await service.route({
        origin:{lat:a.lat,lng:a.lng},
        destination:{lat:b.lat,lng:b.lng},
        travelMode,
        ...(mode === "transit" ? { transitOptions:{ departureTime:new Date(), modes:[
          google.maps.TransitMode.BUS, google.maps.TransitMode.RAIL, google.maps.TransitMode.SUBWAY, google.maps.TransitMode.TRAIN
        ] } } : {})
      });
      const first = result.routes?.[0];
      const leg = first?.legs?.[0];
      if (!first || !leg) throw new Error();
      const transitSteps:TransitStep[] | undefined = mode === "transit" ? leg.steps.map((step:any) => {
        const detail = step.transit;
        const lineName = detail?.line?.short_name || detail?.line?.name;
        return {
          instruction:(step.instructions || "").replace(/<[^>]+>/g, ""),
          line:lineName,
          vehicle:detail?.line?.vehicle?.name,
          departure:detail?.departure_stop?.name,
          arrival:detail?.arrival_stop?.name,
          stops:detail?.num_stops,
          minutes:Math.max(1, Math.round((step.duration?.value || 60) / 60))
        };
      }) : undefined;
      const next:RouteInfo = {
        minutes:Math.max(1, Math.round((leg.duration?.value || 60)/60)),
        distance:(leg.distance?.value || 0)/1000,
        coordinates:first.overview_path.map((point:any) => [point.lat(),point.lng()] as [number,number]),
        transitSteps,
        transfers:transitSteps ? Math.max(0, transitSteps.filter((step)=>step.line).length - 1) : undefined
      };
      setRoute(next);
      drawRoute(next);
    } catch {
      if (mode === "transit") {
        setRoute(null);
        setRouteError("페이지에서 대중교통 경로를 불러오지 못했어요. 아래 Google 지도 버튼에서 최신 열차·버스 경로를 바로 확인해 주세요.");
      } else {
        const next = calculateFallback(a,b);
        setRoute(next);
        setRouteError("실시간 경로 연결이 원활하지 않아 직선거리 기반 예상시간을 표시했어요.");
        drawRoute(next);
      }
    } finally {
      setRouteLoading(false);
    }
  };

  const drawRoute = (info: RouteInfo) => {
    const google = (window as any).google;
    if (!google?.maps || !mapRef.current) return;
    routeLayerRef.current?.setMap(null);
    routeLayerRef.current = new google.maps.Polyline({
      map:mapRef.current,
      path:info.coordinates.map(([lat,lng]) => ({lat,lng})),
      strokeColor:"#176b5b",
      strokeWeight:6,
      strokeOpacity:.9
    });
    const bounds = new google.maps.LatLngBounds();
    info.coordinates.forEach(([lat,lng]) => bounds.extend({lat,lng}));
    mapRef.current.fitBounds(bounds, 45);
  };

  const clearRoute = () => {
    routeLayerRef.current?.setMap(null);
    routeLayerRef.current = null;
    setRoute(null);
    setRouteError("");
  };

  const googleNavigationUrl = () => {
    const origin = pointById(originId);
    const destination = pointById(destinationId);
    const params = new URLSearchParams({
      api:"1",
      destination:`${destination.lat},${destination.lng}`,
      travelmode:mode === "walk" ? "walking" : mode === "drive" ? "driving" : "transit",
      dir_action:"navigate"
    });
    if (origin.id !== "current-location") {
      params.set("origin", `${origin.lat},${origin.lng}`);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const selectRecommendationCategory = (item:Category) => {
    setCategory(item);
    const candidates = item === "전체" ? combinedPlacePool : combinedPlacePool.filter((point)=>guideGroup(point)===item);
    const next = candidates[0] || areaPoint;
    if (next) {
      setSelected(next);
      mapRef.current?.panTo({lat:next.lat,lng:next.lng});
    }
    if (item !== "전체") void searchGooglePlaces(item);
  };

  const tripDays = (() => {
    if (!guideStart || !guideEnd) return null;
    const start = new Date(`${guideStart}T00:00:00`);
    const end = new Date(`${guideEnd}T00:00:00`);
    const nights = Math.round((end.getTime()-start.getTime())/86400000);
    return nights >= 0 ? { nights, days:nights+1 } : null;
  })();

  const updateTraveler = (id:string, field:"relation"|"age", value:string) => {
    setTravelers((current)=>current.map((traveler)=>traveler.id===id ? {...traveler,[field]:value} : traveler));
    setTripSaved(false);
  };

  const addTraveler = () => {
    setTravelers((current)=>[...current,{id:`traveler-${Date.now()}`,relation:"구성원",age:""}]);
    setTripSaved(false);
  };

  const removeTraveler = (id:string) => {
    setTravelers((current)=>current.length > 1 ? current.filter((traveler)=>traveler.id!==id) : current);
    setTripSaved(false);
  };

  const saveTripProfile = () => {
    if (guideStart && guideEnd && !tripDays) {
      setRouteError("여행 종료일은 시작일보다 늦어야 해요.");
      return;
    }
    const profile:TripProfile = {travelers,startDate:guideStart,endDate:guideEnd};
    localStorage.setItem("family-trip-profile",JSON.stringify(profile));
    setTripSaved(true);
    setRouteError("");
    setSheet("places");
  };

  return (
    <main
      className="mobile-app"
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest(".bottom-sheet, .bottom-tabs, .guide-overlay")) return;
        setSheetCollapsed(true);
      }}
    >
      <header className="mobile-header">
        <div><small>우리 가족 {travelArea || "일본"} 여행</small><h1>오늘 어디로 갈까요?</h1></div>
        <div className="header-actions">
          <button className={`round-button ${tripSaved ? "ready" : ""}`} onClick={() => {setSheet("trip");setSheetCollapsed(false);}} aria-label="여행 구성 설정"><Users size={20}/></button>
          <button className="round-button" onClick={() => {setSheet("hotel");setSheetCollapsed(false);}} aria-label="숙소 등록"><Building2 size={20}/></button>
        </div>
      </header>

      <section className="mobile-map-wrap">
        <div ref={mapEl} className="mobile-map"/>
        <button className="locate-button" onClick={useCurrentLocation}><LocateFixed size={18}/></button>
        <div className="map-language"><span>가</span> 한글 지도</div>
      </section>

      <nav className="bottom-tabs">
        <button className={sheet === "places" ? "active" : ""} onClick={() => {setSheet("places");setSheetCollapsed(false);}}><MapPin size={19}/><span>장소</span></button>
        <button className={sheet === "search" ? "active" : ""} onClick={() => {setSheet("search");setSheetCollapsed(false);}}><Search size={19}/><span>검색</span></button>
        <button className={sheet === "saved" ? "active" : ""} onClick={() => {setSheet("saved");setSheetCollapsed(false);}}><Heart size={19}/><span>저장</span></button>
        <button className={sheet === "route" ? "active" : ""} onClick={() => {setSheet("route");setSheetCollapsed(false);}}><Navigation size={19}/><span>길찾기</span></button>
        <button className={guideOpen ? "active" : ""} onClick={() => setGuideOpen(true)}><BookOpen size={19}/><span>가이드북</span></button>
      </nav>

      <section className={`bottom-sheet ${sheet} ${sheetCollapsed ? "collapsed" : ""}`}>
        <button className="sheet-toggle" onClick={() => setSheetCollapsed((value) => !value)} aria-label={sheetCollapsed ? "패널 펼치기" : "패널 접기"}>
          <span className="sheet-handle"/>
        </button>
        {sheet === "places" && (
          <>
            <div className="sheet-heading"><div><small>{selected.category === "검색" ? "지도에서 선택한 장소" : "추천 장소"}</small><h2>{selected.name}</h2>{selected.originalName && <span className="original-name">{selected.originalName}</span>}</div></div>
            <div className="category-scroll">
              {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => selectRecommendationCategory(item)}>{item}</button>)}
            </div>
            <div className="selected-place">
              <span className="place-dot" style={{background:selected.color}}>{selected.category === "숙소" ? "숙" : selected.name.slice(0,1)}</span>
              <div className="place-main">
                <div className="place-title">
                  <b>{selected.name}</b>
                  {selected.originalName && <em>{selected.originalName}</em>}
                  <small>{selected.sub}</small>
                  {selected.originalAddress && <small className="original-address">{selected.originalAddress}</small>}
                </div>
                {selected.category === "검색" && <div className="place-meta">
                  {selected.placeType && <span>{selected.placeType}</span>}
                  {selected.rating && <span>★ {selected.rating.toFixed(1)}{selected.reviewCount ? ` (${selected.reviewCount.toLocaleString("ko-KR")})` : ""}</span>}
                  {selected.businessStatus && <span>{selected.businessStatus}</span>}
                </div>}
                <p>{selected.description}</p>
                {selected.hours && <p className="place-hours"><Clock3 size={13}/>{selected.hours}</p>}
                {selected.tip && <div className="family-tip">{selected.category === "검색" ? "방문 팁" : "가족 추천"} · {selected.tip}</div>}
              </div>
            </div>
            <div className="place-actions">
              <button onClick={() => { setDestinationId(selected.id); setSheet("route"); }}><Navigation size={17}/> 여기까지 길찾기</button>
              <button className={`save-action ${savedPlaces.some((item) => item.id === selected.id) ? "saved" : ""}`} onClick={() => toggleSavedPlace(selected)} aria-label="장소 저장">
                <Heart size={16} fill={savedPlaces.some((item) => item.id === selected.id) ? "currentColor" : "none"}/>
              </button>
              <a href={selected.query.startsWith("http") ? selected.query : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.query)}`} target="_blank" rel="noreferrer">구글지도</a>
            </div>
            <div className="spot-strip">
              {visibleSpots.map((spot) => <button key={spot.id} className={selected.id === spot.id ? "active" : ""} onClick={() => {setSelected(spot); mapRef.current?.panTo({lat:spot.lat,lng:spot.lng});}}><span style={{background:spot.color}}>{spot.name.slice(0,1)}</span><b>{spot.name}</b>{spot.originalName && <em>{spot.originalName}</em>}<small>{spot.sub}</small></button>)}
            </div>
          </>
        )}

        {sheet === "search" && (
          <>
            <div className="sheet-heading"><div><small>실제 Google 지도 데이터</small><h2>주변 장소 검색</h2></div><Search size={19}/></div>
            <div className="area-search">
              <MapPin size={17}/>
              <input value={travelArea} onChange={(e)=>setTravelArea(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&moveToArea()} placeholder="여행 지역 입력 · 예: 교토"/>
              <button onClick={moveToArea}>{areaMoving ? "이동 중" : "지역 이동"}</button>
            </div>
            <div className="hotel-search">
              <Search size={18}/>
              <input value={placeQuery} onChange={(e)=>setPlaceQuery(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){setCategory("전체");void searchGooglePlaces();}}} placeholder="편의점, 식당, 카페, 관광지 검색"/>
              <button onClick={()=>{setCategory("전체");void searchGooglePlaces();}}>{placeSearching ? "검색 중" : "검색"}</button>
            </div>
            <div className="quick-search">
              {["편의점","마트","약국","주차장","가족 식당","카페 디저트","관광지"].map((query) => <button key={query} onClick={() => {setCategory("전체");void searchGooglePlaces(query);}}>{query}</button>)}
            </div>
            {regionalPlaceResults.length > 0 && <p className="search-result-count">{travelArea} 검색 결과 {regionalPlaceResults.length}곳</p>}
            <div className="google-results">
              {regionalPlaceResults.map((point) => (
                <article key={point.id} className="google-result">
                  <button className="result-main" onClick={() => {setSelected(point);setSheet("places");mapRef.current?.panTo({lat:point.lat,lng:point.lng});}}>
                    <MapPin size={17}/><span><b>{point.name}</b>{point.originalName && <em>{point.originalName}</em>}<small>{point.sub}</small></span>
                  </button>
                  <button className="result-save" onClick={() => toggleSavedPlace(point)} aria-label="저장"><Heart size={16} fill={savedPlaces.some((item) => item.id === point.id) ? "currentColor" : "none"}/></button>
                  <button className="result-route" onClick={() => {setDestinationId(point.id);setSheet("route");}} aria-label="길찾기"><Navigation size={16}/></button>
                </article>
              ))}
            </div>
            {!placeSearching && regionalPlaceResults.length === 0 && <p className="empty-saved">{travelArea} 지역 안에서 장소명을 검색하거나 지도 위의 상점·명소를 눌러보세요.</p>}
            {routeError && <p className="route-error">{routeError}</p>}
          </>
        )}

        {sheet === "saved" && (
          <>
            <div className="sheet-heading"><div><small>이 휴대폰에 보관</small><h2>저장한 장소</h2></div><Heart size={19}/></div>
            <div className="saved-list">
              {savedPlaces.map((point) => (
                <article key={point.id} className="saved-row">
                  <button className="saved-main" onClick={() => {setSelected(point);setSheet("places");mapRef.current?.panTo({lat:point.lat,lng:point.lng});}}>
                    <span style={{background:point.color}}>{point.name.slice(0,1)}</span><div><b>{point.name}</b><small>{point.sub}</small></div>
                  </button>
                  <button onClick={() => {setDestinationId(point.id);setSheet("route");}} aria-label="길찾기"><Navigation size={16}/></button>
                  <button className="delete-saved" onClick={() => toggleSavedPlace(point)} aria-label="삭제"><Trash2 size={16}/></button>
                </article>
              ))}
            </div>
            {savedPlaces.length === 0 && <p className="empty-saved">추천 장소나 검색 결과의 하트 버튼을 눌러 저장할 수 있어요.</p>}
            <button className="guide-create-button" onClick={() => setGuideOpen(true)}><BookOpen size={17}/> 저장 장소로 가이드북 만들기</button>
          </>
        )}

        {sheet === "trip" && (
          <>
            <div className="sheet-heading"><div><small>AI 맞춤 추천의 기준</small><h2>여행 구성 설정</h2></div><button className="icon-close" onClick={()=>setSheet("places")}><X size={20}/></button></div>
            <div className="trip-summary">
              <Users size={20}/>
              <div><b>{travelers.length}명 가족여행</b><small>{tripDays ? `${tripDays.nights}박 ${tripDays.days}일` : "여행 날짜를 등록해 주세요"}</small></div>
            </div>
            <div className="trip-dates">
              <label><span>여행 시작일</span><input type="date" value={guideStart} onChange={(e)=>{setGuideStart(e.target.value);setTripSaved(false);}}/></label>
              <label><span>여행 종료일</span><input type="date" min={guideStart || undefined} value={guideEnd} onChange={(e)=>{setGuideEnd(e.target.value);setTripSaved(false);}}/></label>
            </div>
            <div className="traveler-heading"><div><b>여행 구성원</b><small>관계와 나이를 입력하면 AI가 이동 난이도와 장소를 조정해요.</small></div><button onClick={addTraveler}><Plus size={14}/>추가</button></div>
            <div className="traveler-list">
              {travelers.map((traveler,index)=>(
                <div className="traveler-row" key={traveler.id}>
                  <span>{index+1}</span>
                  <input value={traveler.relation} onChange={(e)=>updateTraveler(traveler.id,"relation",e.target.value)} placeholder="관계 · 예: 할머니"/>
                  <label><input type="number" min="0" max="120" value={traveler.age} onChange={(e)=>updateTraveler(traveler.id,"age",e.target.value)} placeholder="나이"/><small>세</small></label>
                  <button onClick={()=>removeTraveler(traveler.id)} aria-label="구성원 삭제"><Trash2 size={15}/></button>
                </div>
              ))}
            </div>
            <div className="ai-profile-note"><b>AI 반영 예정 정보</b><p>{travelers.map((traveler)=>`${traveler.relation}${traveler.age ? ` ${traveler.age}세` : ""}`).join(" · ")}{tripDays ? ` · ${tripDays.nights}박 ${tripDays.days}일` : ""}</p></div>
            <button className="save-trip-button" onClick={saveTripProfile}><Users size={17}/>{tripSaved ? "여행 정보 저장됨" : "여행 정보 저장하기"}</button>
            {routeError && <p className="route-error">{routeError}</p>}
          </>
        )}

        {sheet === "hotel" && (
          <>
            <div className="sheet-heading"><div><small>출발지로 바로 사용</small><h2>내 숙소 등록</h2></div><button className="icon-close" onClick={() => setSheet("places")}><X size={20}/></button></div>
            {hotel && <div className="saved-hotel"><Building2 size={19}/><div><b>{hotel.name}</b><small>{hotel.address}</small></div><button onClick={() => {localStorage.removeItem("inuyama-hotel");setHotel(null);setOriginId("station");}}>삭제</button></div>}
            <div className="hotel-search">
              <Search size={18}/>
              <input value={hotelQuery} onChange={(e)=>setHotelQuery(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&searchHotel()} placeholder="숙소명 또는 일본 주소 입력"/>
              <button onClick={searchHotel}>{searching ? "검색 중" : "검색"}</button>
            </div>
            <button className="current-location" onClick={useCurrentLocation}><LocateFixed size={18}/><div><b>현재 위치 지도에 표시</b><small>이 기기의 위치를 빨간 점으로 표시하며 숙소로 저장하지 않아요</small></div></button>
            <div className="search-results">
              {results.map((result, index) => <button key={`${result.lat}-${index}`} onClick={() => chooseHotel(result)}><MapPin size={17}/><div><b>{result.name || result.display_name.split(",")[0]}</b>{result.originalName && result.originalName !== result.name && <em>{result.originalName}</em>}<small>{result.display_name}</small>{result.originalAddress && result.originalAddress !== result.display_name && <small className="original-address">{result.originalAddress}</small>}</div></button>)}
            </div>
            <p className="privacy-note">숙소는 이 휴대폰에만 저장되며 다른 사람에게 공유되지 않아요.</p>
          </>
        )}

        {sheet === "route" && (
          <>
            <div className="sheet-heading"><div><small>출발지부터 도착지까지</small><h2>이동시간 확인</h2></div>{route && <div className="route-heading-actions"><div className="route-result-mini"><b>{route.minutes}분</b><small>{distanceText(route.distance)}</small></div><button className="clear-route" onClick={clearRoute}><X size={15}/>경로 닫기</button></div>}</div>
            <div className="route-mode">
              <button className={mode==="walk"?"active":""} onClick={()=>setMode("walk")}><Footprints size={17}/>도보</button>
              <button className={mode==="drive"?"active":""} onClick={()=>setMode("drive")}><Car size={17}/>자동차</button>
              <button className={mode==="transit"?"active":""} onClick={()=>setMode("transit")}><TrainFront size={17}/>대중교통</button>
            </div>
            <div className="route-place-search">
              <div className="route-search-target">
                <button className={routeSearchTarget==="origin"?"active":""} onClick={()=>setRouteSearchTarget("origin")}>출발지 검색</button>
                <button className={routeSearchTarget==="destination"?"active":""} onClick={()=>setRouteSearchTarget("destination")}>도착지 검색</button>
              </div>
              <div className="route-search-input">
                <Search size={17}/>
                <input value={routeSearchQuery} onChange={(e)=>setRouteSearchQuery(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&searchRoutePlaces()} placeholder="지역명 + 장소명 또는 주소"/>
                <button onClick={searchRoutePlaces}>{routeSearching ? "검색 중" : "검색"}</button>
              </div>
              {routeSearchResults.length > 0 && <div className="route-search-results">
                {routeSearchResults.map((point)=><button key={point.id} onClick={()=>chooseRouteSearchPlace(point)}><MapPin size={15}/><span><b>{point.name}</b>{point.originalName&&<em>{point.originalName}</em>}<small>{point.sub}</small></span></button>)}
              </div>}
              <small className="route-search-help">현재 여행 지역과 관계없이 일본 전역의 장소를 검색할 수 있어요.</small>
            </div>
            <div className="route-selects">
              <label><span className="origin-dot"/><div><small>출발지</small><select value={originId} onChange={(e)=>setOriginId(e.target.value)}>{currentLocation && <option value="current-location">내 현재 위치</option>}{areaPoint && <option value="area-center">{travelArea} 중심</option>}{isInuyamaArea && <option value="station">이누야마역</option>}{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}{routeSearchPoints.map((p)=><option key={`route-from-${p.id}`} value={p.id}>직접 검색 · {p.name}</option>)}{recommendationPool.map((p)=><option key={`region-from-${p.id}`} value={p.id}>{p.name}</option>)}{regionalSavedPlaces.map((p)=><option key={`saved-from-${p.id}`} value={p.id}>저장 · {p.name}</option>)}</select></div></label>
              <div className="route-line"/>
              <label><span className="dest-dot"/><div><small>도착지</small><select value={destinationId} onChange={(e)=>setDestinationId(e.target.value)}>{currentLocation && <option value="current-location">내 현재 위치</option>}{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}{areaPoint && <option value="area-center">{travelArea} 중심</option>}{isInuyamaArea && <option value="station">이누야마역</option>}{routeSearchPoints.map((p)=><option key={`route-to-${p.id}`} value={p.id}>직접 검색 · {p.name}</option>)}{recommendationPool.map((p)=><option key={`region-to-${p.id}`} value={p.id}>{p.name}</option>)}{regionalSavedPlaces.map((p)=><option key={`saved-to-${p.id}`} value={p.id}>저장 · {p.name}</option>)}</select></div></label>
            </div>
            <button className="calculate-button" onClick={getRoute} disabled={routeLoading}>{routeLoading ? "경로 계산 중…" : <><Navigation size={18}/> 이동시간 계산하기</>}</button>
            <a className="navigation-start" href={googleNavigationUrl()} target="_blank" rel="noreferrer"><Navigation size={18}/>Google 지도에서 {mode === "transit" ? "대중교통 경로" : "내비게이션"} 열기</a>
            {route && <div className="route-summary"><div><Clock3/><span><small>예상 이동시간</small><b>약 {route.minutes}분</b></span></div><div><Navigation/><span><small>이동거리</small><b>{distanceText(route.distance)}</b></span></div></div>}
            {route?.transitSteps && route.transitSteps.length > 0 && (
              <div className="transit-route">
                <div className="transit-route-head"><b>대중교통 상세 경로</b><span>환승 {route.transfers || 0}회</span></div>
                {route.transitSteps.map((step,index) => (
                  <div className="transit-step" key={`${step.line || step.instruction}-${index}`}>
                    <span className={step.line ? "ride" : "walk"}>{step.line ? (/버스|bus/i.test(step.vehicle || "") ? <Bus size={15}/> : <TrainFront size={15}/>) : <Footprints size={15}/>}</span>
                    <div>
                      <b>{step.line || step.instruction || "도보 이동"}</b>
                      {step.line && <small>{step.departure} → {step.arrival}{step.stops ? ` · ${step.stops}개 정류장` : ""}</small>}
                    </div>
                    <strong>{step.minutes}분</strong>
                  </div>
                ))}
                <p>운행시간·승강장·지연 정보는 출발 직전 Google 지도에서 다시 확인해 주세요.</p>
              </div>
            )}
            {routeError && <p className="route-error">{routeError}</p>}
          </>
        )}
      </section>

      {guideOpen && (
        <section className="guide-overlay">
          <div className="guide-toolbar">
            <button className="guide-close" onClick={() => setGuideOpen(false)}><X size={19}/></button>
            <div className="guide-date-fields">
              <label><span>출발</span><input type="date" value={guideStart} onChange={(e)=>setGuideStart(e.target.value)}/></label>
              <label><span>도착</span><input type="date" value={guideEnd} onChange={(e)=>setGuideEnd(e.target.value)}/></label>
            </div>
            <button onClick={downloadGuideImage} disabled={guideSaving}><Download size={17}/>{guideSaving ? "저장 중" : "이미지"}</button>
            <button onClick={() => window.print()}><Printer size={17}/>PDF</button>
          </div>
          <div className="guide-scroll">
            <div className="guide-recommend-panel">
              <div><small>관광·맛집·카페·쇼핑·온천을 한 번에 찾아드려요</small><b>지역 전체 추천 가이드 만들기</b></div>
              <input value={travelArea} onChange={(e)=>setTravelArea(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&buildAreaGuide()} placeholder="예: 나고야, 교토"/>
              <button onClick={()=>buildAreaGuide()} disabled={guideLoading}>{guideLoading ? "추천 장소 찾는 중…" : <><Search size={16}/>전체 추천 만들기</>}</button>
              {guideRecommendations.length > 0 && <p>{travelArea} 추천 장소 {guideRecommendations.length}곳과 저장한 장소를 함께 반영했습니다.</p>}
              {routeError && <p className="guide-error">{routeError}</p>}
            </div>
            <div className="travel-guide" ref={guideRef}>
              {(() => {
                const guidePlaces = guideRecommendations.length
                  ? [...regionalSavedPlaces, ...guideRecommendations].filter((point,index,items)=>items.findIndex((item)=>item.name===point.name)===index)
                  : regionalSavedPlaces.length ? regionalSavedPlaces : isInuyamaArea ? spots.slice(0,8) : [];
                const mapPlaces = guidePlaces.slice(0,20);
                const markerLabels = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                const markerParams = mapPlaces.map((point,index) =>
                  `&markers=${encodeURIComponent(`color:0x${point.color.replace("#","")}|label:${markerLabels[index] || "0"}|${point.lat},${point.lng}`)}`
                ).join("");
                const mapCenter = areaPoint ? `${areaPoint.lat},${areaPoint.lng}` : `${travelArea} 일본`;
                const staticMapUrl = mapsKey ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapCenter)}&zoom=13&size=640x300&scale=2&language=ko&region=JP&maptype=roadmap${markerParams}&key=${encodeURIComponent(mapsKey)}` : "";
                const dateText = guideStart ? `${guideStart.replaceAll("-",". ")}${guideEnd ? ` ~ ${guideEnd.replaceAll("-",". ")}` : ""}` : "여행 날짜를 입력해 주세요";
                return <>
                  <article className="guide-page guide-cover">
                    <div className="guide-title"><div><small>MY FAMILY TRAVEL GUIDE</small><h2>{travelArea || "일본"} 여행 지도</h2><p>저장한 장소를 한눈에 보는 우리 가족 맞춤 가이드</p></div><div className="guide-date"><CalendarDays/><span>{dateText}</span></div></div>
                    <div className="guide-map-board">
                      {staticMapUrl ? <img src={staticMapUrl} alt={`${travelArea} 추천 장소 지도`} crossOrigin="anonymous"/> : <div className="guide-map-loading">지도를 불러오는 중입니다.</div>}
                    </div>
                    <div className="guide-index">
                      {mapPlaces.map((point,index)=><div key={point.id}><b style={{background:point.color}}>{index+1}</b><span>{point.name}</span><small>{guideGroup(point)}</small></div>)}
                    </div>
                  </article>

                  <article className="guide-page">
                    <div className="guide-page-title"><small>CITY ROUTE & SPOT GUIDE</small><h2>{travelArea || "일본"} 추천 동선</h2><span>{dateText}</span></div>
                    <div className="route-ribbon">
                      {hotel && <div><Building2/><b>{hotel.name}</b></div>}
                      {guidePlaces.slice(0,6).map((point,index)=><div key={point.id}><span>{index+1}</span><b>{point.name}</b></div>)}
                    </div>
                    <h3 className="guide-section-label">저장한 장소</h3>
                    <div className="guide-card-grid">
                      {guidePlaces.slice(0,12).map((point,index)=><div className="guide-place-card" key={point.id}>
                        <div className="guide-card-head" style={{background:point.color}}><span>{index+1}</span><b>{point.name}</b></div>
                        {point.photoUrl && <img src={point.photoUrl} alt="" crossOrigin="anonymous"/>}
                        <small>{guideGroup(point)} · {point.placeType || point.sub}</small>
                        <p>{point.description}</p>
                        {point.recommendedMenu && <em>추천 메뉴 · {point.recommendedMenu}</em>}
                        {point.rating && <strong>★ {point.rating.toFixed(1)} · 후기 {point.reviewCount?.toLocaleString("ko-KR") || 0}개</strong>}
                        <footer><MapPin size={13}/>{point.sub}</footer>
                      </div>)}
                    </div>
                  </article>

                  <article id="guide-transit-map" className="guide-page guide-transit-page">
                    <div className="guide-page-title"><small>SUBWAY & RAIL GUIDE</small><h2>{travelArea} 지하철·기차 노선도</h2><span>{dateText}</span></div>
                    <p className="transit-intro">{hasSubwayArea ? `여행 동선과 관계없이 ${travelArea}에서 이용할 수 있는 주요 도시철도·지하철·기차 노선과 핵심 역을 정리했습니다.` : "등록된 도시철도 노선 정보가 없는 지역입니다. 현지 철도와 버스 노선은 Google 지도에서 확인해 주세요."}</p>
                    {hasSubwayArea ? <div className="subway-diagram">
                      {subwayLines.map((line)=><div className="subway-line" key={line.name}>
                        <b style={{background:line.color}}>{line.name}</b>
                        <div>{line.stations.map((stationName,index)=><span key={stationName}><i style={{borderColor:line.color}}/>{stationName}{index<line.stations.length-1&&<small>—</small>}</span>)}</div>
                      </div>)}
                    </div> : <div className="no-subway"><Navigation size={30}/><b>등록된 교통 노선도 없음</b><span>Google 지도에서 지역 철도와 버스 노선을 확인해 주세요.</span></div>}
                    <div className="transit-tips"><b>교통 이용 팁</b><span>교통카드를 사용하면 환승과 결제가 편리해요.</span><span>아이와 할머니가 함께 이동할 때는 엘리베이터 출구를 먼저 확인하세요.</span><span>정확한 막차와 운행 변경 정보는 방문 당일 확인해 주세요.</span></div>
                  </article>

                  <article className="guide-page guide-food-page">
                    <div className="guide-page-title"><small>LOCAL PICKS & FAMILY TIPS</small><h2>{travelArea || "일본"} 장소별 가이드</h2><span>{dateText}</span></div>
                    {["관광","맛집","카페","디저트","쇼핑","전통시장","주류","이자카야·술집","온천·휴식","아이와 함께","역사"].map((group) => {
                      const items = guidePlaces.filter((point)=>guideGroup(point)===group);
                      if (!items.length) return null;
                      return <section className="guide-group" key={group}><h3>{group}</h3><div>{items.map((point,index)=><article key={point.id}>
                        {point.photoUrl && <img src={point.photoUrl} alt="" crossOrigin="anonymous"/>}
                        <b>{index+1}. {point.name}</b><small>{point.hours || "방문 전 운영시간 확인"}</small><p>{point.description}</p>
                        {point.recommendedMenu && <em>추천 메뉴 · {point.recommendedMenu}</em>}
                      </article>)}</div></section>;
                    })}
                    <div className="guide-checklist"><h3>가족 여행 체크리스트</h3><p>□ 영업시간·휴무일 재확인</p><p>□ 아이와 할머니의 휴식 장소 확인</p><p>□ 비 오는 날 대체 동선 준비</p><p>□ 렌터카 이용 시 주차장 확인</p></div>
                  </article>
                </>;
              })()}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
