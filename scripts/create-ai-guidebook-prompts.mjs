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
    "  --area   서비스에서 설정한 여행 지역",
    "  --start  여행 시작일, YYYY-MM-DD",
    "  --end    여행 종료일, YYYY-MM-DD",
    "  --out    출력 폴더, 기본값 tmp/ai-guidebook-prompts",
  ].join("\n");
}

function tripDateText(start, end) {
  if (!start && !end) return "일정 미정";
  if (start && !end) return `${start} 출발`;
  if (!start && end) return `${end} 도착`;
  return `${start} ~ ${end}`;
}

function basePrompt({ area, start, end }) {
  const schedule = tripDateText(start, end);
  return `
여행 가이드북 제작 프롬프트 (최종 버전)

제작 대상:
- 여행 지역: ${area}
- 여행 일정: ${schedule}
- 입력 정보는 위 지역과 일정만 사용한다.
- 장소, 맛집, 쇼핑, 교통, 운영시간은 반드시 실제 Google Maps 기준으로 조사한 뒤 구성한다.
- 최종 결과물은 A4 가로(297×210mm) 비율 이미지 3장이다.
- 각 페이지는 독립 이미지로 생성한다.
- 지도 번호와 설명 번호는 100% 일치해야 한다.

기본 스타일:
A4 가로(297×210mm) 여행 가이드북을 제작한다.
전체 디자인은 일본 여행잡지 + 인포그래픽 스타일이며, 실제로 여행 중 들고 다니며 사용할 수 있는 수준의 정보와 지도를 제작한다.
색감은 따뜻한 베이지, 아이보리, 파스텔톤을 사용하고, 옛 여행책 느낌과 현대적인 인포그래픽을 적절히 섞는다.
전체 페이지는 보기 쉬운 굵은 제목, 색상별 카테고리, 번호 시스템, 사진, 일러스트, 지도, 아이콘을 적극 활용한다.

지도 제작 규칙(가장 중요):
절대 AI가 임의로 배치하지 않는다.
Google Maps 실제 지도를 기준으로 도로, 골목, 건물 위치, 철도, 역, 강, 해변, 공원, 관광지를 실제 거리 비율에 맞게 제작한다.
거리감은 실제 Google Maps 기준으로 최대한 동일하게 표현한다.
위치가 바뀌거나 관광지가 다른 골목으로 이동하면 안 된다.
반드시 Google Maps -> 실제 위치 확인 -> 거리 확인 -> 방향 확인 -> 지도 제작 순으로 진행한다.

지도 스타일:
실제 지도를 그대로 복사하는 것이 아니라 손그림 일러스트 느낌으로 제작한다.
건물은 입체 일러스트 또는 미니어처 느낌으로 표현한다.
골목은 실제 골목처럼 촘촘하게 표현한다.
지도는 귀엽고 아기자기한 느낌을 살린다.

지도 위 표현:
관광지, 맛집, 쇼핑, 마켓, 카페, 시장, 마트, 해변, 사진스팟, 교통을 번호(1~)로 표기한다.
번호는 페이지 전체에서 이어진다.
색상으로 종류를 구분한다.
🟠 관광지 / 🔴 맛집 / 🟢 쇼핑 / 🔵 마켓 / 🟣 카페 / 🟡 사진스팟 / ⚫ 교통

번호 규칙:
지도 번호와 오른쪽 설명 번호가 100% 일치해야 한다.
없는 번호가 있으면 안 된다.
번호가 중복되면 안 된다.
지도에 있는 번호는 반드시 설명에도 존재해야 한다.

지도 안에 들어갈 것:
실제 건물 그림, 관광지 일러스트, 대표 사진, 지역 상징 조형물, 성, 신사, 도자기 굴뚝, 바다, 해변 등을 지역 특성에 맞게 넣는다.
너무 심플한 지도는 금지한다.

위치도:
좌측 상단에는 현재 도시가 전체 지역에서 어디인지 작은 위치도를 넣는다.

맛집 정보:
각 상점은 대표 음식 사진을 반드시 넣는다.
한글 -> 일본어 -> 영문 순으로 표기한다.
운영시간, 휴무일, 대표메뉴, 예상금액, 붐비는 시간, 추천시간, 아이동반 여부, 예약 여부, 현금/카드 여부를 포함한다.
운영시간은 Google -> 공식 홈페이지 -> Tabelog -> 최근 여행후기 순으로 교차검증하여 더블체크 후 작성한다.

쇼핑 리스트:
지역 한정 기념품, 과자, 전통공예, 술, 차, 식기, 도자기, 생활용품 등 지역에서만 살 수 있는 것을 우선 소개하고 평균가격도 넣는다.

사진:
사진은 실제 대표 사진을 사용한다.
음식은 대표 메뉴, 건물은 대표 외관, 카페는 대표 좌석, 해변은 대표 전망을 사용한다.

아이콘:
시간, 도보, 주차, 사진, 쇼핑, 카페, 아이동반, 화장실, ATM, 편의점 아이콘을 적극 사용한다.

여행팁:
매 페이지마다 현지인이 알려주는 팁, 혼잡시간, 사진 잘 나오는 시간, 추천 방문시간, 비오는 날 대체코스, 주의사항을 넣는다.

검수 규칙:
제작 완료 후 스스로 검수한다.
□ 번호가 전부 있는가
□ 번호 위치가 맞는가
□ 실제 Google Maps와 위치가 동일한가
□ 거리감이 맞는가
□ 운영시간이 맞는가
□ 휴무일이 맞는가
□ 사진이 대표사진인가
□ 지도와 설명 번호가 일치하는가
□ A4 가로 비율인가
□ 오탈자가 없는가
□ 한글·일본어 표기가 맞는가
□ 관광지·맛집·쇼핑 분류 색상이 맞는가
□ 여행자가 실제 들고 다니며 길을 찾을 수 있는 수준인가
`.trim();
}

