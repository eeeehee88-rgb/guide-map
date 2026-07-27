"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Car, ChevronRight, Clock3, Footprints, MapPin, Navigation, Sparkles, Train, Users } from "lucide-react";

type Category = "전체" | "맛집" | "카페·디저트" | "역사·관광";

type Place = {
  id: number;
  name: string;
  jp: string;
  category: Exclude<Category, "전체">;
  lat: number;
  lng: number;
  walk: string;
  drive?: string;
  hours: string;
  summary: string;
  why: string;
  tags: string[];
  color: string;
  google: string;
  source: string;
};

const places: Place[] = [
  {
    id: 1, name: "키린테이", jp: "キリン亭", category: "맛집",
    lat: 35.38118, lng: 136.94755, walk: "역에서 약 4분", drive: "주차 3~4대",
    hours: "점심 11:00–14:30 · 저녁 영업은 요일 확인", color: "#e65d35",
    summary: "1927년부터 이어진 동네 식당. 일본식 정식과 ‘이누야마 덴가쿠 돈가스’처럼 세대가 함께 먹기 편한 메뉴가 강점.",
    why: "도착일 첫 끼에 특히 좋음. 역과 가깝고 50석 규모라 다섯 가족이 비교적 편하다.",
    tags: ["현지 노포", "가족 식사", "역 근처"], google: "キリン亭 犬山", source: "https://www.kirintei.jp/"
  },
  {
    id: 2, name: "마쓰노야", jp: "松野屋", category: "맛집",
    lat: 35.3805671, lng: 136.9357340, walk: "역에서 약 13–15분", drive: "주차 23대",
    hours: "11:00–15:00 · 목요일 휴무", color: "#e65d35",
    summary: "메이지 시대부터 이어온 덴가쿠 전문점. 두부·토란·돼지고기 덴가쿠와 나메시가 대표 메뉴.",
    why: "이 가족 구성에는 가장 안정적인 로컬 점심 후보. 좌석이 넓고 차량 이용 시 편하다.",
    tags: ["140년 노포", "넓은 좌석", "차량 추천"], google: "松野屋 犬山", source: "https://inuyama.gr.jp/gourmet/detail/28/"
  },
  {
    id: 3, name: "혼마치 사료", jp: "本町茶寮", category: "카페·디저트",
    lat: 35.3831648, lng: 136.9395343, walk: "역에서 약 10분", drive: "전용 주차 없음",
    hours: "11:00–17:00 · 연중무휴 안내", color: "#bd6b8f",
    summary: "100년 된 고민가를 개조한 화과자·말차 카페. 7종 덴가쿠 정식과 금붕어 디저트가 인기.",
    why: "어른은 전통 가옥과 말차, 아이들은 알록달록한 디저트를 즐기기 좋아 세대 만족도가 높다.",
    tags: ["고민가", "말차", "아이 취향"], google: "本町茶寮 犬山", source: "https://inuyama.gr.jp/gourmet/detail/17/"
  },
  {
    id: 4, name: "주효야 이누야마 이노우에테이", jp: "香味茶寮 壽俵屋 犬山井上邸", category: "맛집",
    lat: 35.38470, lng: 136.93920, walk: "역에서 약 12분", drive: "성하마을 공영주차장 이용",
    hours: "10:00–16:30 · 방문 전 확인", color: "#e65d35",
    summary: "모리구치즈케 노포의 식사 공간. 생선 카스즈케 정식과 구운 주먹밥 ‘간장 누룽지 꼬치’가 명물.",
    why: "좌식 공간이 있어 천천히 쉬며 먹기 좋다. 식사와 가벼운 길거리 간식을 모두 해결 가능.",
    tags: ["지역 특산물", "좌식 좌석", "성하마을"], google: "香味茶寮 壽俵屋 犬山井上邸", source: "https://inuyama.gr.jp/gourmet/detail/11/"
  },
  {
    id: 5, name: "하치카페 이누야마", jp: "ハチカフェ 犬山店", category: "카페·디저트",
    lat: 35.37995, lng: 136.94395, walk: "역 서쪽 출구 바로 근처", drive: "인근 유료주차장",
    hours: "운영일·시간은 공식 페이지 확인", color: "#bd6b8f",
    summary: "타르트와 샌드위치 전문 카페. 잔디광장 같은 넓은 키즈 스페이스가 있는 것이 장점.",
    why: "5살 아이가 답답해질 때 쓰기 좋은 ‘안전한 휴식 카드’. 도착·출발 전 들르기도 편하다.",
    tags: ["키즈 공간", "타르트", "역 근처"], google: "ハチカフェ 犬山店", source: "https://hachicafe.jp/aboutus/inuyama/"
  },
  {
    id: 6, name: "이누야마 성하마을", jp: "犬山城下町・本町通り", category: "역사·관광",
    lat: 35.38420, lng: 136.93955, walk: "역에서 약 10분", drive: "주말 차량 진입보다 공영주차장",
    hours: "거리 산책 자유 · 상점은 대체로 낮 영업", color: "#2f7a68",
    summary: "에도시대 거리 축이 남은 혼마치도리. 전통가옥, 꼬치 간식, 공방과 작은 박물관이 이어진다.",
    why: "한 번의 동선으로 역사·간식·카페를 묶을 수 있어 세 세대 여행의 중심축으로 적합하다.",
    tags: ["핵심 산책길", "먹거리", "평지 중심"], google: "犬山城下町 本町通り", source: "https://inuyama.gr.jp/"
  },
  {
    id: 7, name: "돈덴칸", jp: "どんでん館", category: "역사·관광",
    lat: 35.38255, lng: 136.93947, walk: "역에서 약 8분", drive: "성하마을 주차 후 도보",
    hours: "관람 시간·휴관일은 당일 확인", color: "#2f7a68",
    summary: "이누야마 축제의 실제 수레를 가까이서 보는 전시관. 짧고 실내라 날씨가 나쁠 때 유용하다.",
    why: "성이 힘든 할머니나 5살 아이에게 대체 코스로 좋다. 관람 부담이 작고 사진도 잘 나온다.",
    tags: ["실내", "축제 수레", "짧은 관람"], google: "どんでん館 犬山", source: "https://inuyama.gr.jp/"
  },
  {
    id: 8, name: "가라쿠리 뮤지엄", jp: "IMASEN 犬山からくりミュージアム", category: "역사·관광",
    lat: 35.3854034, lng: 136.9392384, walk: "역에서 약 14분", drive: "성하마을 주차 후 도보",
    hours: "관람 시간·실연 시간은 공식 안내 확인", color: "#2f7a68",
    summary: "축제 수레에 쓰인 전통 기계인형 ‘가라쿠리’를 소개하는 작은 박물관.",
    why: "9살 아이에게는 구조와 움직임이 흥미롭고, 어른에게는 지역 축제 문화를 이해하기 좋다.",
    tags: ["아이 흥미", "전통 기술", "실내"], google: "IMASEN 犬山からくりミュージアム", source: "https://inuyama.gr.jp/"
  },
  {
    id: 9, name: "산코 이나리 신사", jp: "三光稲荷神社", category: "역사·관광",
    lat: 35.3864590, lng: 136.9392750, walk: "역에서 약 18분", drive: "성 주변 공영주차장",
    hours: "경내 참배 가능 · 수여소 시간 별도", color: "#2f7a68",
    summary: "붉은 도리이와 하트 모양 에마로 유명한 성 아래 신사. 이누야마성 입구와 바로 이어진다.",
    why: "아이들이 사진 찍기 좋아하고 가족 화목을 빌기 좋다. 성을 오르지 않아도 여행 분위기가 난다.",
    tags: ["사진 명소", "가족 기원", "성 아래"], google: "三光稲荷神社 犬山", source: "https://inuyama.gr.jp/"
  },
  {
    id: 10, name: "하리쓰나 신사", jp: "針綱神社", category: "역사·관광",
    lat: 35.3873270, lng: 136.9398404, walk: "역에서 약 19분", drive: "성 주변 공영주차장",
    hours: "경내 참배 가능", color: "#2f7a68",
    summary: "이누야마 축제의 중심 신사. 성으로 향하는 길목에서 지역의 오래된 신앙과 축제 문화를 만난다.",
    why: "산코 이나리와 붙어 있어 이동을 거의 늘리지 않고 두 곳을 함께 볼 수 있다.",
    tags: ["축제 역사", "짧은 동선", "성 아래"], google: "針綱神社 犬山", source: "https://inuyama.gr.jp/"
  },
  {
    id: 11, name: "국보 이누야마성", jp: "国宝 犬山城", category: "역사·관광",
    lat: 35.3883304, lng: 136.9392776, walk: "역에서 약 22분", drive: "제1·제2 공영주차장",
    hours: "입장·대기시간은 당일 공식 사이트 확인", color: "#2f7a68",
    summary: "현존하는 가장 오래된 축에 드는 목조 천수. 기소강과 노비평야를 내려다보는 전망이 핵심.",
    why: "가족 대표 관광지지만 천수 내부 계단이 매우 가파르다. 할머니와 5살 아이는 아래에서 쉬는 선택도 권장.",
    tags: ["국보", "가파른 계단", "대표 명소"], google: "国宝 犬山城", source: "https://inuyama-castle.jp/"
  },
  {
    id: 12, name: "호텔 인디고 정원·기소강변", jp: "木曽川遊歩道・犬山橋周辺", category: "역사·관광",
    lat: 35.39005, lng: 136.94440, walk: "이누야마유엔역과 연계", drive: "차량 이동이 편함",
    hours: "산책 자유", color: "#2f7a68",
    summary: "성 북동쪽 기소강을 따라 걷는 완만한 산책 구간. 물가에서 이누야마성을 바라볼 수 있다.",
    why: "계단 많은 성 내부 대신 할머니와 아이가 여유롭게 즐길 수 있는 풍경 코스.",
    tags: ["완만한 산책", "강 전망", "휴식"], google: "木曽川遊歩道 犬山", source: "https://inuyama.gr.jp/"
  }
];

