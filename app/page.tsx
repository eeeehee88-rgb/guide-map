"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Building2, CalendarDays, Car, Clock3, Download, Footprints, LocateFixed,
  Heart, MapPin, Navigation, Printer, Search, Trash2, X
} from "lucide-react";
import { toJpeg } from "html-to-image";

type Category = "전체" | "맛집" | "카페" | "역사";
type Point = {
  id: string; name: string; sub: string; category: Exclude<Category, "전체"> | "숙소" | "검색";
  lat: number; lng: number; color: string; description: string; tip: string; hours: string; query: string;
  placeType?: string; rating?: number; reviewCount?: number; businessStatus?: string;
  photoUrl?: string;
};
type Hotel = { name: string; address: string; lat: number; lng: number };
type SearchResult = { display_name: string; lat: string; lon: string; name?: string };
type RouteInfo = { minutes: number; distance: number; coordinates: [number, number][]; estimated?: boolean };

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

const categories: Category[] = ["전체", "맛집", "카페", "역사"];

function distanceText(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
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

function localizePoint(point: Point, fallback = "저장한 현지 장소"): Point {
  if (point.category !== "검색") return point;
  const name = koreanPlaceText(point.name, fallback);
  const address = koreanPlaceText(point.sub, "일본 아이치현 이누야마시");
  return { ...point, name, sub:address, description:address };
}

function googlePlaceDetails(place:any, fallbackName:string) {
  const address = koreanPlaceText(place.formattedAddress, "일본 현지 주소");
  const placeType = koreanPlaceText(place.primaryTypeDisplayName, "일본 현지 장소");
  const rating = typeof place.rating === "number" ? place.rating : undefined;
  const reviewCount = typeof place.userRatingCount === "number" ? place.userRatingCount : undefined;
  const weekday = place.regularOpeningHours?.weekdayDescriptions?.[new Date().getDay()];
  const hours = koreanPlaceText(weekday, "영업시간은 방문 전에 확인해 주세요.");
  const summarySource = typeof place.editorialSummary === "string" ? place.editorialSummary : place.editorialSummary?.text;
  const ratingText = rating ? ` Google 이용자 평점은 ${rating.toFixed(1)}점${reviewCount ? `, 후기 ${reviewCount.toLocaleString("ko-KR")}개` : ""}입니다.` : "";
  const description = koreanPlaceText(summarySource, `${placeType}입니다.${ratingText}`);
  return {
    name:koreanPlaceText(place.displayName, fallbackName),
    address, placeType, rating, reviewCount, hours, description,
    businessStatus:place.businessStatus === "OPERATIONAL" ? "영업 중인 장소" : undefined
  };
}

function guideGroup(point:Point) {
  if (point.category !== "검색") return point.category;
  const type = point.placeType || "";
  if (["관광","맛집","카페","쇼핑","주류","이자카야·술집","온천·휴식","디저트","전통시장","아이와 함께"].includes(type)) return type;
  if (/식당|음식|라멘|요리/.test(type)) return "맛집";
  if (/카페|커피|디저트|제과/.test(type)) return "카페";
  if (/쇼핑|백화점|상점|시장/.test(type)) return "쇼핑";
  return "관광";
}

export default function Home() {
  const mapEl = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [category, setCategory] = useState<Category>("전체");
  const [selected, setSelected] = useState<Point>(spots[0]);
  const [sheet, setSheet] = useState<"places" | "search" | "saved" | "route" | "hotel">("places");
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelQuery, setHotelQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [originId, setOriginId] = useState("station");
  const [destinationId, setDestinationId] = useState("castle");
  const [mode, setMode] = useState<"walk" | "drive">("walk");
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeResults, setPlaceResults] = useState<Point[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Point[]>([]);
  const [travelArea, setTravelArea] = useState("이누야마");
  const [areaMoving, setAreaMoving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStart, setGuideStart] = useState("");
  const [guideEnd, setGuideEnd] = useState("");
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideRecommendations, setGuideRecommendations] = useState<Point[]>([]);

  const hotelPoint: Point | null = hotel ? {
    id:"hotel", name:hotel.name, sub:hotel.address, category:"숙소", lat:hotel.lat, lng:hotel.lng,
    color:"#7a5caf", hours:"", description:"내가 등록한 숙소", tip:"", query:hotel.address
  } : null;
  const allPoints = [station, ...(hotelPoint ? [hotelPoint] : []), ...spots, ...savedPlaces, ...placeResults, ...guideRecommendations];
  const pointById = (id: string) => allPoints.find((p) => p.id === id) || station;
  const visibleSpots = category === "전체" ? spots : spots.filter((p) => p.category === category);

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
            ,placeType:details.placeType, rating:details.rating, reviewCount:details.reviewCount, businessStatus:details.businessStatus
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
    const markerPoints = [station, ...(hotelPoint ? [hotelPoint] : []), ...visibleSpots, ...placeResults, ...savedPlaces, ...guideRecommendations]
      .filter((point, index, items) => items.findIndex((item) => item.id === point.id) === index);
    markerPoints.forEach((point) => {
      const marker = new google.maps.Marker({
        map:mapRef.current,
        position:{ lat:point.lat, lng:point.lng },
        title:point.name,
        label:{
          text:point.category === "숙소" ? "숙소" : point.id === "station" ? "역" : point.name.slice(0,2),
          color:"#ffffff",
          fontSize:"10px",
          fontWeight:"800"
        },
        icon:{
          path:google.maps.SymbolPath.CIRCLE,
          fillColor:point.color,
          fillOpacity:1,
          strokeColor:"#ffffff",
          strokeWeight:selected.id === point.id ? 4 : 3,
          scale:selected.id === point.id ? 18 : 15
        },
        zIndex:selected.id === point.id ? 20 : 10
      });
      marker.addListener("click", () => {
        setSelected(point);
        setSheet("places");
        setSheetCollapsed(false);
        mapRef.current.panTo({ lat:point.lat, lng:point.lng });
      });
      markerLayerRef.current.push(marker);
    });
  }, [googleReady, category, selected.id, hotel, placeResults, savedPlaces, guideRecommendations]);

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

  const searchGooglePlaces = async () => {
    if (!placeQuery.trim()) return;
    setPlaceSearching(true);
    setPlaceResults([]);
    const preservedZoom = mapRef.current?.getZoom();
    try {
      const google = (window as any).google;
      const { Place } = await google.maps.importLibrary("places");
      const center = mapRef.current?.getCenter();
      const { places } = await Place.searchByText({
        textQuery:`${placeQuery.trim()} ${travelArea.trim() || "일본"}`,
        fields:["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","rating","userRatingCount","regularOpeningHours","businessStatus"],
        locationBias:center ? { center, radius:7000 } : undefined,
        language:"ko",
        maxResultCount:12
      });
      const next:Point[] = places.filter((place:any) => place.location).map((place:any, index:number) => {
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
        ,placeType:details.placeType, rating:details.rating, reviewCount:details.reviewCount, businessStatus:details.businessStatus
      }});
      setPlaceResults(next);
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
      localStorage.setItem("travel-search-area", travelArea.trim());
      setPlaceResults([]);
      setGuideRecommendations([]);
      await buildAreaGuide(areaResults[0].geometry.location);
    } catch {
      setRouteError("지역을 찾지 못했어요. 예: 교토, 오사카, 삿포로처럼 입력해 주세요.");
    } finally {
      setAreaMoving(false);
    }
  };

  const buildAreaGuide = async (providedCenter?: any) => {
    if (!travelArea.trim()) return;
    setGuideLoading(true);
    setGuideRecommendations([]);
    setRouteError("");
    try {
      const google = (window as any).google;
      let center = providedCenter;
      if (!center?.lat) {
        const geocoder = new google.maps.Geocoder();
        const { results:areaResults } = await geocoder.geocode({ address:`${travelArea.trim()} 일본`, language:"ko", region:"JP" });
        if (!areaResults?.[0]) throw new Error();
        center = areaResults[0].geometry.location;
      }
      mapRef.current?.setCenter(center);
      mapRef.current?.setZoom(13);
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
      const batches = await Promise.all(types.map(async (type) => {
        const { places } = await Place.searchByText({
          textQuery:`${travelArea.trim()} ${type.query}`,
          fields:["id","displayName","formattedAddress","location","googleMapsURI","primaryTypeDisplayName","rating","userRatingCount","regularOpeningHours","businessStatus","photos"],
          locationBias:{ center, radius:30000 },
          language:"ko",
          maxResultCount:5
        });
        return places.filter((place:any)=>place.location).slice(0,4).map((place:any,index:number) => {
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
            photoUrl:place.photos?.[0]?.getURI?.({ maxWidth:400, maxHeight:240 })
          };
        });
      }));
      setGuideRecommendations(batches.flat().filter((point,index,items)=>items.findIndex((item)=>item.name===point.name)===index));
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
    try {
      const q = encodeURIComponent(`${hotelQuery.trim()} ${travelArea.trim()} 日本`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=jp&accept-language=ko&q=${q}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setRouteError("숙소 검색에 실패했어요. 일본어 숙소명이나 전체 주소로 다시 검색해 주세요.");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const next = {
        name:"현재 위치", address:"휴대폰에서 확인한 현재 위치",
        lat:position.coords.latitude, lng:position.coords.longitude
      };
      setHotel(next);
      localStorage.setItem("inuyama-hotel", JSON.stringify(next));
      setOriginId("hotel");
      setSheet("route");
      mapRef.current?.setCenter({lat:next.lat,lng:next.lng});
      mapRef.current?.setZoom(16);
    }, () => setRouteError("위치 권한을 허용하면 현재 위치를 사용할 수 있어요."));
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
      const base = mode === "walk" ? "https://routing.openstreetmap.de/routed-foot" : "https://router.project-osrm.org";
      const res = await fetch(`${base}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const first = data.routes?.[0];
      if (!first) throw new Error();
      const next = {
        minutes:Math.max(1, Math.round(first.duration/60)),
        distance:first.distance/1000,
        coordinates:first.geometry.coordinates.map(([lng,lat]:[number,number]) => [lat,lng] as [number,number])
      };
      setRoute(next);
      drawRoute(next);
    } catch {
      const next = calculateFallback(a,b);
      setRoute(next);
      setRouteError("실시간 경로 연결이 원활하지 않아 직선거리 기반 예상시간을 표시했어요.");
      drawRoute(next);
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

  return (
    <main className="mobile-app">
      <header className="mobile-header">
        <div><small>우리 가족 {travelArea || "일본"} 여행</small><h1>오늘 어디로 갈까요?</h1></div>
        <button className="round-button" onClick={() => {setSheet("hotel");setSheetCollapsed(false);}} aria-label="숙소 등록"><Building2 size={20}/></button>
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
            <div className="sheet-heading"><div><small>{selected.category === "검색" ? "지도에서 선택한 장소" : "추천 장소"}</small><h2>{selected.name}</h2></div></div>
            <div className="category-scroll">
              {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <div className="selected-place">
              <span className="place-dot" style={{background:selected.color}}>{selected.category === "숙소" ? "숙" : selected.name.slice(0,1)}</span>
              <div className="place-main">
                <div className="place-title"><b>{selected.name}</b><small>{selected.sub}</small></div>
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
              {visibleSpots.map((spot) => <button key={spot.id} className={selected.id === spot.id ? "active" : ""} onClick={() => {setSelected(spot); mapRef.current?.panTo({lat:spot.lat,lng:spot.lng});}}><span style={{background:spot.color}}>{spot.name.slice(0,1)}</span><b>{spot.name}</b><small>{spot.sub}</small></button>)}
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
              <input value={placeQuery} onChange={(e)=>setPlaceQuery(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&searchGooglePlaces()} placeholder="식당, 카페, 관광지 검색"/>
              <button onClick={searchGooglePlaces}>{placeSearching ? "검색 중" : "검색"}</button>
            </div>
            <div className="quick-search">
              {["가족 식당","카페 디저트","전통거리","아이와 관광지"].map((query) => <button key={query} onClick={() => {setPlaceQuery(query);}}>{query}</button>)}
            </div>
            <div className="google-results">
              {placeResults.map((point) => (
                <article key={point.id} className="google-result">
                  <button className="result-main" onClick={() => {setSelected(point);setSheet("places");mapRef.current?.panTo({lat:point.lat,lng:point.lng});}}>
                    <MapPin size={17}/><span><b>{point.name}</b><small>{point.sub}</small></span>
                  </button>
                  <button className="result-save" onClick={() => toggleSavedPlace(point)} aria-label="저장"><Heart size={16} fill={savedPlaces.some((item) => item.id === point.id) ? "currentColor" : "none"}/></button>
                  <button className="result-route" onClick={() => {setDestinationId(point.id);setSheet("route");}} aria-label="길찾기"><Navigation size={16}/></button>
                </article>
              ))}
            </div>
            {!placeSearching && placeResults.length === 0 && <p className="empty-saved">장소명을 검색하거나 지도 위의 상점·명소를 눌러보세요.</p>}
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

        {sheet === "hotel" && (
          <>
            <div className="sheet-heading"><div><small>출발지로 바로 사용</small><h2>내 숙소 등록</h2></div><button className="icon-close" onClick={() => setSheet("places")}><X size={20}/></button></div>
            {hotel && <div className="saved-hotel"><Building2 size={19}/><div><b>{hotel.name}</b><small>{hotel.address}</small></div><button onClick={() => {localStorage.removeItem("inuyama-hotel");setHotel(null);setOriginId("station");}}>삭제</button></div>}
            <div className="hotel-search">
              <Search size={18}/>
              <input value={hotelQuery} onChange={(e)=>setHotelQuery(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&searchHotel()} placeholder="숙소명 또는 일본 주소 입력"/>
              <button onClick={searchHotel}>{searching ? "검색 중" : "검색"}</button>
            </div>
            <button className="current-location" onClick={useCurrentLocation}><LocateFixed size={18}/><div><b>현재 위치 사용</b><small>숙소에 도착한 뒤 등록할 때 편해요</small></div></button>
            <div className="search-results">
              {results.map((result, index) => <button key={`${result.lat}-${index}`} onClick={() => chooseHotel(result)}><MapPin size={17}/><div><b>{result.name || result.display_name.split(",")[0]}</b><small>{result.display_name}</small></div></button>)}
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
            </div>
            <div className="route-selects">
              <label><span className="origin-dot"/><div><small>출발지</small><select value={originId} onChange={(e)=>setOriginId(e.target.value)}><option value="station">이누야마역</option>{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}{spots.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}{savedPlaces.map((p)=><option key={`saved-from-${p.id}`} value={p.id}>저장 · {p.name}</option>)}</select></div></label>
              <div className="route-line"/>
              <label><span className="dest-dot"/><div><small>도착지</small><select value={destinationId} onChange={(e)=>setDestinationId(e.target.value)}>{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}<option value="station">이누야마역</option>{spots.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}{savedPlaces.map((p)=><option key={`saved-to-${p.id}`} value={p.id}>저장 · {p.name}</option>)}</select></div></label>
            </div>
            <button className="calculate-button" onClick={getRoute} disabled={routeLoading}>{routeLoading ? "경로 계산 중…" : <><Navigation size={18}/> 이동시간 계산하기</>}</button>
            {route && <div className="route-summary"><div><Clock3/><span><small>예상 이동시간</small><b>약 {route.minutes}분</b></span></div><div><Navigation/><span><small>이동거리</small><b>{distanceText(route.distance)}</b></span></div></div>}
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
                  ? [...savedPlaces, ...guideRecommendations].filter((point,index,items)=>items.findIndex((item)=>item.name===point.name)===index)
                  : savedPlaces.length ? savedPlaces : spots.slice(0,8);
                const mapPlaces = guidePlaces.slice(0,20);
                const minLat = Math.min(...guidePlaces.map((p)=>p.lat)), maxLat = Math.max(...guidePlaces.map((p)=>p.lat));
                const minLng = Math.min(...guidePlaces.map((p)=>p.lng)), maxLng = Math.max(...guidePlaces.map((p)=>p.lng));
                const dateText = guideStart ? `${guideStart.replaceAll("-",". ")}${guideEnd ? ` ~ ${guideEnd.replaceAll("-",". ")}` : ""}` : "여행 날짜를 입력해 주세요";
                return <>
                  <article className="guide-page guide-cover">
                    <div className="guide-title"><div><small>MY FAMILY TRAVEL GUIDE</small><h2>{travelArea || "일본"} 여행 지도</h2><p>저장한 장소를 한눈에 보는 우리 가족 맞춤 가이드</p></div><div className="guide-date"><CalendarDays/><span>{dateText}</span></div></div>
                    <div className="guide-map-board">
                      <div className="guide-grid"/>
                      {mapPlaces.map((point,index) => {
                        const left = 8 + ((point.lng-minLng)/(maxLng-minLng || 1))*82;
                        const top = 9 + (1-(point.lat-minLat)/(maxLat-minLat || 1))*76;
                        return <div className="guide-map-pin" key={point.id} style={{left:`${left}%`,top:`${top}%`,background:point.color}}><b>{index+1}</b><span>{point.name}</span></div>;
                      })}
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
                        {point.rating && <strong>★ {point.rating.toFixed(1)} · 후기 {point.reviewCount?.toLocaleString("ko-KR") || 0}개</strong>}
                        <footer><MapPin size={13}/>{point.sub}</footer>
                      </div>)}
                    </div>
                  </article>

                  <article className="guide-page guide-food-page">
                    <div className="guide-page-title"><small>LOCAL PICKS & FAMILY TIPS</small><h2>{travelArea || "일본"} 장소별 가이드</h2><span>{dateText}</span></div>
                    {["관광","맛집","카페","디저트","쇼핑","전통시장","주류","이자카야·술집","온천·휴식","아이와 함께","역사"].map((group) => {
                      const items = guidePlaces.filter((point)=>guideGroup(point)===group);
                      if (!items.length) return null;
                      return <section className="guide-group" key={group}><h3>{group}</h3><div>{items.map((point,index)=><article key={point.id}>
                        <b>{index+1}. {point.name}</b><small>{point.hours || "방문 전 운영시간 확인"}</small><p>{point.description}</p>
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
