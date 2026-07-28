"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen, Building2, Bus, CalendarDays, Car, Clock3, Download, Footprints, LocateFixed,
  Heart, MapPin, Navigation, Plus, Printer, Search, Sparkles, TrainFront, Trash2, Users, X
} from "lucide-react";
import { toJpeg } from "html-to-image";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabase, hasSupabaseConfig } from "./lib/supabase-client";

type Category = "전체" | "관광" | "맛집" | "카페" | "디저트" | "쇼핑" | "편의점" | "소품샵" | "전통시장" | "주류" | "이자카야·술집" | "온천·휴식" | "아이와 함께" | "역사" | "숙박" | "교통";
type Point = {
  id: string; name: string; sub: string; category: Exclude<Category, "전체"> | "숙소" | "검색";
  lat: number; lng: number; color: string; description: string; tip: string; hours: string; query: string;
  listSummary?: string;
  placeType?: string; rating?: number; reviewCount?: number; businessStatus?: string;
  originalName?: string; originalAddress?: string;
  aiReason?: string; aiPrice?: string; aiFamousItems?: string[]; aiFamilyTip?: string; aiBestTime?: string;
  aiEvidence?: string; googlePriceRange?: string; googlePriceLevel?: string; reviewHighlights?: string[];
  aiRecommendedItems?: {name:string;price:string}[]; aiVisitTip?:string; aiParkingTip?:string;
  photoUrl?: string;
  recommendedMenu?: string;
  googlePlaceId?: string; phone?: string; website?: string; openNow?: boolean;
  weeklyHours?: string[]; reviewSummary?: string; serviceOptions?: string[];
  parkingOptions?: string[]; accessibility?: string[]; detailLoaded?: boolean;
  photoUrls?: string[]; paymentOptions?: string[]; photosPage?: string; reviewsPage?: string;
  detailedReviews?: {text:string;rating?:number;author?:string;time?:string}[];
  priorityShop?: boolean;
  detailAiLoaded?: boolean; detailAiSource?: string;
};
type Hotel = { name: string; address: string; lat: number; lng: number };
type Traveler = { id:string; relation:string; age:string };
type TripProfile = { travelers:Traveler[]; startDate:string; endDate:string };
type SearchResult = { display_name: string; lat: string; lon: string; name?: string; originalName?: string; originalAddress?: string };
type TransitStep = { instruction:string; line?:string; vehicle?:string; departure?:string; arrival?:string; stops?:number; minutes:number };
type RouteInfo = { minutes: number; distance: number; coordinates: [number, number][]; estimated?: boolean; transitSteps?:TransitStep[]; transfers?:number };
type AiGuidePlan = {
  title:string; overview:string;
  days:{day:number;title:string;stops:{id:string;time:string;reason:string}[];tips:string[]}[];
  familyTips:string[]; weatherBackup:string[];
  placeDetails?:{id:string;description?:string;items?:{name:string;price:string}[]}[];
};

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

const categories: Category[] = ["전체","관광","맛집","카페","디저트","쇼핑","편의점","소품샵","전통시장","주류","이자카야·술집","온천·휴식","아이와 함께","역사","숙박","교통"];
const initialAreaPoint: Point = {
  id:"area-center", name:"이누야마 중심", sub:"여행 지역 기준 위치", category:"검색",
  lat:35.3845, lng:136.9417, color:"#174da4", hours:"",
  description:"여행 지역 길찾기의 기본 출발점입니다.", tip:"", query:"이누야마 일본"
};

const categoryColors: Record<Category,string> = {
  "전체":"#247565","관광":"#275fbd","맛집":"#ef6a4c","카페":"#c56892","디저트":"#d36a9a",
  "쇼핑":"#e54473","편의점":"#168a55","소품샵":"#93701f","전통시장":"#d88b24","주류":"#8052a5","이자카야·술집":"#a65068",
  "온천·휴식":"#6b55b5","아이와 함께":"#2e9b78","역사":"#247565","숙박":"#7a5caf","교통":"#3f6bb1"
};

