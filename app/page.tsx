"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2, Car, Check, ChevronDown, Clock3, Footprints, LocateFixed,
  MapPin, Navigation, Search, SlidersHorizontal, X
} from "lucide-react";

type Category = "전체" | "맛집" | "카페" | "역사";
type Point = {
  id: string; name: string; sub: string; category: Exclude<Category, "전체"> | "숙소";
  lat: number; lng: number; color: string; description: string; tip: string; hours: string; query: string;
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

export default function Home() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [category, setCategory] = useState<Category>("전체");
  const [selected, setSelected] = useState<Point>(spots[0]);
  const [sheet, setSheet] = useState<"places" | "route" | "hotel">("places");
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

  const hotelPoint: Point | null = hotel ? {
    id:"hotel", name:hotel.name, sub:hotel.address, category:"숙소", lat:hotel.lat, lng:hotel.lng,
    color:"#7a5caf", hours:"", description:"내가 등록한 숙소", tip:"", query:hotel.address
  } : null;
  const allPoints = [station, ...(hotelPoint ? [hotelPoint] : []), ...spots];
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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=ko&region=KR&v=weekly&callback=${callback}`;
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
    }
    markerLayerRef.current.forEach((marker) => marker.setMap(null));
    markerLayerRef.current = [];
    [station, ...(hotelPoint ? [hotelPoint] : []), ...visibleSpots].forEach((point) => {
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
        mapRef.current.panTo({ lat:point.lat, lng:point.lng });
      });
      markerLayerRef.current.push(marker);
    });
  }, [googleReady, category, selected.id, hotel]);

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

  const searchHotel = async () => {
    if (!hotelQuery.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const q = encodeURIComponent(`${hotelQuery.trim()} 犬山 愛知 日本`);
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
    mapRef.current?.setCenter({lat:35.3845,lng:136.9417});
    mapRef.current?.setZoom(15);
  };

  return (
    <main className="mobile-app">
      <header className="mobile-header">
        <div><small>우리 가족 이누야마 여행</small><h1>오늘 어디로 갈까요?</h1></div>
        <button className="round-button" onClick={() => setSheet("hotel")} aria-label="숙소 등록"><Building2 size={20}/></button>
      </header>

      <div className="status-row">
        <button className={`hotel-status ${hotel ? "saved" : ""}`} onClick={() => setSheet("hotel")}>
          <Building2 size={15}/>
          <span>{hotel ? hotel.name : "숙소를 등록해 주세요"}</span>
          {hotel ? <Check size={15}/> : <ChevronDown size={15}/>}
        </button>
        <button className="route-shortcut" onClick={() => setSheet("route")}><Navigation size={15}/> 길찾기</button>
      </div>

      <section className="mobile-map-wrap">
        <div ref={mapEl} className="mobile-map"/>
        <button className="locate-button" onClick={useCurrentLocation}><LocateFixed size={18}/></button>
        <div className="map-language"><span>가</span> 한글 지도</div>
      </section>

      <nav className="bottom-tabs">
        <button className={sheet === "places" ? "active" : ""} onClick={() => setSheet("places")}><MapPin size={19}/><span>장소</span></button>
        <button className={sheet === "route" ? "active" : ""} onClick={() => setSheet("route")}><Navigation size={19}/><span>길찾기</span></button>
        <button className={sheet === "hotel" ? "active" : ""} onClick={() => setSheet("hotel")}><Building2 size={19}/><span>내 숙소</span></button>
      </nav>

      <section className={`bottom-sheet ${sheet}`}>
        <div className="sheet-handle"/>
        {sheet === "places" && (
          <>
            <div className="sheet-heading"><div><small>추천 장소</small><h2>{selected.name}</h2></div><SlidersHorizontal size={19}/></div>
            <div className="category-scroll">
              {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <div className="selected-place">
              <span className="place-dot" style={{background:selected.color}}>{selected.category === "숙소" ? "숙" : selected.name.slice(0,1)}</span>
              <div className="place-main"><div className="place-title"><b>{selected.name}</b><small>{selected.sub}</small></div><p>{selected.description}</p>{selected.tip && <div className="family-tip">가족 추천 · {selected.tip}</div>}</div>
            </div>
            <div className="place-actions">
              <button onClick={() => { setDestinationId(selected.id); setSheet("route"); }}><Navigation size={17}/> 여기까지 길찾기</button>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.query)}`} target="_blank" rel="noreferrer">구글지도</a>
            </div>
            <div className="spot-strip">
              {visibleSpots.map((spot) => <button key={spot.id} className={selected.id === spot.id ? "active" : ""} onClick={() => {setSelected(spot); mapRef.current?.panTo({lat:spot.lat,lng:spot.lng});}}><span style={{background:spot.color}}>{spot.name.slice(0,1)}</span><b>{spot.name}</b><small>{spot.sub}</small></button>)}
            </div>
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
              <label><span className="origin-dot"/><div><small>출발지</small><select value={originId} onChange={(e)=>setOriginId(e.target.value)}><option value="station">이누야마역</option>{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}{spots.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div></label>
              <div className="route-line"/>
              <label><span className="dest-dot"/><div><small>도착지</small><select value={destinationId} onChange={(e)=>setDestinationId(e.target.value)}>{hotel && <option value="hotel">내 숙소 · {hotel.name}</option>}<option value="station">이누야마역</option>{spots.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div></label>
            </div>
            <button className="calculate-button" onClick={getRoute} disabled={routeLoading}>{routeLoading ? "경로 계산 중…" : <><Navigation size={18}/> 이동시간 계산하기</>}</button>
            {route && <div className="route-summary"><div><Clock3/><span><small>예상 이동시간</small><b>약 {route.minutes}분</b></span></div><div><Navigation/><span><small>이동거리</small><b>{distanceText(route.distance)}</b></span></div></div>}
            {routeError && <p className="route-error">{routeError}</p>}
          </>
        )}
      </section>
    </main>
  );
}
