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
    "  node scripts/create-ai-guidebook-prompts.mjs --area \"이누야마\" --start 2026-08-01 --end 2026-08-03",
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

function basePrompt(input) {
  const schedule = dateText(input.start, input.end);
  const duration = durationText(input.start, input.end) || "여행 기간";
  return `
여행 가이드북 이미지 생성 프롬프트

입력 조건:
- 지역: ${input.area}
- 여행 기간: ${duration}
- 여행 일정: ${schedule}
- 이 결과물은 기존 추천 리스트/장소 상세/추천 카드와 완전히 다른 AI 이미지 가이드북이다.
- 개발 단계에서는 Codex/GPT 이미지 생성으로 만든 이미지를 정적 자산으로 넣고, 상업화 때 OpenAI Images API를 붙인다.

공통 스타일:
- 사용자가 제공한 오키나와 샘플처럼 만든다.
- A4 가로형 여행잡지 인포그래픽 이미지.
- 일본 여행잡지 + 손그림 지도 + 현대적 인포그래픽 스타일.
- 따뜻한 베이지, 아이보리, 파스텔톤 종이 배경.
- 파란색 섹션 헤더, 주황색 번호 마커, 초록색 체크리스트, 얇은 카드 테두리.
- 귀엽고 아기자기한 미니어처 건물, 작은 자동차, 전철, 비행기, 지역 상징 일러스트를 적극 사용.
- 지도, 번호, 사진, 카드, 일정표, 팁 박스, 체크리스트, 쇼핑 리스트, 아이콘이 빽빽하게 들어간 완성형 여행 가이드북.
- 빈 공간이 많으면 안 된다.
- 대부분 한국어로 작성하고, 주요 장소는 일본어와 영어 보조 표기를 함께 넣는다.
- 텍스트는 완벽하게 읽히지 않아도 되지만, 실제 가이드북처럼 정보 밀도와 구조가 분명해야 한다.

지도 제작 규칙:
- AI가 임의로 위치를 배치하지 않는다.
- Google Maps 실제 위치를 기준으로 도로, 골목, 건물 위치, 철도, 역, 강, 해변, 공원, 관광지를 실제 거리 비율에 맞게 구성한다.
- 실제 지도를 그대로 복사하지 말고 손그림 일러스트 지도처럼 표현한다.
- 지도 번호와 설명 번호는 100% 일치해야 한다.
- 번호는 1번부터 이어지고 중복되면 안 된다.

색상/번호:
- 🟠 관광지 / 🔴 맛집 / 🟢 쇼핑 / 🔵 마켓 / 🟣 카페 / 🟡 사진스팟 / ⚫ 교통
- 번호는 지도와 설명 카드에 모두 존재해야 한다.

검수:
- A4 가로 비율인가.
- 지역과 여행 기간이 맞는가.
- 번호가 지도와 설명에 모두 있는가.
- 최소 2장 이상의 이미지 세트로 나누어 보여줄 수 있는가.
- 오키나와 샘플처럼 밀도 높고 예쁜 여행 가이드북 이미지인가.
`.trim();
}

function pageOneTwoPrompt(input) {
  return `${basePrompt(input)}

이번 이미지는 이미지 세트의 1번째 이미지다.
PAGE 1과 PAGE 2를 한 장 안에 나누어 구성한다.

PAGE 1:
- 큰 제목: "${input.area} ${durationText(input.start, input.end) || ""}".
- DAY 1 또는 PAGE 1 라벨.
- 중심은 지역 핵심 구역의 손그림 지도.
- 공항/역/숙소 방향, 주요 관광지, 성/신사/강/해변/시장 등 지역 상징을 지도에 배치.
- 번호 1~8 정도를 지도와 카드에 일치시킨다.
- 좌측 또는 하단에 교통 정보, 지도 범례, 위치도, 여행 팁을 넣는다.

PAGE 2:
- DAY 2 또는 PAGE 2 라벨.
- 추천 동선, 도보/차량 이동 시간, 시간표, 맛집/카페/쇼핑 카드.
- 음식 카드는 대표 메뉴 사진, 가격, 영업시간, 추천시간, 아이동반 여부를 포함.
- 지역 특화 산책/드라이브/자연 코스를 담는다.
`;
}

function pageThreePrompt(input) {
  return `${basePrompt(input)}

이번 이미지는 이미지 세트의 2번째 이미지다.
PAGE 3와 여행 마무리 정보를 한 장 안에 구성한다.

PAGE 3:
- DAY 3 또는 PAGE 3 라벨.
- 쇼핑, 귀국 준비, 공항/역 이동, 기념품, 카페, 비오는 날 대체코스 중심.
- 번호는 앞 이미지에서 이어지는 번호로 구성한다.
- 지역 한정 기념품, 과자, 전통공예, 술, 차, 식기, 생활용품과 평균가격을 넣는다.
- 이동 가이드 지도, 예산 요약, 가족 여행 체크리스트, 비상 연락처, 교통 팁을 넣는다.
- 마지막에는 "즐거운 여행 되셨나요?" 같은 마무리 카드와 지역 상징 일러스트를 넣는다.
`;
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

await writeFile(path.join(outDir, "guidebook-input.json"), JSON.stringify({ ...input, duration }, null, 2), "utf8");
await writeFile(path.join(outDir, "page-1-2-prompt.md"), pageOneTwoPrompt(input), "utf8");
await writeFile(path.join(outDir, "page-3-prompt.md"), pageThreePrompt(input), "utf8");
await writeFile(path.join(outDir, "manifest-example.json"), JSON.stringify({
  id,
  title: `${input.area}${duration ? ` ${duration}` : ""}`,
  areaAliases: [input.area],
  duration,
  startDate: input.start || undefined,
  endDate: input.end || undefined,
  pages: [
    `/ai-guidebooks/${id}/page-1-2.png`,
    `/ai-guidebooks/${id}/page-3.png`,
  ],
}, null, 2), "utf8");

console.log(`Created 2 image guidebook prompts in ${outDir}`);
