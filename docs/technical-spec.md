# Guide-trip 기술문서

## 1. 현재 스택

- Frontend: React 19, Vinext
- Styling: `app/globals.css`
- Icons: `lucide-react`
- Map: Leaflet + OpenStreetMap tile
- Auth/DB/Storage: Supabase
- Text AI: DeepSeek API
- AI Guidebook Job: Supabase job + Codex 로컬 처리 스크립트
- Hosting: OpenAI Sites

## 2. 주요 파일

- `app/page.tsx`: 메인 모바일 앱, 지도, 바텀시트, 추천, 상세, 길찾기, 가이드북 UI
- `app/globals.css`: 전역 스타일과 모바일 레이아웃
- `app/lib/supabase-client.ts`: 브라우저 Supabase 클라이언트
- `app/api/auth-config/route.ts`: 배포 환경의 Supabase public config 제공
- `app/api/trips/route.ts`: 사용자 여행 상태 저장/조회
- `app/api/guidebooks/route.ts`: AI 가이드북 요청/상태 조회
- `scripts/list-guidebook-jobs.mjs`: pending 가이드북 job 조회 및 prompt 생성
- `scripts/publish-guidebook-job.mjs`: 생성된 이미지 업로드 및 job ready/failed 반영
- `supabase/schema.sql`: Supabase 테이블/RLS 스키마

## 3. 제거된 Google Cloud API

이번 구조에서는 아래 Google Cloud API를 사용하지 않는다.

- Maps JavaScript API
- Places API New Text Search
- Places API New Place Details
- Places Photos
- Geocoding API
- Directions API
- Static Maps API

`app/api/maps-key/route.ts`는 삭제되었고, `.env.example`과 `CLAUDE.md`에서도 `GOOGLE_MAPS_API_KEY`가 제거되었다.

## 4. 지도 구조

`app/page.tsx`에서 Leaflet을 직접 import한다.

- `L.map(...)`으로 지도 생성
- `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` 타일 사용
- `L.marker(...)`와 `L.divIcon(...)`으로 커스텀 마커 표시
- `L.polyline(...)`으로 예상 이동 경로 표시

주의: OpenStreetMap 기본 타일은 대규모 상업 트래픽에 적합하지 않다. 상용 전환 시 MapTiler, Stadia Maps, 자체 타일 서버, 네이버/카카오/Mapbox 등 별도 정책 검토가 필요하다.

## 5. 추천 구조

Google Places 후보 수집을 제거하고 다음 흐름으로 변경했다.

1. 사용자가 지역을 입력한다.
2. `resolveAreaCenter()`가 알려진 지역이면 좌표를 반환한다.
3. 알려지지 않은 지역은 국가 힌트에 따라 서울 또는 도쿄 중심 fallback을 사용한다.
4. `localRecommendationCandidates()`가 카테고리별 기본 후보를 만든다.
5. `/api/ai-recommend`가 후보를 가족 여행 관점으로 재정렬하고 문구를 보강한다.
6. 실패 시 로컬 후보 그대로 표시한다.

현재 후보는 실제 POI 데이터가 아니므로, 기획 확정 후 저비용 실제 장소 데이터 소스를 붙이는 것이 다음 단계다.

## 6. 장소 상세 구조

장소 상세는 현재 저장된 `Point` 데이터와 AI 보강 필드를 기반으로 렌더링한다.

- `description`, `listSummary`
- `aiReason`
- `aiRecommendedItems`
- `aiPrice`
- `aiFamilyTip`
- `aiVisitTip`
- `aiParkingTip`

기존 Google 상세 자동 호출은 제거되었다. 오래된 저장 데이터에 남은 `googlePlaceId` 필드는 호환성 때문에 타입에 남아 있을 수 있지만, Google Cloud API 호출에는 사용하지 않는다.

## 7. 길찾기 구조

실시간 Directions API를 제거했다.

- `calculateFallback()`이 위도/경도 직선거리 기반 예상 이동시간을 계산한다.
- 도보/차량 모드에 따라 속도와 보정 계수를 다르게 적용한다.
- 지도에는 `L.polyline()`으로 출발지-도착지 선을 표시한다.
- 외부 지도 열기는 OpenStreetMap directions URL을 사용한다.

정확한 대중교통/차량 경로가 필요하면 상용 전환 때 OSRM, Valhalla, GraphHopper, Mapbox Directions 등 비용과 정책을 비교해야 한다.

## 8. Supabase 구조

예상 테이블:

- `trip_profiles`: 사용자별 여행 지역, 국가, 일정, 구성원, 숙소, 저장 장소, 지역 중심점
- `guidebook_jobs`: AI 가이드북 생성 요청 상태
- Supabase Storage bucket: 가이드북 이미지 저장

RLS 원칙:

- 사용자는 본인 `auth.uid()`에 해당하는 여행 상태만 읽고 쓸 수 있다.
- 서비스 롤 키는 로컬 Codex 업로드 스크립트와 서버 작업에만 사용한다.
- 서비스 롤 키는 클라이언트 번들에 절대 노출하지 않는다.

## 9. AI 가이드북 처리

개발 단계:

1. 사이트에서 생성 요청을 누른다.
2. `/api/guidebooks`가 Supabase에 pending job을 저장한다.
3. Codex 자동화가 `npm.cmd run codex:guidebook-jobs`로 pending job을 확인한다.
4. `image_gen`으로 A4 가로 여행잡지/인포그래픽 이미지 2장을 생성한다.
5. `npm.cmd run codex:publish-guidebook -- --user ... --job ... --images ...`로 업로드한다.
6. 사이트는 polling으로 ready 상태와 이미지 URL을 받아 표시한다.

상용 단계:

- Codex 로컬 처리 대신 서버 워커 또는 OpenAI Images API 기반 비동기 워커로 전환한다.
- 작업 큐, 실패 재시도, 사용자별 요청 제한, 비용 추적이 필요하다.

## 10. 환경변수

필수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`

제거:

- `GOOGLE_MAPS_API_KEY`

## 11. 현재 제한사항

- Google Places를 제거했기 때문에 실제 장소 사진, 리뷰, 영업시간, 전화번호, 웹사이트 정확도는 낮아진다.
- 지역 좌표는 알려진 주요 도시 중심 fallback 기반이다.
- 추천 후보는 실제 POI 검색 결과가 아니라 AI/로컬 후보 기반이다.
- 경로는 실제 도로/철도 경로가 아니라 예상치다.
- OpenStreetMap 타일 정책상 트래픽 증가 시 별도 타일 공급자가 필요하다.

## 12. 다음 개발 제안

- 실제 장소 데이터 소스 선정
- 지역 검색 정확도 개선
- POI 후보 저장 테이블 추가
- AI 추천 품질 평가 플로우 추가
- 가이드북 생성 워커 상용화
- 비용 제한/사용량 대시보드 구축