function distanceText(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function pointDistanceKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

type TravelCountry = "JP" | "KR";

function regionHintForArea(area:string):TravelCountry {
  return /서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|수원|용인|성남|고양|강릉|춘천|전주|여수|포항|한국|대한민국/i.test(area) ? "KR" : "JP";
}

function geocodeCountry(result:any, fallback:TravelCountry):TravelCountry {
  const code=result?.address_components?.find((item:any)=>item.types?.includes("country"))?.short_name;
  return code==="KR" ? "KR" : code==="JP" ? "JP" : fallback;
}

function matchesPlaceKeyword(place:any, query:string) {
  const normalize=(value:any)=>String(value||"").toLowerCase().replace(/[\s·ㆍ・\-_.()[\]]/g,"");
  const raw=normalize(query);
  const haystack=normalize([
    place.displayName,place.formattedAddress,place.primaryTypeDisplayName,
    ...(Array.isArray(place.types)?place.types:[])
  ].join(" "));
  const aliases:{test:RegExp;values:string[]}[]=[
    {test:/편의점/,values:["편의점","conveniencestore","세븐일레븐","7eleven","로손","lawson","패밀리마트","familymart","미니스톱","ministop","cu","gs25"]},
    {test:/카페|커피/,values:["카페","cafe","coffee","커피","喫茶"]},
    {test:/식당|맛집|음식|가족식당/,values:["식당","음식점","restaurant","food","레스토랑","요리"]},
    {test:/마트|슈퍼/,values:["마트","슈퍼","supermarket","grocery"]},
    {test:/약국|드럭/,values:["약국","pharmacy","drugstore","드럭스토어"]},
    {test:/주차장/,values:["주차장","parking"]},
    {test:/호텔|숙소/,values:["호텔","hotel","숙박","lodging","여관","료칸"]},
    {test:/관광|명소/,values:["관광","tourist","attraction","명소","박물관","공원","신사","사찰","성"]},
    {test:/디저트|베이커리|빵/,values:["디저트","dessert","베이커리","bakery","제과","빵"]},
    {test:/술집|이자카야|바/,values:["술집","이자카야","bar","pub","居酒屋"]}
  ];
  const alias=aliases.find(item=>item.test.test(query));
  if (alias) return alias.values.some(value=>haystack.includes(normalize(value)));
  const tokens=raw.split(/[,/]+/).filter(token=>token.length>=2 && !["근처","주변","가족","추천","인기"].includes(token));
  return tokens.length>0 && tokens.every(token=>haystack.includes(token));
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

function originalPlaceName(point: Point) {
  if (point.originalName && point.originalName !== point.name) return point.originalName;
  if (point.query && !point.query.startsWith("http") && containsJapanese(point.query)) return point.query;
  return "";
}

function placeDisplayName(point: Point) {
  const original = originalPlaceName(point);
  return original ? `${point.name} / ${original}` : point.name;
}

function localizePoint(point: Point, fallback = "저장한 현지 장소"): Point {
  if (point.category !== "검색") return point;
  const name = koreanPlaceText(point.name, point.name || fallback);
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
  const openingHours = place.currentOpeningHours || place.regularOpeningHours;
  const now=new Date();
  const koreanDays=["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];
  const weekday = openingHours?.weekdayDescriptions?.find((item:string)=>item.includes(koreanDays[now.getDay()]))
    || openingHours?.weekdayDescriptions?.[now.getDay()];
  const hours = koreanPlaceText(weekday, "영업시간은 방문 전에 확인해 주세요.");
  const nowMinutes=now.getHours()*60+now.getMinutes();
  const openNow = Array.isArray(openingHours?.periods) ? openingHours.periods.some((period:any)=>{
    const open=period.open, close=period.close;
    if (!open) return false;
    const openMinutes=(open.hour||0)*60+(open.minute||0);
    if (!close) return open.day===now.getDay();
    const closeMinutes=(close.hour||0)*60+(close.minute||0);
    if (open.day===close.day) return open.day===now.getDay() && nowMinutes>=openMinutes && nowMinutes<closeMinutes;
    return (open.day===now.getDay() && nowMinutes>=openMinutes) || (close.day===now.getDay() && nowMinutes<closeMinutes);
  }) : undefined;
  const summarySource = typeof place.editorialSummary === "string" ? place.editorialSummary : place.editorialSummary?.text;
  const ratingText = rating ? ` Google 이용자 평점은 ${rating.toFixed(1)}점${reviewCount ? `, 후기 ${reviewCount.toLocaleString("ko-KR")}개` : ""}입니다.` : "";
  const description = koreanPlaceText(summarySource, `${placeType}입니다.${ratingText}`);
  const localizedName = koreanPlaceText(rawName, "");
  const koreanName = localizedName || rawName || fallbackName;
  const googlePriceRange = place.priceRange?.startPrice
    ? `${place.priceRange.startPrice.toString()}${place.priceRange.endPrice ? ` ~ ${place.priceRange.endPrice.toString()}` : " 이상"}`
    : undefined;
  const priceLabels:Record<string,string> = {
    FREE:"무료",INEXPENSIVE:"저렴한 편",MODERATE:"보통 가격대",EXPENSIVE:"가격대 높음",VERY_EXPENSIVE:"고가"
  };
  const googlePriceLevel = place.priceLevel ? priceLabels[String(place.priceLevel).toUpperCase()] || String(place.priceLevel) : undefined;
  const reviewHighlights = Array.isArray(place.reviews)
    ? place.reviews.map((review:any)=>String(review.text || review.originalText || "").trim()).filter(Boolean).slice(0,5)
    : [];
  const summaryText = (value:any):string => {
    if (typeof value === "string") return value;
    if (typeof value?.text === "string") return value.text;
    if (typeof value?.text?.text === "string") return value.text.text;
    if (typeof value?.overview === "string") return value.overview;
    if (typeof value?.overview?.text === "string") return value.overview.text;
    return "";
  };
  const reviewSummary = koreanPlaceText(
    summaryText(place.reviewSummary) || summaryText(place.generativeSummary),
    ""
  );
  const serviceLabels:[string,string][] = [
    ["hasDineIn","매장 식사"],["hasTakeout","포장 가능"],["hasDelivery","배달 가능"],["isReservable","예약 가능"],
    ["hasOutdoorSeating","야외 좌석"],["servesBreakfast","아침식사"],["servesLunch","점심식사"],
    ["servesDinner","저녁식사"],["servesCoffee","커피"],["servesDessert","디저트"],
    ["servesBeer","맥주"],["servesCocktails","칵테일"],["isGoodForChildren","아이 동반 적합"],
    ["isGoodForGroups","단체 이용 적합"],["hasMenuForChildren","어린이 메뉴"],["hasRestroom","화장실"]
  ];
  const serviceOptions = serviceLabels.filter(([key])=>place[key] === true).map(([,label])=>label);
  const parkingLabels:[string,string][] = [
    ["hasFreeParkingLot","무료 주차장"],["hasPaidParkingLot","유료 주차장"],["hasFreeStreetParking","무료 노상주차"],
    ["hasPaidStreetParking","유료 노상주차"],["hasValetParking","발레파킹"],["hasFreeGarageParking","무료 실내주차"],
    ["hasPaidGarageParking","유료 실내주차"]
  ];
  const parkingOptions = parkingLabels.filter(([key])=>place.parkingOptions?.[key] === true).map(([,label])=>label);
  const accessibilityLabels:[string,string][] = [
    ["hasWheelchairAccessibleEntrance","휠체어 출입 가능"],["hasWheelchairAccessibleParking","휠체어 주차 가능"],
    ["hasWheelchairAccessibleRestroom","휠체어 화장실"],["hasWheelchairAccessibleSeating","휠체어 좌석"]
  ];
  const accessibility = accessibilityLabels.filter(([key])=>place[key] === true).map(([,label])=>label);
  const paymentLabels:[string,string][] = [
    ["acceptsCreditCards","신용카드"],["acceptsDebitCards","체크카드"],["acceptsNFC","모바일 결제"],["acceptsCashOnly","현금만 가능"]
  ];
  const paymentOptions = paymentLabels.filter(([key])=>place.paymentOptions?.[key] === true).map(([,label])=>label);
  const photoUrls = Array.isArray(place.photos)
    ? place.photos.slice(0,10).map((photo:any)=>photo.getURI?.({maxWidth:1000,maxHeight:760})).filter(Boolean)
    : [];
  const detailedReviews = Array.isArray(place.reviews) ? place.reviews.slice(0,5).map((review:any)=>({
    text:String(review.text || review.originalText || "").trim(),
    rating:typeof review.rating === "number" ? review.rating : undefined,
    author:review.authorAttribution?.displayName,
    time:review.relativePublishTimeDescription
  })).filter((review:any)=>review.text) : [];
  return {
    name:koreanName,
    originalName:rawName && rawName !== koreanName ? rawName : undefined,
    originalAddress:rawAddress && rawAddress !== address ? rawAddress : undefined,
    address, placeType, rating, reviewCount, hours, description,
    businessStatus:place.businessStatus === "OPERATIONAL" ? "정상 영업" : place.businessStatus === "CLOSED_TEMPORARILY" ? "임시 휴업" : place.businessStatus === "CLOSED_PERMANENTLY" ? "폐업" : undefined,
    googlePriceRange,googlePriceLevel,reviewHighlights,
    phone:place.nationalPhoneNumber || place.internationalPhoneNumber || undefined,
    website:place.websiteURI || place.websiteUri || undefined,
    openNow,
    weeklyHours:Array.isArray(openingHours?.weekdayDescriptions) ? openingHours.weekdayDescriptions : [],
    reviewSummary,serviceOptions,parkingOptions,accessibility,paymentOptions,photoUrls,detailedReviews,
    photosPage:place.googleMapsLinks?.photosURI, reviewsPage:place.googleMapsLinks?.reviewsURI
  };
}

function guideGroup(point:Point) {
  if (point.category !== "검색") return point.category;
  const type = point.placeType || "";
  if (["관광","맛집","카페","쇼핑","편의점","소품샵","주류","이자카야·술집","온천·휴식","디저트","전통시장","아이와 함께"].includes(type)) return type;
  if (/식당|음식|라멘|요리|레스토랑|스시|우동|소바|돈카츠/.test(type)) return "맛집";
  if (/카페|커피|디저트|제과|베이커리/.test(type)) return "카페";
  if (/소품|잡화|기념품|공예|편집숍/.test(type)) return "소품샵";
  if (/편의점|convenience/i.test(type)) return "편의점";
  if (/쇼핑|백화점|상점|시장|마트|슈퍼|약국|드럭스토어/.test(type)) return "쇼핑";
  if (/주류|술|사케|와인/.test(type)) return "주류";
  if (/이자카야|바$|나이트클럽|술집|펍/.test(type)) return "이자카야·술집";
  if (/온천|스파|목욕/.test(type)) return "온천·휴식";
  if (/호텔|숙박|료칸|리조트|여관|게스트하우스/.test(type)) return "숙박";
  if (/역$|기차역|지하철역|버스 정류장|공항|터미널|주차장/.test(type)) return "교통";
  return "관광";
}

function pointColor(point:Point) {
  if (point.id === "current-location") return "#e53935";
  if (point.category === "숙소") return "#7a5caf";
  const group = guideGroup(point);
  return categoryColors[group as Category] || point.color || categoryColors["관광"];
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

function priceGuideFor(type:string,country:TravelCountry="JP") {
  if (country==="KR") {
    if (type === "맛집") return "약 ₩8,000~25,000 / 1인";
    if (type === "카페" || type === "디저트") return "약 ₩4,000~12,000 / 1인";
    if (type === "이자카야·술집") return "약 ₩20,000~50,000 / 1인";
    if (type === "주류") return "약 ₩5,000~40,000 / 상품";
    if (type === "편의점") return "약 ₩1,000~10,000 / 상품";
    if (type === "온천·휴식") return "약 ₩10,000~30,000 / 1인";
  }
  if (type === "맛집") return "약 ¥800~2,500 / 1인";
  if (type === "카페" || type === "디저트") return "약 ¥500~1,500 / 1인";
  if (type === "이자카야·술집") return "약 ¥2,000~4,500 / 1인";
  if (type === "주류") return "약 ¥800~3,000 / 상품";
  if (type === "편의점") return "약 ¥100~1,000 / 상품";
  if (type === "쇼핑" || type === "소품샵" || type === "전통시장") return "상품별 가격 상이";
  if (type === "온천·휴식") return "약 ¥800~2,500 / 1인";
  if (type === "숙박") return "객실 유형과 날짜에 따라 상이";
  if (type === "교통") return "이용 구간에 따라 상이";
  return "입장료는 방문 전 확인";
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
  const supabase = useRef(createBrowserSupabase());
  const mapEl = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const initialGuideLoadedRef = useRef(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [mapsKey, setMapsKey] = useState("");
  const [category, setCategory] = useState<Category>("전체");
  const [selected, setSelected] = useState<Point>(initialAreaPoint);
  const [placeDetailOpen, setPlaceDetailOpen] = useState(false);
  const [placeDetailLoading, setPlaceDetailLoading] = useState(false);
  const [placeInsightLoading, setPlaceInsightLoading] = useState(false);
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
  const [travelCountry, setTravelCountry] = useState<TravelCountry>("JP");
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
  const [aiOverview, setAiOverview] = useState("");
  const [aiGuidePlan, setAiGuidePlan] = useState<AiGuidePlan | null>(null);
  const [aiGuideArea, setAiGuideArea] = useState("");
  const aiGuidePlanRef = useRef<AiGuidePlan | null>(null);
  const aiGuideAreaRef = useRef("");
  const [aiGuideLoading, setAiGuideLoading] = useState(false);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideRecommendations, setGuideRecommendations] = useState<Point[]>([]);
  const [recommendationError, setRecommendationError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [cloudSaving, setCloudSaving] = useState(false);
  const [areaPoint, setAreaPoint] = useState<Point | null>(initialAreaPoint);
  const [areaBounds, setAreaBounds] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<Point | null>(null);
  const travelAreaRef=useRef(travelArea);
  const areaPointRef=useRef<Point|null>(areaPoint);
  const areaBoundsRef=useRef<any>(areaBounds);
  const aiCacheKey = (country:TravelCountry=travelCountry) => `ai-trip-guide-v16:${JSON.stringify({
    area:travelArea.trim(),country,start:guideStart,end:guideEnd,
    travelers:travelers.map(({relation,age})=>[relation,age])
  })}`;

  const hotelPoint: Point | null = hotel ? {
    id:"hotel", name:hotel.name, sub:hotel.address, category:"숙소", lat:hotel.lat, lng:hotel.lng,
    color:"#7a5caf", hours:"", description:"내가 등록한 숙소", tip:"", query:hotel.address
  } : null;
  const allPoints = [station, ...(areaPoint ? [areaPoint] : []), ...(currentLocation ? [currentLocation] : []), ...(hotelPoint ? [hotelPoint] : []), ...spots, ...savedPlaces, ...placeResults, ...guideRecommendations, ...routeSearchPoints];
  const pointById = (id: string) => allPoints.find((p) => p.id === id) || areaPoint || station;
  const authHeaders = (): Record<string, string> =>
    session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  const currentTripPayload = () => ({
    hotel,
    savedPlaces,
    guideStart,
    guideEnd,
    travelers,
    travelArea,
    travelCountry,
  });
  const saveTripToCloud = async (override?: Partial<ReturnType<typeof currentTripPayload>>) => {
    if (!session) return;
    setCloudSaving(true);
    try {
      await fetch("/api/trips", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ trip: { ...currentTripPayload(), ...override } }),
      });
    } finally {
      setCloudSaving(false);
    }
  };
  const signInWithEmail = async () => {
    if (!supabase.current || !authEmail.trim()) {
      setAuthMessage("Set Supabase env first.");
      return;
    }
    const { error } = await supabase.current.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setAuthMessage(error ? error.message : "Check your email link.");
  };
  const signOut = async () => {
    await supabase.current?.auth.signOut();
    setSession(null);
    setAuthMessage("");
  };

  useEffect(() => {
    if (!supabase.current) return;
    supabase.current.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.current.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    window.setTimeout(() => {
      fetch("/api/trips", { headers: authHeaders(), cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (cancelled || !data?.trip) return;
          if (data.trip.hotel) setHotel(data.trip.hotel);
          if (Array.isArray(data.trip.savedPlaces)) setSavedPlaces(data.trip.savedPlaces);
          if (data.trip.guideStart) setGuideStart(data.trip.guideStart);
          if (data.trip.guideEnd) setGuideEnd(data.trip.guideEnd);
          if (Array.isArray(data.trip.travelers)) setTravelers(data.trip.travelers);
          if (data.trip.travelArea) setTravelArea(data.trip.travelArea);
          if (data.trip.travelCountry === "KR" || data.trip.travelCountry === "JP") setTravelCountry(data.trip.travelCountry);
          setTripSaved(true);
        })
        .catch(() => undefined);
    }, 0);
    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);
  const isInuyamaArea = /이누야마|犬山/i.test(travelArea);

  useEffect(()=>{
    travelAreaRef.current=travelArea;
    areaPointRef.current=areaPoint;
    areaBoundsRef.current=areaBounds;
  },[travelArea,areaPoint,areaBounds]);

  useEffect(() => {
    if (!placeDetailOpen || !googleReady || !selected.googlePlaceId || selected.detailLoaded) return;
    let cancelled=false;
    const loadDetails=async()=>{
      setPlaceDetailLoading(true);
      try {
        const google=(window as any).google;
        const {Place}=await google.maps.importLibrary("places");
        const place=new Place({id:selected.googlePlaceId,requestedLanguage:"ko",requestedRegion:travelCountry});
        const mergePlace=(detailLoaded=false)=>{
          if (cancelled) return;
          const details=googlePlaceDetails(place,selected.name);
          const enriched:Point={
            ...selected,...details,sub:details.address,detailLoaded,
            query:place.googleMapsURI || selected.query,
            photoUrl:details.photoUrls?.[0] || selected.photoUrl
          };
          setSelected(enriched);
          const replace=(items:Point[])=>items.map((item)=>item.id===enriched.id?enriched:item);
          setPlaceResults(replace);
          setGuideRecommendations(replace);
          setSavedPlaces((items)=>{
            if (!items.some((item)=>item.id===enriched.id)) return items;
            const next=replace(items);
            localStorage.setItem("saved-google-places",JSON.stringify(next));
            return next;
          });
        };
        await place.fetchFields({fields:[
          "id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName",
          "rating","userRatingCount","businessStatus","photos","priceLevel","priceRange",
          "currentOpeningHours","regularOpeningHours","nationalPhoneNumber","internationalPhoneNumber","websiteURI"
        ]});
        mergePlace();
        try {
          await place.fetchFields({fields:[
            "reviews","editorialSummary","generativeSummary","reviewSummary","googleMapsLinks",
            "parkingOptions","paymentOptions","hasDineIn","hasTakeout","hasDelivery","isReservable",
            "hasOutdoorSeating","hasRestroom","isGoodForChildren","isGoodForGroups","hasMenuForChildren",
            "servesBreakfast","servesLunch","servesDinner","servesCoffee","servesDessert","servesBeer",
            "servesCocktails","hasWheelchairAccessibleEntrance","hasWheelchairAccessibleParking",
            "hasWheelchairAccessibleRestroom","hasWheelchairAccessibleSeating"
          ]});
          mergePlace(true);
        } catch {}
        if (!cancelled && !place.reviews) mergePlace(true);
      } catch {
        if (!cancelled) setSelected((current)=>current.id===selected.id?{...current,detailLoaded:true}:current);
      } finally {
        if (!cancelled) setPlaceDetailLoading(false);
      }
    };
    void loadDetails();
    return()=>{cancelled=true;};
  },[placeDetailOpen,googleReady,selected.id,selected.googlePlaceId,selected.detailLoaded,travelCountry]);

  useEffect(()=>{
    if (!placeDetailOpen || !selected.detailLoaded || !selected.googlePlaceId || selected.detailAiLoaded) return;
    const group=guideGroup(selected);
    if (!["맛집","카페","디저트","쇼핑","편의점","소품샵","전통시장","주류","이자카야·술집"].includes(group)) return;
    let cancelled=false;
    const applyInsight=(detail:any)=>{
      if (cancelled) return;
      const items=Array.isArray(detail?.items)?detail.items:[];
      const enriched:Point={
        ...selected,
        description:detail?.description || selected.description,
        listSummary:detail?.description || selected.listSummary || selected.description,
        aiRecommendedItems:items.length?items:selected.aiRecommendedItems,
        aiFamousItems:items.length?items.map((item:any)=>String(item.name)).slice(0,3):selected.aiFamousItems,
        recommendedMenu:items.length?items.map((item:any)=>String(item.name)).join(" · "):selected.recommendedMenu,
        detailAiSource:detail?.source || "Google 장소 정보",
        detailAiLoaded:true
      };
      setSelected(enriched);
      const replace=(points:Point[])=>points.map((point)=>point.id===enriched.id?enriched:point);
      setPlaceResults(replace);
      setGuideRecommendations(replace);
      setSavedPlaces(points=>{
        if (!points.some(point=>point.id===enriched.id)) return points;
        const next=replace(points);
        localStorage.setItem("inuyama-saved-places",JSON.stringify(next));
        return next;
      });
    };
    const loadInsight=async()=>{
      const cacheKey=`ai-place-detail-v3:${travelCountry}:${selected.googlePlaceId}`;
      try {
        const cached=JSON.parse(localStorage.getItem(cacheKey)||"null");
        if (cached?.createdAt>Date.now()-7*24*60*60*1000 && cached.detail) {
          applyInsight(cached.detail);
          return;
        }
      } catch {}
      setPlaceInsightLoading(true);
      try {
        const response=await fetch("/api/ai-place-detail",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            name:selected.name,originalName:selected.originalName,type:selected.placeType||group,
            googleSummary:selected.description,
            googlePrice:selected.googlePriceRange||selected.googlePriceLevel,
            country:travelCountry,
            currency:travelCountry==="KR"?"KRW (₩)":"JPY (¥)",
            reviews:selected.detailedReviews?.map(review=>review.text)||selected.reviewHighlights||[]
          })
        });
        const data=await response.json();
        if (!response.ok || !data.detail) throw new Error();
        try {localStorage.setItem(cacheKey,JSON.stringify({createdAt:Date.now(),detail:data.detail}));} catch {}
        applyInsight(data.detail);
      } catch {
        if (!cancelled) setSelected(current=>current.id===selected.id?{...current,detailAiLoaded:true}:current);
      } finally {
        if (!cancelled) setPlaceInsightLoading(false);
      }
    };
    void loadInsight();
    return()=>{cancelled=true;};
  },[placeDetailOpen,selected.id,selected.googlePlaceId,selected.detailLoaded,selected.detailAiLoaded,travelCountry]);

  useEffect(() => {
    if (!placeDetailOpen) return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{
      document.body.style.overflow=previousOverflow;
    };
  },[placeDetailOpen]);

  const isPointInCurrentArea = (point:{lat:number;lng:number}) => {
    const center = areaPoint || (isInuyamaArea ? station : null);
    const insideBounds = areaBounds?.contains
      ? areaBounds.contains({ lat:point.lat, lng:point.lng })
      : true;
    const insideRadius = center ? pointDistanceKm(center, point) <= 20 : true;
    return insideBounds && insideRadius;
  };
  const recommendationPool = guideRecommendations;
  const regionalSavedPlaces = savedPlaces.filter(isPointInCurrentArea);
  const regionalPlaceResults = placeResults.filter(isPointInCurrentArea);
  const combinedPlacePool = [...regionalPlaceResults, ...recommendationPool]
    .filter((point,index,items)=>items.findIndex((item)=>item.id===point.id || item.name===point.name)===index);
  const visibleSpots = category === "전체" ? combinedPlacePool : combinedPlacePool.filter((p) => guideGroup(p) === category);
  const recommendationCenter = areaPoint || (isInuyamaArea ? station : null);
  const sortedVisibleSpots = [...visibleSpots].sort((a,b)=>{
    if (!recommendationCenter) return Number(b.rating || 0)-Number(a.rating || 0);
    return pointDistanceKm(recommendationCenter,a)-pointDistanceKm(recommendationCenter,b);
  });
  const listedSpots = category === "전체" ? sortedVisibleSpots.slice(0,15) : sortedVisibleSpots;
  const recommendationPending = guideLoading && !guideRecommendations.length && !recommendationError;
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
    const savedCountry=localStorage.getItem("travel-search-country");
    if (savedCountry==="KR"||savedCountry==="JP") setTravelCountry(savedCountry);
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
          const place = new Place({ id:event.placeId,requestedLanguage:"ko",requestedRegion:travelCountry });
          await place.fetchFields({ fields:[
            "id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName",
            "rating","userRatingCount","businessStatus","photos","priceLevel","priceRange",
            "currentOpeningHours","regularOpeningHours"
          ] });
          if (!place.location) return;
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
            listSummary:details.description,
            tip:"영업시간과 가족 이동 동선을 확인한 뒤 방문해 주세요.",
            query:place.googleMapsURI || place.displayName || ""
            ,placeType:details.placeType, rating:details.rating, reviewCount:details.reviewCount, businessStatus:details.businessStatus,
            originalName:details.originalName, originalAddress:details.originalAddress
            ,googlePriceRange:details.googlePriceRange,googlePriceLevel:details.googlePriceLevel,reviewHighlights:details.reviewHighlights
            ,googlePlaceId:place.id,phone:details.phone,website:details.website,openNow:details.openNow,
            weeklyHours:details.weeklyHours,reviewSummary:details.reviewSummary,serviceOptions:details.serviceOptions,
            parkingOptions:details.parkingOptions,accessibility:details.accessibility,paymentOptions:details.paymentOptions,
            photoUrls:details.photoUrls,detailedReviews:details.detailedReviews,photosPage:details.photosPage,reviewsPage:details.reviewsPage,
            photoUrl:details.photoUrls?.[0] || place.photos?.[0]?.getURI?.({maxWidth:900,maxHeight:560})
          };
          setPlaceResults((current) => current.some((item) => item.id === point.id)
            ? current.map((item)=>item.id===point.id?mergePointData(item,point):item)
            : [point, ...current]
          );
          setSelected(point);
          setSheet("places");
          setSheetCollapsed(false);
          setPlaceDetailOpen(true);
          void localizePointNames([point]).then(([localized])=>{
            if (!localized) return;
            setPlaceResults((current)=>current.map((item)=>item.id===localized.id?localized:item));
            setSelected((current)=>current.id===localized.id?localized:current);
          });
        } catch {
          setRouteError("선택한 장소 정보를 불러오지 못했어요.");
        }
      });
    }
    markerLayerRef.current.forEach((marker) => marker.setMap(null));
    markerLayerRef.current = [];
    const markerPoints = [...(isInuyamaArea ? [station] : areaPoint ? [areaPoint] : []), ...(currentLocation ? [currentLocation] : []), ...(hotelPoint ? [hotelPoint] : []), ...combinedPlacePool, ...savedPlaces, ...placeResults, ...routeSearchPoints]
      .filter((point, index, items) => items.findIndex((item) => item.id === point.id) === index);
    markerPoints.forEach((point) => {
      const isCurrentLocation = point.id === "current-location";
      const marker = new google.maps.Marker({
        map:mapRef.current,
        position:{ lat:point.lat, lng:point.lng },
        title:placeDisplayName(point),
        label:{
          text:isCurrentLocation ? "현재" : point.category === "숙소" ? "숙소" : point.id === "station" ? "역" : point.name.slice(0,2),
          color:"#ffffff",
          fontSize:"10px",
          fontWeight:"800"
        },
        icon:{
          path:google.maps.SymbolPath.CIRCLE,
          fillColor:pointColor(point),
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
        setPlaceDetailOpen(true);
        mapRef.current.panTo({ lat:point.lat, lng:point.lng });
      });
      markerLayerRef.current.push(marker);
    });
  }, [googleReady, category, selected.id, hotel, placeResults, savedPlaces, guideRecommendations, areaPoint, currentLocation, travelArea, travelCountry, routeSearchPoints]);

  const chooseHotel = (result: SearchResult) => {
    const next = {
      name: result.name || result.display_name.split(",")[0],
      address: result.display_name,
      lat: Number(result.lat), lng: Number(result.lon)
    };
    setHotel(next);
    localStorage.setItem("inuyama-hotel", JSON.stringify(next));
    void saveTripToCloud({ hotel: next });
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
    void saveTripToCloud({ savedPlaces: next });
  };

  const toggleSavedPlace = (point: Point) => {
    const exists = savedPlaces.some((item) => item.id === point.id);
    persistSavedPlaces(exists ? savedPlaces.filter((item) => item.id !== point.id) : [...savedPlaces, point]);
  };

  const mergePointData = (current:Point, incoming:Point) => ({
    ...current,
    ...incoming,
    listSummary:incoming.listSummary || incoming.description || current.listSummary || current.description,
    photoUrl:incoming.photoUrl || current.photoUrl,
    photoUrls:incoming.photoUrls?.length ? incoming.photoUrls : current.photoUrls,
    detailLoaded:current.detailLoaded || incoming.detailLoaded,
    detailAiLoaded:current.detailAiLoaded || incoming.detailAiLoaded,
    phone:incoming.phone || current.phone,
    website:incoming.website || current.website,
    weeklyHours:incoming.weeklyHours?.length ? incoming.weeklyHours : current.weeklyHours,
    detailedReviews:incoming.detailedReviews?.length ? incoming.detailedReviews : current.detailedReviews,
    serviceOptions:incoming.serviceOptions?.length ? incoming.serviceOptions : current.serviceOptions,
    parkingOptions:incoming.parkingOptions?.length ? incoming.parkingOptions : current.parkingOptions,
    accessibility:incoming.accessibility?.length ? incoming.accessibility : current.accessibility,
    paymentOptions:incoming.paymentOptions?.length ? incoming.paymentOptions : current.paymentOptions,
    reviewSummary:incoming.reviewSummary || current.reviewSummary,
    photosPage:incoming.photosPage || current.photosPage,
    reviewsPage:incoming.reviewsPage || current.reviewsPage
  });

  const placeSummary = (point:Point) => point.listSummary || point.description;

  const mergePointEverywhere = (enriched:Point) => {
    const replace=(items:Point[])=>items.map((item)=>item.id===enriched.id?mergePointData(item,enriched):item);
    setSelected((current)=>current.id===enriched.id?mergePointData(current,enriched):current);
    setPlaceResults(replace);
    setGuideRecommendations(replace);
    setSavedPlaces((items)=>{
      if (!items.some((item)=>item.id===enriched.id)) return items;
      const next=replace(items);
      localStorage.setItem("inuyama-saved-places",JSON.stringify(next));
      return next;
    });
  };

  const localizePointNames = async (points:Point[]) => {
    const cached = new Map<string,string>();
    points.forEach((point)=>{
      const value = localStorage.getItem(`place-name-ko-v2:${point.id}`);
      if (value && !containsJapanese(value) && /[가-힣]/.test(value)) cached.set(point.id,value);
    });
    const missing = points.filter((point)=>!cached.has(point.id) && (
      containsJapanese(point.originalName || point.name)
      || Boolean(point.googlePlaceId && !/[가-힣]/.test(point.name))
      || Boolean(point.originalName && point.originalName !== point.name)
    ));
    if (missing.length) {
      try {
        const response = await fetch("/api/ai-localize",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({places:missing.map((point)=>({id:point.id,name:point.originalName || point.name}))})
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.places)) {
          data.places.forEach((item:any)=>{
            const name=String(item.koreanName||"").trim();
            if (name && !containsJapanese(name) && !/일본\s*(음식점|식당|카페|관광|장소)|현지\s*(음식점|식당|카페|장소)/.test(name)) {
              cached.set(item.id,name);
              localStorage.setItem(`place-name-ko-v2:${item.id}`,name);
            }
          });
        }
      } catch {}
    }
    return points.map((point)=>{
      const name=cached.get(point.id);
      if (!name) return point;
      const originalName=point.originalName || point.name;
      return {...point,name,originalName:originalName!==name?originalName:point.originalName};
    });
  };

  const hydrateRecommendationPreviews = async (points:Point[], limit=60) => {
    if (!googleReady || !points.length) return;
    const targets=points.filter((point)=>point.googlePlaceId && !point.detailLoaded).slice(0,limit);
    if (!targets.length) return;
    try {
      const google=(window as any).google;
      const {Place}=await google.maps.importLibrary("places");
      const hydrated=(await Promise.allSettled(targets.map(async(point)=>{
        const place=new Place({id:point.googlePlaceId,requestedLanguage:"ko",requestedRegion:travelCountry});
        await place.fetchFields({fields:[
          "id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName",
          "rating","userRatingCount","businessStatus","photos","priceLevel","priceRange",
          "currentOpeningHours","regularOpeningHours","nationalPhoneNumber","internationalPhoneNumber","websiteURI",
          "editorialSummary","generativeSummary","reviewSummary","googleMapsLinks","reviews",
          "parkingOptions","paymentOptions","hasDineIn","hasTakeout","hasDelivery","isReservable",
          "hasOutdoorSeating","hasRestroom","isGoodForChildren","isGoodForGroups","hasMenuForChildren",
          "servesBreakfast","servesLunch","servesDinner","servesCoffee","servesDessert","servesBeer",
          "servesCocktails","hasWheelchairAccessibleEntrance","hasWheelchairAccessibleParking",
          "hasWheelchairAccessibleRestroom","hasWheelchairAccessibleSeating"
        ]});
        const details=googlePlaceDetails(place,point.name);
        return {
          ...point,...details,
          sub:details.address,
          detailLoaded:true,
          query:place.googleMapsURI || point.query,
          photoUrl:details.photoUrls?.[0] || point.photoUrl
        } as Point;
      }))).flatMap((result)=>result.status==="fulfilled"?[result.value]:[]);
      const localized=await localizePointNames(hydrated);
      localized.forEach(mergePointEverywhere);
    } catch {}
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
        textQuery:`${query} ${travelArea.trim() || (travelCountry==="KR"?"대한민국":"일본")}`,
        fields:["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","types","rating","userRatingCount","regularOpeningHours","businessStatus","photos","priceLevel","priceRange"],
        ...(areaBounds ? { locationRestriction:areaBounds } : center ? { locationBias:{ center, radius:7000 } } : {}),
        language:"ko",
        maxResultCount:12
      });
      const quickCategorySearch = Boolean(queryOverride);
      const next:Point[] = places.filter((place:any) => {
        if (!place.location) return false;
        if (!quickCategorySearch && !matchesPlaceKeyword(place, query)) return false;
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
        ,googlePriceRange:details.googlePriceRange,googlePriceLevel:details.googlePriceLevel,reviewHighlights:details.reviewHighlights
        ,googlePlaceId:place.id,photoUrl:place.photos?.[0]?.getURI?.({maxWidth:900,maxHeight:560})
      }});
      setPlaceResults(next);
      if (next[0]) setSelected(next[0]);
      void localizePointNames(next).then((localized)=>{
        setPlaceResults(localized);
        setSelected((current)=>localized.find((point)=>point.id===current.id) || current);
      });
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
      const hint=regionHintForArea(travelArea.trim());
      const { results:areaResults } = await geocoder.geocode({
        address:`${travelArea.trim()} ${hint==="KR"?"대한민국":"일본"}`, language:"ko", region:hint
      });
      if (!areaResults?.[0]) throw new Error();
      const country=geocodeCountry(areaResults[0],hint);
      setTravelCountry(country);
      localStorage.setItem("travel-search-country",country);
      mapRef.current?.setCenter(areaResults[0].geometry.location);
      mapRef.current?.setZoom(13);
      setAreaBounds(areaResults[0].geometry.viewport);
      localStorage.setItem("travel-search-area", travelArea.trim());
      setPlaceResults([]);
      setGuideRecommendations([]);
      setAiGuidePlan(null);
      setAiGuideArea("");
      aiGuidePlanRef.current=null;
      aiGuideAreaRef.current="";
      setCategory("전체");
      await buildAreaGuide(areaResults[0].geometry.location, areaResults[0].geometry.viewport, country);
    } catch {
      setRouteError("지역을 찾지 못했어요. 예: 교토, 오사카, 삿포로처럼 입력해 주세요.");
    } finally {
      setAreaMoving(false);
    }
  };

  const buildAreaGuide = async (providedCenter?: any, providedBounds?: any, providedCountry?:TravelCountry) => {
    if (!travelArea.trim()) return;
    let fallbackPoints:Point[] = [];
    setGuideLoading(true);
    setGuideRecommendations([]);
    setRecommendationError("");
    setPlaceResults([]);
    setCategory("전체");
    setRouteError("");
    try {
      const google = (window as any).google;
      let center = providedCenter;
      let bounds = providedBounds;
      let activeCountry=providedCountry || travelCountry || regionHintForArea(travelArea.trim());
      if (!center?.lat) {
        const geocoder = new google.maps.Geocoder();
        const hint=regionHintForArea(travelArea.trim());
        const { results:areaResults } = await geocoder.geocode({
          address:`${travelArea.trim()} ${hint==="KR"?"대한민국":"일본"}`, language:"ko", region:hint
        });
        if (!areaResults?.[0]) throw new Error();
        activeCountry=geocodeCountry(areaResults[0],hint);
        center = areaResults[0].geometry.location;
        bounds = areaResults[0].geometry.viewport;
      }
      setTravelCountry(activeCountry);
      localStorage.setItem("travel-search-country",activeCountry);
      if (!bounds) throw new Error();
      setAreaBounds(bounds);
      mapRef.current?.setCenter(center);
      mapRef.current?.setZoom(13);
      const centerLat = typeof center.lat === "function" ? center.lat() : center.lat;
      const centerLng = typeof center.lng === "function" ? center.lng() : center.lng;
      const nextAreaPoint:Point = {
        id:"area-center", name:`${travelArea.trim()} 중심`, sub:`${travelArea.trim()} 여행 기준 위치`,
        category:"검색", lat:centerLat, lng:centerLng, color:"#174da4", hours:"",
        description:`${travelArea.trim()} 지역 길찾기의 기본 출발점입니다.`, tip:"",
        query:`${travelArea.trim()} ${activeCountry==="KR"?"대한민국":"일본"}`
      };
      setAreaPoint(nextAreaPoint);
      setSelected(nextAreaPoint);
      setOriginId("area-center");
      localStorage.setItem("travel-search-area", travelArea.trim());
      try {
        const cached = JSON.parse(localStorage.getItem(aiCacheKey(activeCountry)) || "null");
        if (cached?.createdAt > Date.now()-12*60*60*1000 && Array.isArray(cached.recommendations) && cached.recommendations.length) {
          setAiOverview(cached.overview || "");
          setGuideRecommendations(cached.recommendations);
          setAiGuideArea(cached.area || travelArea.trim());
          aiGuideAreaRef.current=cached.area || travelArea.trim();
          setDestinationId(cached.recommendations[0].id);
          void hydrateRecommendationPreviews(cached.recommendations);
          return cached.recommendations as Point[];
        }
      } catch {}
      const { Place } = await google.maps.importLibrary("places");
      const types = [
        { label:"관광", query:"대표 관광지 명소", color:"#275fbd" },
        { label:"맛집", query:"현지인 인기 맛집", color:"#ef6a4c" },
        { label:"카페", query:"인기 카페 디저트", color:"#c56892" },
        { label:"쇼핑", query:"쇼핑 백화점 대형 할인점 드럭스토어", color:"#e54473" },
        { label:"편의점", query:"편의점", color:"#168a55" },
        { label:"소품샵", query:"잡화점 소품샵 기념품 공예 편집숍", color:"#93701f" },
        { label:"주류", query:activeCountry==="KR"?"주류 전문점 와인 위스키":"사케 위스키 주류 전문점", color:"#8052a5" },
        { label:"이자카야·술집", query:"현지인 이자카야 술집", color:"#a65068" },
        { label:"온천·휴식", query:"온천 스파 가족 휴식", color:"#6b55b5" },
        { label:"디저트", query:"유명 디저트 베이커리", color:"#d36a9a" },
        { label:"전통시장", query:"전통시장 상점가", color:"#d88b24" },
        { label:"아이와 함께", query:"아이와 가족 체험 명소", color:"#2e9b78" }
      ];
      const batches = await Promise.allSettled(types.map(async (type) => {
        const resultLimit=type.label==="편의점"?20:10;
        const keepLimit=type.label==="편의점"?20:5;
        const fields = ["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","rating","userRatingCount","regularOpeningHours","businessStatus","photos","priceLevel","priceRange"];
        const { places:localPlaces } = await Place.searchByText({
          textQuery:`${travelArea.trim()} ${type.query}`,
          fields,
          locationRestriction:bounds,
          language:"ko",
          maxResultCount:resultLimit
        });
        const nearbyLocal = localPlaces.filter((place:any)=>{
          if (!place.location || !bounds.contains(place.location)) return false;
          return pointDistanceKm(
            { lat:centerLat, lng:centerLng },
            { lat:place.location.lat(), lng:place.location.lng() }
          ) <= 20;
        });
        let places = nearbyLocal;
        if (places.length < 5) {
          const { places:expandedPlaces } = await Place.searchByText({
            textQuery:`${travelArea.trim()} 인근 ${type.query}`,
            fields,
            locationBias:{center:{lat:centerLat,lng:centerLng},radius:30000},
            language:"ko",
            maxResultCount:resultLimit
          });
          places = [...nearbyLocal,...expandedPlaces.filter((place:any)=>{
            if (!place.location) return false;
            return pointDistanceKm(
              { lat:centerLat, lng:centerLng },
              { lat:place.location.lat(), lng:place.location.lng() }
            ) <= 30;
          })].filter((place:any,index:number,items:any[])=>items.findIndex((item:any)=>item.id===place.id)===index);
        }
        return places.slice(0,keepLimit).map((place:any,index:number) => {
          const details = googlePlaceDetails(place, `${travelArea.trim()} ${type.label} 추천 ${index+1}`);
          return {
            id:`guide-${type.label}-${place.id}`,
            name:details.name, sub:details.address, category:"검색" as const,
            lat:place.location.lat(), lng:place.location.lng(), color:type.color,
            hours:details.hours, description:details.description, listSummary:details.description,
            tip:`${type.label} 분야의 평점과 인지도를 참고한 추천 장소예요.`,
            query:place.googleMapsURI || place.displayName || "",
            placeType:type.label, rating:details.rating, reviewCount:details.reviewCount,
            businessStatus:details.businessStatus,
            originalName:details.originalName, originalAddress:details.originalAddress,
            googlePriceRange:details.googlePriceRange,googlePriceLevel:details.googlePriceLevel,reviewHighlights:details.reviewHighlights,
            photoUrl:place.photos?.[0]?.getURI?.({ maxWidth:400, maxHeight:240 }),
            recommendedMenu:recommendedMenuFor(place.displayName || "", type.label, place.primaryTypeDisplayName),
            googlePlaceId:place.id
          };
        });
      }));
      const categoryCandidates = batches.map((batch)=>batch.status==="fulfilled" ? batch.value : []);
      const priorityRetailers = [
        {query:"ドン・キホーテ",name:"돈키호테",must:true},
        {query:"MEGAドン・キホーテ",name:"메가 돈키호테",must:true},
        {query:"DAISO",name:"다이소",must:false},
        {query:"マツモトキヨシ",name:"마츠모토키요시",must:false},
        {query:"スギ薬局",name:"스기약국",must:false},
        {query:"ロフト",name:"로프트",must:false},
        {query:"ハンズ",name:"핸즈",must:false}
      ];
      const retailFields=["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","rating","userRatingCount","regularOpeningHours","businessStatus","photos","priceLevel","priceRange"];
      const retailBatches=activeCountry==="JP" ? await Promise.allSettled(priorityRetailers.map(async retailer=>{
        const {places}=await Place.searchByText({
          textQuery:`${travelArea.trim()} ${retailer.query}`,
          fields:retailFields,
          locationRestriction:bounds,
          language:"ko",
          maxResultCount:3
        });
        return places.filter((place:any)=>place.location && bounds.contains(place.location))
          .sort((a:any,b:any)=>pointDistanceKm({lat:centerLat,lng:centerLng},{lat:a.location.lat(),lng:a.location.lng()})-pointDistanceKm({lat:centerLat,lng:centerLng},{lat:b.location.lat(),lng:b.location.lng()}))
          .slice(0,retailer.must?2:1)
          .map((place:any,index:number)=>{
            const details=googlePlaceDetails(place,`${retailer.name} ${index+1}`);
            return {
              id:`guide-쇼핑-${place.id}`,name:details.name,sub:details.address,category:"검색" as const,
              lat:place.location.lat(),lng:place.location.lng(),color:categoryColors["쇼핑"],
              hours:details.hours,description:details.description,listSummary:details.description,
              tip:retailer.must?"여행 지역 주변에 있으면 반드시 포함하는 쇼핑 장소예요.":"여행 중 활용도가 높은 쇼핑·드럭스토어예요.",
              query:place.googleMapsURI||place.displayName||"",placeType:"쇼핑",
              rating:details.rating,reviewCount:details.reviewCount,businessStatus:details.businessStatus,
              originalName:details.originalName,originalAddress:details.originalAddress,
              googlePriceRange:details.googlePriceRange,googlePriceLevel:details.googlePriceLevel,
              photoUrl:place.photos?.[0]?.getURI?.({maxWidth:400,maxHeight:240}),
              googlePlaceId:place.id,priorityShop:true,
              recommendedMenu:retailer.must?"면세 쇼핑·일본 한정 과자·화장품·생활용품":"여행용품·기념품·생활용품"
            } satisfies Point;
          });
      })) : [];
      const priorityShopping=retailBatches.flatMap(batch=>batch.status==="fulfilled"?batch.value:[])
        .filter((point,index,items)=>items.findIndex(item=>item.googlePlaceId===point.googlePlaceId)===index);
      const shoppingIndex=types.findIndex(type=>type.label==="쇼핑");
      if (shoppingIndex>=0) {
        categoryCandidates[shoppingIndex]=[...priorityShopping,...categoryCandidates[shoppingIndex]]
          .filter((point,index,items)=>items.findIndex(item=>item.googlePlaceId===point.googlePlaceId)===index);
      }
      const convenienceIndex=types.findIndex(type=>type.label==="편의점");
      const allConvenience=convenienceIndex>=0?categoryCandidates[convenienceIndex]:[];
      const candidates = [[0,1,2,3,4].flatMap((rank)=>categoryCandidates.map((items)=>items[rank]).filter(Boolean)),allConvenience].flat()
        .filter((point,index,items)=>items.findIndex((item)=>item.id===point.id)===index)
        .slice(0,80);
      if (!candidates.length) throw new Error();
      fallbackPoints = candidates.map((point)=>({
        ...point,
        color:pointColor(point),
        aiReason:point.tip,
        aiFamousItems:point.recommendedMenu ? [point.recommendedMenu] : [],
        aiRecommendedItems:point.recommendedMenu ? [{name:point.recommendedMenu,price:point.googlePriceRange || point.googlePriceLevel || priceGuideFor(point.placeType || guideGroup(point),activeCountry)}] : [],
        aiPrice:point.googlePriceRange || point.googlePriceLevel || priceGuideFor(point.placeType || guideGroup(point),activeCountry),
        aiFamilyTip:point.tip,
        aiVisitTip:point.hours || "영업시간과 혼잡도는 방문 전에 확인해 주세요.",
        aiParkingTip:"전용·인근 주차장은 Google 지도에서 확인해 주세요."
      }));
      setAiOverview("Google 장소 정보를 먼저 표시했어요. 가족 맞춤 설명을 빠르게 보강하고 있습니다.");
      fallbackPoints = fallbackPoints.slice(0,60);
      setGuideRecommendations(fallbackPoints);
      setDestinationId((current)=>current==="area-center" ? fallbackPoints[0].id : current);
      void hydrateRecommendationPreviews(fallbackPoints);
      const aiResponse = await fetch("/api/ai-recommend",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          trip:{
            area:travelArea.trim(), startDate:guideStart, endDate:guideEnd,
            country:activeCountry,currency:activeCountry==="KR"?"KRW (₩)":"JPY (¥)",
            duration:tripDays ? `${tripDays.nights}박 ${tripDays.days}일` : "일정 미등록",
            travelers:travelers.map(({relation,age})=>({relation,age}))
          },
          candidates:candidates.slice(0,14).map((point)=>({
            id:point.id,name:point.name,originalName:point.originalName,category:point.placeType,
            rating:point.rating,reviewCount:point.reviewCount,recommendedMenu:point.recommendedMenu,
            googlePriceRange:point.googlePriceRange,googlePriceLevel:point.googlePriceLevel,
            reviewHighlights:point.reviewHighlights
          }))
        })
      });
      const aiData = await aiResponse.json();
      if (!aiResponse.ok || !Array.isArray(aiData.result?.recommendations)) throw new Error(aiData.error || "AI 추천 실패");
      const localizationMap = new Map<string, string>(
        (Array.isArray(aiData.result.localizations)?aiData.result.localizations:[])
          .map((item:any)=>[String(item.id),String(item.koreanName||"").trim()])
      );
      const aiRecommendations = aiData.result.recommendations as any[];
      const recommendationMap = new Map<string, any>(aiRecommendations.map((item:any)=>[String(item.id),item]));
      const candidateById = new Map(candidates.map((point)=>[point.id,point] as const));
      const candidateByName = new Map(candidates.map((point)=>[String(point.name).trim().toLowerCase(),point] as const));
      const aiSelected = aiRecommendations.map((ai:any,index:number)=>{
        const requestedId=String(ai?.id||"");
        const point = candidateById.get(requestedId)
          || candidateByName.get(String(ai?.name||ai?.koreanName||"").trim().toLowerCase())
          || candidates[Math.min(index,candidates.length-1)];
        const localizedName=localizationMap.get(point.id);
        return {
          ...point,
          name:localizedName && !containsJapanese(localizedName) ? localizedName : point.name,
          originalName:point.originalName || (localizedName!==point.name ? point.name : undefined),
          color:pointColor(point),
          aiReason:ai.reason,
          aiPrice:point.googlePriceRange || ai.priceGuide || point.googlePriceLevel || priceGuideFor(point.placeType || guideGroup(point),activeCountry),
          aiFamousItems:Array.isArray(ai.famousItems)&&ai.famousItems.length ? ai.famousItems : point.recommendedMenu ? [point.recommendedMenu] : [],
          aiRecommendedItems:Array.isArray(ai.recommendedItems) ? ai.recommendedItems
            .filter((item:any)=>item?.name)
            .slice(0,3)
            .map((item:any)=>({name:String(item.name),price:String(item.price||"가격 확인")})) : [],
          aiFamilyTip:ai.familyTip,
          aiBestTime:ai.bestTime,
          aiEvidence:ai.evidence,
          aiVisitTip:ai.visitTip,
          aiParkingTip:ai.parkingTip,
          tip:ai.familyTip || point.tip,
          recommendedMenu:Array.isArray(ai.famousItems)&&ai.famousItems.length ? ai.famousItems.join(" · ") : point.recommendedMenu
        };
      }).sort((a,b)=>{
        const pa:any=recommendationMap.get(a.id), pb:any=recommendationMap.get(b.id);
        return Number(pa?.priority||99)-Number(pb?.priority||99);
      });
      const next = aiSelected.slice(0,60);
      const aiPointMap = new Map(next.map((point)=>[point.id,point] as const));
      const enhancedRecommendations = fallbackPoints.map((point)=>{
        const updated=aiPointMap.get(point.id);
        return updated ? mergePointData(point,updated) : point;
      });
      if (!next.length) throw new Error("AI 추천 결과가 비어 있어요. 다시 시도해 주세요.");
      setAiOverview(aiData.result.overview || "");
      setGuideRecommendations((current)=>enhancedRecommendations.map((point)=>{
        const existing=current.find((item)=>item.id===point.id);
        return existing ? mergePointData(existing,point) : point;
      }));
      void hydrateRecommendationPreviews(enhancedRecommendations);
      try {
        localStorage.setItem(aiCacheKey(activeCountry),JSON.stringify({
          createdAt:Date.now(),overview:aiData.result.overview || "",
          area:travelArea.trim(),recommendations:enhancedRecommendations
        }));
      } catch {}
      setSelected((current)=>{
        const updated=enhancedRecommendations.find((point)=>point.id===current.id);
        if (updated) return mergePointData(current,updated);
        return current;
      });
      setDestinationId((current)=>current==="area-center" ? enhancedRecommendations[0].id : current);
      routeLayerRef.current?.setMap(null);
      routeLayerRef.current = null;
      setRoute(null);
      return enhancedRecommendations;
    } catch (error:any) {
      if (fallbackPoints.length) {
        setAiOverview("AI 추천 응답이 늦어 Google 장소 후보를 먼저 표시했어요. 사진과 상세 정보는 이어서 보강합니다.");
        setGuideRecommendations(fallbackPoints);
        setDestinationId((current)=>current==="area-center" ? fallbackPoints[0].id : current);
        void hydrateRecommendationPreviews(fallbackPoints);
        setRecommendationError("");
        return fallbackPoints;
      }
      setRouteError(error?.message || "AI 추천 정보를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      setRecommendationError(error?.message || "AI 추천 정보를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      return [] as Point[];
    } finally {
      setGuideLoading(false);
    }
  };

  useEffect(()=>{
    if (!googleReady || initialGuideLoadedRef.current || guideLoading || guideRecommendations.length || !travelArea.trim()) return;
    initialGuideLoadedRef.current=true;
    void buildAreaGuide();
  },[googleReady, travelArea, guideLoading, guideRecommendations.length]);

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
        textQuery:`${hotelQuery.trim()} ${travelArea.trim()} ${travelCountry==="KR"?"대한민국":"일본"}`,
        fields:["id","displayName","formattedAddress","location","primaryTypeDisplayName"],
        ...(center ? { locationBias:{ center, radius:30000 } } : {}),
        language:"ko",
        maxResultCount:8
      });
      const next:SearchResult[] = places.filter((place:any)=>place.location).map((place:any)=>({
        name:koreanPlaceText(place.displayName, koreanPlaceText(place.primaryTypeDisplayName, "숙소")),
        display_name:koreanPlaceText(place.formattedAddress, travelCountry==="KR"?"대한민국 현지 주소":"일본 현지 주소"),
        originalName:place.displayName,
        originalAddress:place.formattedAddress,
        lat:String(place.location.lat()),
        lon:String(place.location.lng())
      }));
      setResults(next);
      if (!next.length) setRouteError(`검색 결과가 없어요. 숙소명 또는 ${travelCountry==="KR"?"한국":"일본"} 주소를 조금 더 자세히 입력해 주세요.`);
    } catch {
      setRouteError(`숙소 검색에 실패했어요. 숙소명이나 ${travelCountry==="KR"?"한국":"일본"} 주소로 다시 검색해 주세요.`);
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
        textQuery:`${routeSearchQuery.trim()} ${travelCountry==="KR"?"대한민국":"일본"}`,
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
      if (!next.length) setRouteError(`${travelCountry==="KR"?"한국":"일본"} 내에서 검색 결과를 찾지 못했어요. 지역명과 장소명을 함께 입력해 보세요.`);
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
    const recommendationCandidates = guideRecommendations;
    const candidates = item === "전체" ? recommendationCandidates : recommendationCandidates.filter((point)=>guideGroup(point)===item);
    if (!candidates.length) {
      setRouteError(`${travelArea} 추천 장소 중 '${item}' 카테고리 결과가 없어요.`);
      return;
    }
    setRouteError("");
    setPlaceResults([]);
    setCategory(item);
    const next = candidates[0];
    setSelected(next);
    mapRef.current?.panTo({lat:next.lat,lng:next.lng});
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
    void saveTripToCloud({ travelers, guideStart, guideEnd });
    setAiGuidePlan(null);
    setAiGuideArea("");
    aiGuidePlanRef.current=null;
    aiGuideAreaRef.current="";
    setTripSaved(true);
    setRouteError("");
    setSheet("places");
    setSheetCollapsed(false);
    setTimeout(()=>void buildAreaGuide(),0);
  };

  const openAiGuidebook = async (force=false) => {
    setGuideOpen(true);
    const requestedArea=travelArea.trim();
    if (!force && aiGuidePlan?.days?.length && aiGuidePlan.placeDetails?.length && aiGuideArea===requestedArea) {
      setAiGuideLoading(false);
      return;
    }
    setAiGuideLoading(true);
    setRouteError("");
    try {
      const areaChanged=aiGuideArea!==requestedArea;
      const places = areaChanged || !guideRecommendations.length ? await buildAreaGuide() : guideRecommendations;
      if (!places?.length) throw new Error("먼저 여행 정보 저장 후 AI 추천 장소를 불러와 주세요.");
      if (areaChanged && aiGuidePlanRef.current?.days?.length && aiGuidePlanRef.current.placeDetails?.length && aiGuideAreaRef.current===requestedArea) return;
      const sourcePlaces=[...regionalSavedPlaces,...places]
        .filter((point,index,items)=>items.findIndex((item)=>item.id===point.id)===index);
      let enrichedPlaces=sourcePlaces;
      if (force) {
        try {
          const google=(window as any).google;
          const {Place}=await google.maps.importLibrary("places");
          const detailTargets=sourcePlaces
            .filter((point)=>point.googlePlaceId && ["맛집","카페","디저트","쇼핑","편의점","소품샵","전통시장","주류","이자카야·술집"].includes(guideGroup(point)))
            .slice(0,6);
          const detailResults=await Promise.allSettled(detailTargets.map(async(point)=>{
            const place=new Place({id:point.googlePlaceId,requestedLanguage:"ko",requestedRegion:travelCountry});
            await place.fetchFields({fields:["editorialSummary","reviews","priceRange","priceLevel","primaryTypeDisplayName"]});
            const details=googlePlaceDetails(place,point.name);
            return {
              ...point,
              description:details.description||point.description,
              reviewHighlights:details.reviewHighlights?.length?details.reviewHighlights:point.reviewHighlights,
              googlePriceRange:details.googlePriceRange||point.googlePriceRange,
              googlePriceLevel:details.googlePriceLevel||point.googlePriceLevel
            };
          }));
          const detailMap=new Map(detailResults.flatMap((result)=>result.status==="fulfilled"?[[result.value.id,result.value] as const]:[]));
          enrichedPlaces=sourcePlaces.map((point)=>detailMap.get(point.id)||point);
        } catch {}
      }
      const response = await fetch("/api/ai-guide",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          trip:{
            area:travelArea,startDate:guideStart,endDate:guideEnd,
            country:travelCountry,currency:travelCountry==="KR"?"KRW (₩)":"JPY (¥)",
            duration:tripDays ? `${tripDays.nights}박 ${tripDays.days}일` : "1일",
            travelers:travelers.map(({relation,age})=>({relation,age}))
          },
          hotel,
          places:enrichedPlaces.slice(0,12).map((point)=>({
            id:point.id,name:point.name,category:guideGroup(point),lat:point.lat,lng:point.lng,
            reason:point.aiReason,price:point.aiPrice,famousItems:point.aiFamousItems,
            recommendedItems:point.aiRecommendedItems,recommendedMenu:point.recommendedMenu,
            visitTip:point.aiVisitTip,parkingTip:point.aiParkingTip,bestTime:point.aiBestTime,
            description:point.description,googlePriceRange:point.googlePriceRange,
            reviewHighlights:point.reviewHighlights,familyTip:point.aiFamilyTip,hours:point.hours
          }))
        })
      });
      const data = await response.json();
      if (!response.ok || !data.guide?.days) throw new Error(data.error || "AI 가이드북을 만들지 못했어요.");
      const detailMap=new Map((Array.isArray(data.guide.placeDetails)?data.guide.placeDetails:[]).map((item:any)=>[item.id,item]));
      if (detailMap.size) {
        const mergeItems=(point:Point)=>{
          const detail:any=detailMap.get(point.id);
          if (!detail) return point;
          const items=Array.isArray(detail.items)?detail.items.filter((item:any)=>item?.name).slice(0,4).map((item:any)=>({
            name:String(item.name),price:String(item.price||"가격 현장 확인")
          })):[];
          return {
            ...point,
            description:detail.description||point.description,
            aiRecommendedItems:items.length?items:point.aiRecommendedItems,
            aiFamousItems:items.length?items.map((item:any)=>item.name):point.aiFamousItems,
            recommendedMenu:items.length?items.map((item:any)=>item.name).join(" · "):point.recommendedMenu
          };
        };
        setGuideRecommendations((current)=>current.map(mergeItems));
        setSavedPlaces((current)=>current.map(mergeItems));
        setSelected((current)=>mergeItems(current));
      }
      setAiGuidePlan(data.guide);
      setAiGuideArea(requestedArea);
      aiGuidePlanRef.current=data.guide;
      aiGuideAreaRef.current=requestedArea;
    } catch (error:any) {
      setRouteError(error?.message || "AI 가이드북을 만들지 못했어요.");
    } finally {
      setAiGuideLoading(false);
    }
  };

  const authAvailable = hasSupabaseConfig();

  return (
    <main
      className={`mobile-app ${authAvailable ? "has-account" : "no-account"}`}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest(".bottom-sheet, .bottom-tabs, .guide-overlay")) return;
        setSheetCollapsed(true);
      }}
    >
      <header className="mobile-header">
        <div><small>우리 가족 {travelArea || "일본"} 여행</small><h1>Guide-trip</h1></div>
        <div className="header-actions">
          <button className={`round-button ${tripSaved ? "ready" : ""}`} onClick={() => {setSheet("trip");setSheetCollapsed(false);}} aria-label="여행 구성 설정"><Users size={20}/></button>
          <button className="round-button" onClick={() => {setSheet("hotel");setSheetCollapsed(false);}} aria-label="숙소 등록"><Building2 size={20}/></button>
        </div>
      </header>

      {authAvailable && <section className="account-strip">
        {session?.user ? (
          <>
            <span>{session.user.email}</span>
            <b>{cloudSaving ? "Saving" : "Cloud saved"}</b>
            <button onClick={signOut}>Sign out</button>
          </>
        ) : (
          <>
            <input
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="Email sign in"
              type="email"
            />
            <button onClick={signInWithEmail}>Send link</button>
          </>
        )}
      </section>}
      {authMessage && <p className="account-message">{authMessage}</p>}

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
        <button className={guideOpen ? "active" : ""} onClick={()=>void openAiGuidebook()}><BookOpen size={19}/><span>AI 가이드북</span></button>
      </nav>

      <section className={`bottom-sheet ${sheet} ${sheetCollapsed ? "collapsed" : ""} ${placeDetailOpen ? "detail-open" : ""}`}>
        <button className="sheet-toggle" onClick={() => setSheetCollapsed((value) => !value)} aria-label={sheetCollapsed ? "패널 펼치기" : "패널 접기"}>
          <span className="sheet-handle"/>
        </button>
        {sheet === "places" && (
          <>
            <div className="sheet-heading"><div><small>{selected.category === "검색" ? "지도에서 선택한 장소" : "추천 장소"}</small><h2>{placeDisplayName(selected)}</h2></div></div>
            <div className="category-scroll">
              {categories.map((item) => {
                const count=item==="전체" ? recommendationPool.length : recommendationPool.filter((point)=>guideGroup(point)===item).length;
                return <button key={item} className={category === item ? "active" : ""} style={{"--category-color":categoryColors[item]} as React.CSSProperties} onClick={() => selectRecommendationCategory(item)}>{item}{count>0&&<small>{count}</small>}</button>;
              })}
            </div>
            <div className="recommendation-list-head">
              <div><b>{category === "전체" ? "가까운 추천 장소" : `${category} 추천`}</b><small>{travelArea} 중심에서 가까운 순서</small></div>
              <span>{listedSpots.length}곳</span>
            </div>
            {recommendationPending && <div className="recommendation-loading"><Sparkles size={20}/><b>AI 추천 리스트 검색 중입니다</b><small>AI 추천 결과가 나온 뒤 사진과 지도 표시를 적용합니다.</small></div>}
            {recommendationError && !guideRecommendations.length && <div className="recommendation-loading error"><Sparkles size={20}/><b>AI 추천을 아직 받지 못했어요</b><small>{recommendationError}</small><button onClick={()=>void buildAreaGuide()}>다시 검색</button></div>}
            {guideRecommendations.length > 0 && <div className="recommendation-list">
              {listedSpots.map((spot)=>{
                const distance=recommendationCenter ? pointDistanceKm(recommendationCenter,spot) : null;
                return <button key={`list-${spot.id}`} className={selected.id===spot.id ? "active" : ""} style={{"--place-color":pointColor(spot)} as React.CSSProperties} onClick={()=>{setSelected(spot);setPlaceDetailOpen(true);mapRef.current?.panTo({lat:spot.lat,lng:spot.lng});}}>
                  {spot.photoUrl ? <img src={spot.photoUrl} alt=""/> : <span className="recommendation-placeholder" style={{background:pointColor(spot)}}>{spot.name.slice(0,1)}</span>}
                  <div>
                    <small className="recommendation-category" style={{color:pointColor(spot)}}>{guideGroup(spot)}{spot.priorityShop?" · 필수 쇼핑":""}</small>
                    <b>{placeDisplayName(spot)}</b>
                    <p className="recommendation-summary">{placeSummary(spot)}</p>
                    <p className="recommendation-menu">{spot.aiRecommendedItems?.[0]?.name || spot.recommendedMenu || spot.sub}</p>
                    <footer>{spot.rating&&<span>★ {spot.rating.toFixed(1)}</span>}{distance!==null&&<span>{distance<1 ? `${Math.round(distance*1000)}m` : `${distance.toFixed(1)}km`}</span>}{(spot.aiRecommendedItems?.[0]?.price||spot.aiPrice)&&<strong>{spot.aiRecommendedItems?.[0]?.price||spot.aiPrice}</strong>}</footer>
                  </div>
                  <Navigation size={18}/>
                </button>;
              })}
            </div>}
            {placeDetailOpen && createPortal(<div className="place-detail-overlay" onPointerDown={()=>setPlaceDetailOpen(false)}>
              <section className="place-detail-popup" role="dialog" aria-modal="true" aria-label={`${selected.name} 상세 정보`} onPointerDown={(event)=>event.stopPropagation()}>
                <div className="place-detail-popup-head"><div><small>{guideGroup(selected)} 상세 정보</small><b>{placeDisplayName(selected)}</b></div><button onClick={()=>setPlaceDetailOpen(false)} aria-label="상세 닫기"><X size={21}/></button></div>
                <div className="place-detail-popup-scroll">
            {selected.photoUrls&&selected.photoUrls.length>0 ? <section className="place-photo-section">
              <div className="place-photo-gallery">{selected.photoUrls.map((url,index)=><img key={url} src={url} alt={`${selected.name} Google 등록 사진 ${index+1}`}/>)}</div>
              <div><span>Google 등록 사진 · 메뉴·상품·매장 사진 포함 가능</span>{selected.photosPage&&<a href={selected.photosPage} target="_blank" rel="noreferrer">사진 전체 보기</a>}</div>
            </section> : selected.photoUrl && <img className="selected-place-photo" src={selected.photoUrl} alt={`${selected.name} 사진`}/>}
            <div className="selected-place" style={{"--place-color":pointColor(selected)} as React.CSSProperties}>
              <span className="place-dot" style={{background:pointColor(selected)}}>{selected.category === "숙소" ? "숙" : selected.name.slice(0,1)}</span>
              <div className="place-main">
                <div className="place-title">
                  <b>{placeDisplayName(selected)}</b>
                  <small>{selected.sub}</small>
                  {selected.originalAddress && <small className="original-address">{selected.originalAddress}</small>}
                </div>
                {selected.category === "검색" && <div className="place-meta">
                  <span style={{background:pointColor(selected),color:"#fff",borderColor:pointColor(selected)}}>{guideGroup(selected)}</span>
                  {selected.priorityShop&&<span className="priority-shop-badge">필수 쇼핑</span>}
                  {selected.placeType && <span>{selected.placeType}</span>}
                  {selected.rating && <span>★ {selected.rating.toFixed(1)}{selected.reviewCount ? ` (${selected.reviewCount.toLocaleString("ko-KR")})` : ""}</span>}
                  {selected.businessStatus && <span>{selected.businessStatus}</span>}
                  {typeof selected.openNow === "boolean" && <span className={selected.openNow?"open-now":"closed-now"}>{selected.openNow?"현재 영업 중":"현재 영업 종료"}</span>}
                </div>}
                {placeDetailLoading&&<div className="place-detail-loading"><Sparkles size={14}/>Google 상세 정보를 불러오는 중…</div>}
                <p>{placeSummary(selected)}</p>
                {(selected.googlePriceRange||selected.googlePriceLevel)&&<p className="place-price">Google 가격 정보 · {selected.googlePriceRange || selected.googlePriceLevel}</p>}
                {selected.hours && <p className="place-hours"><Clock3 size={13}/>{selected.hours}</p>}
                {selected.tip && <div className="family-tip">{selected.category === "검색" ? "방문 팁" : "가족 추천"} · {selected.tip}</div>}
              </div>
            </div>
            {(selected.phone||selected.website)&&<div className="place-contact-row">
              {selected.phone&&<a href={`tel:${selected.phone}`}><span>전화</span><b>{selected.phone}</b></a>}
              {selected.website&&<a href={selected.website} target="_blank" rel="noreferrer"><span>공식 웹사이트</span><b>메뉴·예약 확인</b></a>}
            </div>}
            {selected.serviceOptions&&selected.serviceOptions.length>0&&<section className="google-detail-block">
              <h3>이용 정보</h3><div className="detail-chip-list">{selected.serviceOptions.map((item)=><span key={item}>{item}</span>)}</div>
            </section>}
            {Boolean(selected.parkingOptions?.length||selected.accessibility?.length)&&<section className="google-detail-block">
              <h3>주차·편의시설</h3>
              <div className="detail-chip-list">{[...(selected.parkingOptions||[]),...(selected.accessibility||[])].map((item)=><span key={item}>{item}</span>)}</div>
            </section>}
            {selected.paymentOptions&&selected.paymentOptions.length>0&&<section className="google-detail-block">
              <h3>결제 정보</h3><div className="detail-chip-list">{selected.paymentOptions.map((item)=><span key={item}>{item}</span>)}</div>
            </section>}
            {selected.weeklyHours&&selected.weeklyHours.length>0&&<details className="weekly-hours">
              <summary>요일별 운영시간 전체 보기</summary>
              <div>{selected.weeklyHours.map((item)=><p key={item}>{item}</p>)}</div>
            </details>}
            {Boolean(selected.reviewSummary||selected.detailedReviews?.length||selected.reviewHighlights?.length)&&<section className="google-detail-block review-block">
              <h3>Google 이용자 후기</h3>
              {selected.reviewSummary&&<p>{selected.reviewSummary}</p>}
              {selected.detailedReviews?.length ? selected.detailedReviews.slice(0,5).map((review,index)=><blockquote key={index}>
                <header><b>{review.rating?`★ ${review.rating.toFixed(1)}`:"이용자 후기"}</b><span>{[review.author,review.time].filter(Boolean).join(" · ")}</span></header>
                {review.text}
              </blockquote>) : selected.reviewHighlights?.slice(0,5).map((review,index)=><blockquote key={index}>{review}</blockquote>)}
              {selected.reviewsPage&&<a className="google-more-link" href={selected.reviewsPage} target="_blank" rel="noreferrer">Google 지도에서 후기 전체 보기</a>}
            </section>}
            {placeInsightLoading&&<div className="place-insight-loading"><Sparkles size={15}/>Google 설명과 후기를 바탕으로 판매 메뉴를 정리하고 있어요.</div>}
            {selected.detailAiLoaded&&selected.aiRecommendedItems&&selected.aiRecommendedItems.length>0&&<section className="place-offerings">
              <div><span>{["맛집","카페","디저트","이자카야·술집"].includes(guideGroup(selected))?"이곳에서 파는 음식":"이곳에서 살 수 있는 것"}</span><small>{selected.detailAiSource}</small></div>
              <div>{selected.aiRecommendedItems.map((item,index)=><article key={`${item.name}-${index}`}><b>{item.name}</b><strong>{item.price}</strong></article>)}</div>
            </section>}
            <div className="place-actions">
              <button onClick={() => { setDestinationId(selected.id); setPlaceDetailOpen(false); setSheet("route"); }}><Navigation size={17}/> 여기까지 길찾기</button>
              <button className={`save-action ${savedPlaces.some((item) => item.id === selected.id) ? "saved" : ""}`} onClick={() => toggleSavedPlace(selected)} aria-label="장소 저장">
                <Heart size={16} fill={savedPlaces.some((item) => item.id === selected.id) ? "currentColor" : "none"}/>
              </button>
              <a href={selected.query.startsWith("http") ? selected.query : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.query)}`} target="_blank" rel="noreferrer">구글지도</a>
            </div>
            {selected.aiReason && <div className="ai-place-card">
              <div className="ai-card-head"><span><Sparkles size={15}/>AI 가족 맞춤 추천</span>{selected.aiBestTime&&<small>{selected.aiBestTime}</small>}</div>
              <p className="ai-summary">{selected.aiReason}</p>
              {selected.aiFamousItems&&selected.aiFamousItems.length>0&&<div className="ai-famous"><b>{guideGroup(selected)==="맛집"||guideGroup(selected)==="카페" ? "대표 메뉴" : guideGroup(selected)==="쇼핑" ? "추천 쇼핑" : "추천 포인트"}</b><div>{selected.aiFamousItems.map((item)=><span key={item}>{item}</span>)}</div></div>}
              {!selected.detailAiLoaded&&selected.aiRecommendedItems&&selected.aiRecommendedItems.length>0&&<div className="ai-item-list">
                <b>{["맛집","카페","디저트","이자카야·술집"].includes(guideGroup(selected)) ? "추천 메뉴와 가격" : ["쇼핑","편의점","소품샵","주류","전통시장"].includes(guideGroup(selected)) ? "추천 상품과 가격" : "추천 항목과 가격"}</b>
                <div>{selected.aiRecommendedItems.map((item,index)=><p key={`${item.name}-${index}`}><span>{item.name}</span><strong>{item.price}</strong></p>)}</div>
              </div>}
              <div className="ai-tip-grid">
                <div><small>예상 가격</small><p>{selected.aiPrice || "방문 전 확인"}</p></div>
                <div><small>가족 방문 팁</small><p>{selected.aiFamilyTip || "방문 전 확인"}</p></div>
                {selected.aiVisitTip&&<div><small>방문 팁</small><p>{selected.aiVisitTip}</p></div>}
                {selected.aiParkingTip&&<div><small>주차 정보</small><p>{selected.aiParkingTip}</p></div>}
              </div>
              <p className="place-move-note">도보·차량·대중교통 이동시간은 ‘여기까지 길찾기’에서 현재 출발지를 기준으로 확인할 수 있어요.</p>
              {selected.aiEvidence&&<p className="ai-evidence">정보 근거 · {selected.aiEvidence}</p>}
              <small className="ai-disclaimer">AI가 Google 장소 후보와 등록한 여행 구성으로 만든 추천 정보예요. 가격·메뉴·영업시간은 방문 전에 확인해 주세요.</small>
            </div>}
                </div>
              </section>
            </div>,document.body)}
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
                  <button className="result-main" onClick={() => {setSelected(point);setSheet("places");setPlaceDetailOpen(true);mapRef.current?.panTo({lat:point.lat,lng:point.lng});}}>
                    <MapPin size={17} style={{color:pointColor(point)}}/><span><b>{placeDisplayName(point)}</b><small>{point.sub}</small></span>
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
                    <span style={{background:pointColor(point)}}>{point.name.slice(0,1)}</span><div><b>{placeDisplayName(point)}</b><small>{point.sub}</small></div>
                  </button>
                  <button onClick={() => {setDestinationId(point.id);setSheet("route");}} aria-label="길찾기"><Navigation size={16}/></button>
                  <button className="delete-saved" onClick={() => toggleSavedPlace(point)} aria-label="삭제"><Trash2 size={16}/></button>
                </article>
              ))}
            </div>
            {savedPlaces.length === 0 && <p className="empty-saved">추천 장소나 검색 결과의 하트 버튼을 눌러 저장할 수 있어요.</p>}
            <button className="guide-create-button" onClick={()=>void openAiGuidebook()}><Sparkles size={17}/> AI 가이드북 만들기</button>
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
              <input value={hotelQuery} onChange={(e)=>setHotelQuery(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&searchHotel()} placeholder={`숙소명 또는 ${travelCountry==="KR"?"한국":"일본"} 주소 입력`}/>
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
                {routeSearchResults.map((point)=><button key={point.id} onClick={()=>chooseRouteSearchPlace(point)}><MapPin size={15}/><span><b>{placeDisplayName(point)}</b><small>{point.sub}</small></span></button>)}
              </div>}
              <small className="route-search-help">현재 여행 지역과 관계없이 {travelCountry==="KR"?"한국":"일본"} 전역의 장소를 검색할 수 있어요.</small>
            </div>
            <div className="route-selects">
              <label><span className="origin-dot"/><div><small>출발지</small><select value={originId} onChange={(e)=>setOriginId(e.target.value)}>{currentLocation && <option value="current-location">내 현재 위치</option>}{areaPoint && <option value="area-center">{travelArea} 중심</option>}{isInuyamaArea && <option value="station">이누야마역</option>}{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}{routeSearchPoints.map((p)=><option key={`route-from-${p.id}`} value={p.id}>직접 검색 · {placeDisplayName(p)}</option>)}{recommendationPool.map((p)=><option key={`region-from-${p.id}`} value={p.id}>{placeDisplayName(p)}</option>)}{regionalSavedPlaces.map((p)=><option key={`saved-from-${p.id}`} value={p.id}>저장 · {placeDisplayName(p)}</option>)}</select></div></label>
              <div className="route-line"/>
              <label><span className="dest-dot"/><div><small>도착지</small><select value={destinationId} onChange={(e)=>setDestinationId(e.target.value)}>{currentLocation && <option value="current-location">내 현재 위치</option>}{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}{areaPoint && <option value="area-center">{travelArea} 중심</option>}{isInuyamaArea && <option value="station">이누야마역</option>}{routeSearchPoints.map((p)=><option key={`route-to-${p.id}`} value={p.id}>직접 검색 · {placeDisplayName(p)}</option>)}{recommendationPool.map((p)=><option key={`region-to-${p.id}`} value={p.id}>{placeDisplayName(p)}</option>)}{regionalSavedPlaces.map((p)=><option key={`saved-to-${p.id}`} value={p.id}>저장 · {placeDisplayName(p)}</option>)}</select></div></label>
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
              <div><small>등록한 구성원·일정·추천 장소를 모두 반영해요</small><b>AI 가족여행 가이드북</b></div>
              <input value={travelArea} onChange={(e)=>setTravelArea(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&buildAreaGuide()} placeholder="예: 나고야, 교토"/>
              <button onClick={()=>void openAiGuidebook(true)} disabled={aiGuideLoading||guideLoading}>{aiGuideLoading||guideLoading ? "AI 구성 중…" : <><Sparkles size={16}/>AI 가이드 다시 만들기</>}</button>
              {aiGuidePlan && <p>{aiGuidePlan.overview}</p>}
              {routeError && <p className="guide-error">{routeError}</p>}
            </div>
            {aiGuideLoading ? <div className="ai-guide-loading"><Sparkles size={30}/><b>가족 구성과 이동 동선을 분석하고 있어요</b><span>추천 장소, 식사, 쇼핑, 휴식 시간을 조합해 가이드북을 만드는 중입니다.</span></div> : aiGuidePlan ? <div className="travel-guide" ref={guideRef}>
              {(() => {
                const baseGuidePlaces = guideRecommendations.length
                  ? [...regionalSavedPlaces, ...guideRecommendations].filter((point,index,items)=>items.findIndex((item)=>item.name===point.name)===index)
                  : regionalSavedPlaces.length ? regionalSavedPlaces : [];
                const aiStopIds = aiGuidePlan.days.flatMap((day)=>day.stops.map((stop)=>stop.id));
                const guidePlaces = [...baseGuidePlaces].sort((a,b)=>{
                  const ai=aiStopIds.indexOf(a.id), bi=aiStopIds.indexOf(b.id);
                  return (ai<0?999:ai)-(bi<0?999:bi);
                });
                const mapPlaces = guidePlaces.slice(0,20);
                const markerLabels = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                const markerParams = mapPlaces.map((point) =>
                  `&markers=${encodeURIComponent(`size:tiny|color:0x${pointColor(point).replace("#","")}|${point.lat},${point.lng}`)}`
                ).join("");
                const mapCenter = areaPoint ? `${areaPoint.lat},${areaPoint.lng}` : `${travelArea} ${travelCountry==="KR"?"대한민국":"일본"}`;
                const staticMapUrl = mapsKey ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapCenter)}&zoom=14&size=640x640&scale=2&language=ko&region=${travelCountry}&maptype=roadmap${markerParams}&key=${encodeURIComponent(mapsKey)}` : "";
                const dateText = guideStart ? `${guideStart.replaceAll("-",". ")}${guideEnd ? ` ~ ${guideEnd.replaceAll("-",". ")}` : ""}` : "여행 날짜를 입력해 주세요";
                const attractions=guidePlaces.filter((point)=>["관광","역사","아이와 함께"].includes(guideGroup(point))).slice(0,12);
                const foodPlaces=guidePlaces.filter((point)=>["맛집","카페","디저트"].includes(guideGroup(point))).slice(0,9);
                const shoppingPlaces=guidePlaces.filter((point)=>["쇼핑","편의점","소품샵","전통시장"].includes(guideGroup(point))).slice(0,10);
                const drinkPlaces=guidePlaces.filter((point)=>["주류","이자카야·술집","온천·휴식"].includes(guideGroup(point))).slice(0,8);
                const routePlaces=aiGuidePlan.days.flatMap((day)=>day.stops)
                  .map((stop)=>guidePlaces.find((point)=>point.id===stop.id)).filter(Boolean).slice(0,7) as Point[];
                const nearbyPlaces=[...foodPlaces,...attractions,...shoppingPlaces]
                  .filter((point,index,items)=>items.findIndex((item)=>item.id===point.id)===index).slice(0,10);
                const nearbyMarkers=nearbyPlaces.map((point)=>
                  `&markers=${encodeURIComponent(`size:tiny|color:0x${pointColor(point).replace("#","")}|${point.lat},${point.lng}`)}`
                ).join("");
                const nearbyMapUrl=mapsKey ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapCenter)}&zoom=11&size=640x520&scale=2&language=ko&region=${travelCountry}&maptype=roadmap${nearbyMarkers}&key=${encodeURIComponent(mapsKey)}` : "";
                const itemLine=(point:Point)=>
                  point.aiRecommendedItems?.slice(0,2).map((item)=>`${item.name} ${item.price}`).join(" · ")
                  || point.aiFamousItems?.slice(0,2).join(" · ")
                  || point.recommendedMenu
                  || `${guideGroup(point)} 대표 항목은 방문 전 확인`;
                const compactCard=(point:Point,index:number,kind:"food"|"spot"|"shop"="spot")=><article className={`atlas-card atlas-${kind}-card`} key={point.id}>
                  <header><span style={{background:pointColor(point)}}>{index+1}</span><div><b>{placeDisplayName(point)}</b></div></header>
                  {point.photoUrl&&<img src={point.photoUrl} alt="" crossOrigin="anonymous"/>}
                  <p>{point.aiReason||point.description}</p>
                  <strong>{kind==="food"?"추천 메뉴":kind==="shop"?"추천 상품":"여기서 할 일"} · {itemLine(point)}</strong>
                  <footer><span>◷ {point.hours||"운영시간 확인"}</span><b>{point.aiPrice||priceGuideFor(point.placeType||guideGroup(point),travelCountry)}</b></footer>
                </article>;
                return <>
                  <article className="guide-page atlas-page atlas-map-page">
                    <header className="atlas-title"><span>1/3</span><div><h2>{travelArea} 지도</h2><p>{hotel?`${hotel.name} 출발 가이드`:"지역 중심 출발 가이드"}</p></div><time>{dateText}</time></header>
                    <div className="atlas-map-layout">
                      <aside className="atlas-left-rail">
                        <section><h3>🚆 가는 방법</h3><b>{hotel?.name||`${travelArea} 중심`} → 주요 관광지</b><p>대중교통·도보·렌터카를 가족 컨디션에 맞춰 선택하세요.</p></section>
                        <section><h3>범례</h3>{["관광","맛집","카페","쇼핑","주류","교통"].map((group)=><p key={group}><i style={{background:categoryColors[group as Category]}}/>{group}</p>)}</section>
                        <section><h3>{travelArea} 한눈에 보기</h3><p>{aiGuidePlan.overview}</p></section>
                        <section><h3>여행 정보</h3><p>화폐 · {travelCountry==="KR"?"대한민국 원(₩)":"일본 엔(¥)"}</p><p>일정 · {tripDays?`${tripDays.nights}박 ${tripDays.days}일`:"당일"}</p><p>구성 · {travelers.map((item)=>item.relation).join(" · ")}</p></section>
                      </aside>
                      <section className="atlas-main-map">{staticMapUrl?<img src={staticMapUrl} alt={`${travelArea} 지도`} crossOrigin="anonymous"/>:<div>지도 준비 중</div>}<div className="atlas-map-caption"><b>{travelArea} 추천 지도</b><span>{mapPlaces.length}개 장소를 번호로 표시했습니다.</span></div></section>
                      <aside className="atlas-map-spots">{attractions.slice(0,7).map((point,index)=><article key={point.id}>{point.photoUrl&&<img src={point.photoUrl} alt="" crossOrigin="anonymous"/>}<span>{index+1}</span><div><b>{placeDisplayName(point)}</b><p>{point.aiReason||point.description}</p><small>{point.aiBestTime||point.hours||"방문시간 확인"}</small></div></article>)}</aside>
                    </div>
                    <footer className="atlas-tip-row"><b>알아두면 좋은 TIP</b>{aiGuidePlan.familyTips?.slice(0,3).map((tip,index)=><span key={index}>✓ {tip}</span>)}</footer>
                  </article>

                  <article className="guide-page atlas-page atlas-course-page">
                    <header className="atlas-title"><span>2/3</span><div><h2>{travelArea} 추천 동선 & 맛집 & 쇼핑 가이드</h2><p>꼭 가봐야 할 장소와 꼭 먹고 사야 할 항목</p></div><time>{dateText}</time></header>
                    <section className="atlas-route"><h3>추천 하루 코스</h3><div>{routePlaces.map((point,index)=><article key={point.id}>{point.photoUrl&&<img src={point.photoUrl} alt="" crossOrigin="anonymous"/>}<span>{index+1}</span><b>{placeDisplayName(point)}</b><small>{index===routePlaces.length-1?"도착":"약 10~20분 이동"}</small></article>)}</div></section>
                    <div className="atlas-course-layout">
                      <main>
                        <h3 className="atlas-section-title food">꼭 가봐야 할 맛집 & 카페</h3>
                        <div className="atlas-food-grid">{foodPlaces.slice(0,6).map((point,index)=>compactCard(point,index,"food"))}</div>
                        <h3 className="atlas-section-title shop">쇼핑·기념품·주류 리스트</h3>
                        <div className="atlas-buy-grid">{[...shoppingPlaces.slice(0,5),...drinkPlaces.slice(0,3)].map((point,index)=>compactCard(point,index,"shop"))}</div>
                      </main>
                      <aside><h3>주요 스팟 한눈에 보기</h3>{attractions.slice(0,10).map((point,index)=><article key={point.id}>{point.photoUrl&&<img src={point.photoUrl} alt="" crossOrigin="anonymous"/>}<span>{index+1}</span><div><b>{placeDisplayName(point)}</b><p>{point.aiReason||point.description}</p></div></article>)}</aside>
                    </div>
                    <footer className="atlas-tip-row"><b>여행 TIP</b><span>맛집은 혼잡 시간 전 방문</span><span>쇼핑은 면세·결제 가능 여부 확인</span><span>주류는 수하물 규정을 확인</span></footer>
                  </article>

                  <article className="guide-page atlas-page atlas-nearby-page">
                    <header className="atlas-title"><span>3/3</span><div><h2>{travelArea} 근교 지도 & 식당·카페 가이드</h2><p>렌터카와 대중교통으로 넓혀 보는 주변 추천</p></div><time>{dateText}</time></header>
                    <div className="atlas-nearby-layout">
                      <section className="atlas-nearby-map">{nearbyMapUrl?<img src={nearbyMapUrl} alt={`${travelArea} 근교 지도`} crossOrigin="anonymous"/>:<div>지도 준비 중</div>}<div>{nearbyPlaces.map((point,index)=><p key={point.id}><span style={{background:pointColor(point)}}>{index+1}</span><b>{placeDisplayName(point)}</b><small>{guideGroup(point)}</small></p>)}</div></section>
                      <aside>
                        <h3 className="atlas-section-title food">근교 식당·카페 추천</h3>
                        {foodPlaces.slice(0,6).map((point,index)=><article className="atlas-nearby-card" key={point.id}>{point.photoUrl&&<img src={point.photoUrl} alt="" crossOrigin="anonymous"/>}<span>{index+1}</span><div><b>{placeDisplayName(point)}</b><p>{point.aiReason||point.description}</p><strong>{itemLine(point)}</strong><footer>◷ {point.hours||"시간 확인"} <em>{point.aiPrice||priceGuideFor(point.placeType||guideGroup(point),travelCountry)}</em></footer></div></article>)}
                      </aside>
                    </div>
                    <section className="atlas-bottom-info"><div><h3>추천 이동 방법</h3><p>🚗 렌터카 · 주차와 이동시간 확인</p><p>🚌 대중교통 · 환승과 막차 확인</p></div><div><h3>알아두면 좋은 팁</h3><p>{aiGuidePlan.familyTips?.join(" · ")}</p></div><div><h3>비 오는 날</h3><p>{aiGuidePlan.weatherBackup?.join(" · ")}</p></div></section>
                  </article>
                </>;
              })()}
            </div> : <div className="ai-guide-loading"><BookOpen size={30}/><b>AI 가이드북을 만들 준비가 됐어요</b><span>여행 구성과 날짜를 저장한 뒤 다시 시도해 주세요.</span></div>}
          </div>
        </section>
      )}
    </main>
  );
}