function pagePrompt(page, input) {
  const common = basePrompt(input);
  if (page === 1) {
    return `${common}

이번 이미지는 1페이지다.

1페이지 구성:
- 지도 중심 페이지
- 전체의 약 70%를 실제 위치 기반 손그림 지도에 사용
- 좌측: 교통, 가는 법, 범례, 작은 위치도
- 우측: 실제 지도, 사진, 건물, 번호, 관광지
- 번호 1번부터 시작
- 관광지와 교통 거점을 우선 배치
- 지도는 넓게 사용하고 설명은 압축한다.
`;
  }
  if (page === 2) {
    return `${common}

이번 이미지는 2페이지다.

2페이지 구성:
- 추천 동선
- 도보시간
- 추천 순서
- 맛집
- 쇼핑
- 현지 기념품
- 여행 팁
- 방문 시간
- 1페이지 번호와 이어지는 번호를 사용
- 맛집 카드에는 대표 음식 사진, 한글/일본어/영문 이름, 운영시간, 휴무일, 대표메뉴, 예상금액, 붐비는 시간, 추천시간, 아이동반 여부, 예약 여부, 현금/카드 여부를 압축 표기한다.
`;
  }
  return `${common}

이번 이미지는 3페이지다.

3페이지 구성:
- ${input.area} 지역 특징에 맞는 특화 페이지
- 예: 해변, 산책로, 시장, 야경, 온천, 공원, 로컬 거리, 사진스팟 중 실제 지역에 맞는 요소 선택
- 쇼핑 리스트와 비오는 날 대체코스 포함
- 페이지 1~2와 이어지는 번호를 사용
- 현지인이 알려주는 팁, 혼잡시간, 사진 잘 나오는 시간, 추천 방문시간, 주의사항을 넣는다.
`;
}

const args = parseArgs(process.argv.slice(2));
if (!args.area) {
  console.error(usage());
  process.exit(1);
}

const input = {
  area: args.area,
  start: args.start || "",
  end: args.end || "",
};
const outDir = path.resolve(args.out || "tmp/ai-guidebook-prompts");
await mkdir(outDir, { recursive: true });

const prompts = [1, 2, 3].map((page) => ({ page, prompt: pagePrompt(page, input).trim() }));
await writeFile(path.join(outDir, "guidebook-input.json"), JSON.stringify(input, null, 2), "utf8");
for (const item of prompts) {
  await writeFile(path.join(outDir, `page-${item.page}-prompt.md`), item.prompt, "utf8");
}
await writeFile(
  path.join(outDir, "combined-prompt.md"),
  prompts.map((item) => `# Page ${item.page}\n\n${item.prompt}`).join("\n\n---\n\n"),
  "utf8",
);

console.log(`Created guidebook prompts in ${outDir}`);