const categories: Category[] = ["전체", "맛집", "카페·디저트", "역사·관광"];

export default function Home() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<Map<number, any>>(new Map());
  const [category, setCategory] = useState<Category>("전체");
  const [selected, setSelected] = useState<Place>(places[0]);
  const [route, setRoute] = useState<"walk" | "car">("walk");

  const filtered = useMemo(
    () => category === "전체" ? places : places.filter((place) => place.category === category),
    [category]
  );

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current, { zoomControl: false }).setView([35.3846, 136.9414], 15);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      places.forEach((place) => {
        const icon = L.divIcon({
          className: "custom-marker-shell",
          html: `<button class="map-marker" style="--marker:${place.color}" aria-label="${place.name}"><span>${place.id}</span></button>`,
          iconSize: [38, 46],
          iconAnchor: [19, 44]
        });
        const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
        marker.on("click", () => {
          setSelected(place);
          map.panTo([place.lat, place.lng], { animate: true });
        });
        markerRef.current.set(place.id, marker);
      });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    markerRef.current.forEach((marker, id) => {
      const show = filtered.some((place) => place.id === id);
      if (show && !mapRef.current.hasLayer(marker)) marker.addTo(mapRef.current);
      if (!show && mapRef.current.hasLayer(marker)) marker.remove();
    });
  }, [filtered]);

  const pick = (place: Place) => {
    setSelected(place);
    mapRef.current?.setView([place.lat, place.lng], Math.max(mapRef.current.getZoom(), 16), { animate: true });
  };

  const mapsUrl = (place: Place) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.google)}`;

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">犬</span><div><b>INUYAMA</b><small>FAMILY GUIDE</small></div></div>
        <div className="family-pill"><Users size={16} /> 할머니 · 부모님 · 9세 · 5세</div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={15} /> 세 세대를 위한 느긋한 여행</div>
        <h1>걷고, 쉬고, 맛보는<br /><em>이누야마 가족 지도</em></h1>
        <p>이누야마역에서 성하마을까지. 로컬 노포와 전통 거리, 아이들이 좋아할 디저트를 실제 거리 위에서 한눈에 확인하세요.</p>
        <div className="hero-stats">
          <span><MapPin size={17} /><b>12</b> 추천 장소</span>
          <span><Footprints size={17} /><b>1.8km</b> 핵심 산책축</span>
          <span><Clock3 size={17} /><b>반나절</b> 기본 코스</span>
        </div>
      </section>

      <section className="map-section">
        <div className="map-toolbar">
          <div className="filters">
            {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="route-toggle">
            <button className={route === "walk" ? "active" : ""} onClick={() => setRoute("walk")}><Footprints size={16} /> 도보</button>
            <button className={route === "car" ? "active" : ""} onClick={() => setRoute("car")}><Car size={16} /> 차량</button>
          </div>
        </div>

        <div className="map-layout">
          <aside className="place-list">
            <div className="list-head"><span>{category}</span><small>{filtered.length}곳</small></div>
            {filtered.map((place) => (
              <button key={place.id} className={`place-card ${selected.id === place.id ? "selected" : ""}`} onClick={() => pick(place)}>
                <span className="card-number" style={{ background: place.color }}>{place.id}</span>
                <span className="card-copy"><b>{place.name}</b><small>{place.jp}</small><i>{place.walk}</i></span>
                <ChevronRight size={18} />
              </button>
            ))}
          </aside>
          <div className="map-wrap">
            <div ref={mapEl} className="map" />
            <div className="map-legend"><span><i className="food" /> 맛집</span><span><i className="cafe" /> 카페</span><span><i className="history" /> 관광</span></div>
          </div>
          <article className="detail-card">
            <div className="detail-top">
              <span className="category-label" style={{ color: selected.color }}>{selected.category}</span>
              <span className="big-number" style={{ color: selected.color }}>{String(selected.id).padStart(2, "0")}</span>
            </div>
            <h2>{selected.name}</h2>
            <p className="jp">{selected.jp}</p>
            <div className="travel-info">
              <span>{route === "walk" ? <Footprints size={17} /> : <Car size={17} />}{route === "walk" ? selected.walk : (selected.drive || "주변 주차장 확인")}</span>
              <span><Clock3 size={17} />{selected.hours}</span>
            </div>
            <p className="summary">{selected.summary}</p>
            <div className="recommend"><b>우리 가족에게 좋은 이유</b><p>{selected.why}</p></div>
            <div className="tags">{selected.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>
            <div className="detail-actions">
              <a href={mapsUrl(selected)} target="_blank" rel="noreferrer"><Navigation size={17} /> 구글지도에서 길찾기</a>
              <a className="source-link" href={selected.source} target="_blank" rel="noreferrer">공식 정보</a>
            </div>
          </article>
        </div>
      </section>

      <section className="course">
        <div className="section-title"><span>추천 동선</span><h2>무리 없는 반나절 코스</h2><p>오전에는 관광, 점심 이후에는 카페를 두어 아이와 할머니의 체력을 함께 고려했습니다.</p></div>
        <div className="timeline">
          <div><time>09:30</time><span className="dot" /><article><b>이누야마역 출발</b><p>서쪽 출구에서 성하마을 방향으로 천천히 이동</p></article></div>
          <div><time>09:45</time><span className="dot" /><article><b>돈덴칸 → 혼마치도리</b><p>실내 전시를 먼저 보고 평지 중심 전통거리 산책</p></article></div>
          <div><time>10:45</time><span className="dot" /><article><b>신사 2곳과 이누야마성</b><p>성 천수는 가족별 체력에 따라 선택 관람</p></article></div>
          <div><time>12:15</time><span className="dot" /><article><b>로컬 점심</b><p>도보라면 키린테이, 렌터카라면 마쓰노야 추천</p></article></div>
          <div><time>14:00</time><span className="dot" /><article><b>혼마치 사료 또는 하치카페</b><p>전통 디저트 / 키즈 공간 중 컨디션에 맞게 선택</p></article></div>
        </div>
      </section>

      <section className="tips">
        <div><Train /><b>도보·대중교통일 때</b><p>성하마을 중심 동선은 약 1.8km. 돌아올 때 지치면 이누야마유엔역을 활용해 걷는 거리를 줄이세요.</p></div>
        <div><Car /><b>렌터카일 때</b><p>성하마을 안을 차로 옮겨 다니기보다 공영주차장 한 곳에 세운 뒤 도보 이동하는 편이 편합니다.</p></div>
        <div><Users /><b>세 세대 여행 주의점</b><p>이누야마성 천수 계단은 매우 가파릅니다. 할머니와 5살 아이는 성 아래 신사·강변 산책으로 나누는 선택도 좋습니다.</p></div>
      </section>

      <footer>
        <b>INUYAMA FAMILY GUIDE</b>
        <p>영업시간·휴무·입장 대기는 방문 당일 공식 사이트와 구글지도를 다시 확인하세요. 지도 데이터 © OpenStreetMap contributors.</p>
      </footer>
    </main>
  );
}
