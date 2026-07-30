import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createAdminSupabase, pendingGuidebookJobs } from "./supabase-admin.mjs";

function guidebookPrompt(job) {
  return `
여행 가이드북 제작 프롬프트

입력 조건:
- 지역: ${job.area}
- 시작일: ${job.startDate || "미정"}
- 종료일: ${job.endDate || "미정"}
- 기간: ${job.duration || "미정"}
- 작업 ID: ${job.id}

위 조건만 사용해서 A4 가로(297x210mm) 여행 가이드북 이미지 2장을 새로 만든다.
전체 스타일은 일본 여행잡지 + 인포그래픽 스타일이며, 실제 여행 중 들고 다니며 볼 수 있는 수준의 정보와 지도를 담는다.

기본 스타일:
- 따뜻한 베이지, 아이보리, 파스텔톤을 사용한다.
- 옛 여행책 느낌과 현대적인 인포그래픽을 섞는다.
- 굵은 제목, 색상별 카테고리, 번호 시스템, 사진, 일러스트, 지도, 아이콘을 적극 활용한다.
- 지도 번호와 설명 번호는 100% 일치해야 한다.

장소명 표기 규칙:
- 모든 주요 장소명은 반드시 아래 순서로 병기한다.
- 한글명 / 한글발음 / 일본어 / 영문
- 예: 슈리성 / 슈리조 / 首里城 / Shuri Castle
- 예: 국제거리 / 고쿠사이도리 / 国際通り / Kokusai-dori
- 지도 안 라벨도 일본어만 단독으로 쓰지 말고, 최소한 한글명 또는 한글발음을 함께 표기한다.
- 설명 카드에는 한글명, 한글발음, 일본어, 영문을 모두 넣는다.

페이지 구성:
- 이미지 1: 지도 중심. 전체의 약 65~70%는 실제 위치 관계를 반영한 손그림 지도. 좌측에는 교통, 범례, 작은 위치도. 우측에는 번호와 사진이 들어간 spot list.
- 이미지 2: 상세 일정, 맛집, 카페, 쇼핑 리스트, 여행 팁, 체크리스트. DAY별 동선과 도보/차량 이동 시간을 보기 쉽게 정리한다.

지도 제작 규칙:
- 실제 Google Maps의 위치 관계, 방향, 거리감을 기준으로 만든다.
- 실제 지도를 그대로 복사하지 말고, 손그림 일러스트 느낌으로 표현한다.
- 관광지, 맛집, 쇼핑, 카페, 마켓, 사진스팟, 교통을 번호와 색상으로 구분한다.
- 번호는 중복 없이 이어지고 지도 번호와 설명 번호가 일치해야 한다.

정보 구성:
- 맛집과 카페는 대표 메뉴 이미지, 운영시간, 휴무일, 예상금액, 붐비는 시간, 추천시간, 아이동반 여부, 예약 여부, 현금/카드 여부를 넣는다.
- 쇼핑 리스트는 지역 한정 기념품과 평균 가격을 우선 소개한다.
- 매 페이지마다 현지 팁, 혼잡시간, 사진 잘 나오는 시간, 비오는 날 대체코스, 주의사항을 넣는다.

검수 규칙:
- 번호 누락, 번호 중복, 지도와 설명 불일치가 없어야 한다.
- A4 가로 비율이어야 한다.
- 일본어만 단독 표기된 장소명이 없어야 한다.
- 여행자가 실제로 참고할 수 있는 밀도와 완성도를 유지한다.

완료 후 생성한 이미지 파일을 저장하고 아래 명령으로 사이트에 업로드한다.
npm.cmd run codex:publish-guidebook -- --user "${job.userId}" --job "${job.id}" --images "<page1.png>" "<page2.png>"
`.trim();
}

const supabase = createAdminSupabase();
const { data, error } = await supabase
  .from("trip_profiles")
  .select("user_id, trip, updated_at")
  .order("updated_at", { ascending: false });

if (error) throw error;

const jobs = pendingGuidebookJobs(data || []);
await mkdir("tmp/guidebook-jobs", { recursive: true });

for (const item of jobs) {
  const job = { ...item.job, userId: item.userId };
  const dir = path.join("tmp/guidebook-jobs", job.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "job.json"), JSON.stringify(job, null, 2), "utf8");
  await writeFile(path.join(dir, "prompt.md"), guidebookPrompt(job), "utf8");
}

console.log(JSON.stringify({
  count: jobs.length,
  jobs: jobs.map((item) => ({
    userId: item.userId,
    id: item.job.id,
    area: item.job.area,
    duration: item.job.duration,
    prompt: path.resolve("tmp/guidebook-jobs", item.job.id, "prompt.md"),
  })),
}, null, 2));
