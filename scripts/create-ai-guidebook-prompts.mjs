import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith("--") ? next : "true";
    if (next && !next.startsWith("--")) i += 1;
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node scripts/create-ai-guidebook-prompts.mjs --area \"오키나와\" --start 2026-08-01 --end 2026-08-03",
    "",
    "Options:",
    "  --area   여행 지역",
    "  --start  여행 시작일, YYYY-MM-DD",
    "  --end    여행 종료일, YYYY-MM-DD",
    "  --out    출력 폴더, 기본값 tmp/ai-guidebook-prompts",
  ].join("\n");
}

function dateText(start, end) {
  if (!start && !end) return "일정 미정";
  if (start && !end) return `${start} 출발`;
  if (!start && end) return `${end} 도착`;
  return `${start} ~ ${end}`;
}

function durationText(start, end) {
  if (!start || !end) return "";
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  return nights >= 0 ? `${nights}박 ${nights + 1}일` : "";
}

function slugify(value) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (ascii) return ascii;
  return encodeURIComponent(value).replace(/%/g, "").toLowerCase().slice(0, 40) || "guidebook";
}

function spreadPrompt(input) {
  const schedule = dateText(input.start, input.end);
  const duration = durationText(input.start, input.end) || "여행 기간";
  return `
아래 조건으로 여행 가이드북 인포그래픽 이미지를 만든다.

입력 조건:
- 지역: ${input.area}
- 여행 기간: ${duration}
- 여행 일정: ${schedule}
- 이 서비스에서는 지역과 여행 기간만 조건으로 사용한다.
- 기존 추천 리스트, 장소 상세, 추천 카드와는 완전히 별도 산출물이다.

최종 산출물:
- 한 장의 고해상도 가로형 이미지.
- 이미지 안에 PAGE 1, PAGE 2, PAGE 3 또는 DAY 1, DAY 2, DAY 3 구역이 모두 보여야 한다.
- 오키나와 예시처럼 여행잡지/지도책/인포그래픽이 결합된 밀도 높은 구성으로 만든다.
- A4 가로 3장을 펼친 느낌 또는 3단 가로 인포그래픽 보드 느낌.
- 카드, 지도, 번호, 사진, 아이콘, 일정표, 팁 박스, 체크리스트가 한 화면에 풍부하게 보여야 한다.

기본 스타일:
- 일본 여행잡지 + 손그림 지도 + 현대적 인포그래픽 스타일.
- 따뜻한 베이지, 아이보리, 파스텔톤 배경.
- 파란색 섹션 헤더, 주황색/빨간색 번호 마커, 초록색 체크리스트, 여행책 같은 종이 질감.
- 귀엽고 아기자기한 미니어처 건물, 작은 자동차, 비행기, 열대 식물, 지역 상징 일러스트를 적극 사용한다.
- 빈 공간이 많으면 안 된다. 예시 이미지처럼 정보 밀도가 높아야 한다.

지도 제작 규칙:
- AI가 임의로 위치를 배치하지 않는다.
- Google Maps 실제 지도를 기준으로 도로, 골목, 건물 위치, 철도, 역, 강, 해변, 공원, 관광지를 실제 거리 비율에 맞게 구성한다.
- 지도는 실제 지도를 그대로 복사하지 말고 손그림 일러스트 지도처럼 표현한다.
- 지도 번호와 우측/하단 설명 번호는 100% 일치해야 한다.
- 없는 번호, 중복 번호가 있으면 안 된다.

색상/번호 규칙:
- 번호는 1번부터 끝까지 이어진다.
- 🟠 관광지, 🔴 맛집, 🟢 쇼핑, 🔵 마켓, 🟣 카페, 🟡 사진스팟, ⚫ 교통으로 구분한다.
- 각 번호는 지도와 설명 박스에 모두 존재해야 한다.

PAGE 1 / DAY 1:
- 지역 전체 제목을 크게 배치한다. 예: "${input.area} ${duration}".
- 중심 지도와 첫날 추천 코스를 가장 크게 보여준다.
- 좌측에는 작은 위치도, 교통 정보, 지도 범례를 둔다.
- 우측에는 추천 스팟 & 핵심 정보 리스트를 둔다.
- 지도에는 공항/역/주요 관광지/해변/시장/성/신사 등 지역에 맞는 상징을 번호로 표시한다.

PAGE 2 / DAY 2:
- 자연, 드라이브, 산책, 핵심 명소 코스 중심.
- 시간대별 추천 동선, 이동시간, 맛집 카드, 카페/사진명소 카드, 여행 팁 박스를 넣는다.
- 맛집 카드는 대표 음식 사진을 반드시 포함하고 한글 -> 일본어 -> 영문 순으로 표기한다.
- 운영시간, 휴무일, 대표메뉴, 예상금액, 붐비는 시간, 추천시간, 아이동반 여부, 예약 여부, 현금/카드 여부를 작게 표기한다.

PAGE 3 / DAY 3:
- 쇼핑, 귀국, 공항 이동, 기념품 리스트, 체크리스트 중심.
- 지역 한정 기념품, 과자, 전통공예, 술, 차, 식기, 생활용품과 평균가격을 넣는다.
- 여행 유용 정보, 렌터카/대중교통 팁, 비상 연락처, 체크리스트를 넣는다.

사진/아이콘:
- 음식은 대표 메뉴, 건물은 대표 외관, 카페는 대표 좌석, 해변은 대표 전망 느낌으로 표현한다.
- 시간, 도보, 주차, 사진, 쇼핑, 카페, 아이동반, 화장실, ATM, 편의점, 비행기, 렌터카 아이콘을 적극 사용한다.

검수:
- A4 가로 비율 느낌인가.
- PAGE 1/2/3이 모두 보이는가.
- 번호가 지도와 설명에 모두 있는가.
- 지역/여행 기간이 맞는가.
- 예시 이미지처럼 밀도 높고 예쁜 여행 가이드북 이미지인가.
`.trim();
}

const args = parseArgs(process.argv.slice(2));
if (!args.area) {
  console.error(usage());
  process.exit(1);
}

const input = { area: args.area, start: args.start || "", end: args.end || "" };
const duration = durationText(input.start, input.end);
const outDir = path.resolve(args.out || "tmp/ai-guidebook-prompts");
const id = `${slugify(input.area)}${duration ? `-${duration.replace(/\s+/g, "")}` : ""}`;
await mkdir(outDir, { recursive: true });

const prompt = spreadPrompt(input);
await writeFile(path.join(outDir, "guidebook-input.json"), JSON.stringify({ ...input, duration }, null, 2), "utf8");
await writeFile(path.join(outDir, "spread-prompt.md"), prompt, "utf8");
await writeFile(path.join(outDir, "static-manifest-example.json"), JSON.stringify({
  id,
  title: `${input.area}${duration ? ` ${duration}` : ""}`,
  areaAliases: [input.area],
  duration,
  startDate: input.start || undefined,
  endDate: input.end || undefined,
  pages: [`/ai-guidebooks/${id}/spread.png`],
}, null, 2), "utf8");

console.log(`Created guidebook spread prompt in ${outDir}`);
