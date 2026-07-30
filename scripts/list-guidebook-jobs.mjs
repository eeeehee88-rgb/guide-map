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

사용자가 제공한 오키나와 샘플처럼 A4 가로 여행 가이드북 이미지 2~3장을 새로 만든다.
전체 디자인은 일본 여행잡지 + 인포그래픽 스타일이며, 실제 여행 중 들고 다닐 수 있는 수준의 정보와 지도를 제작한다.

기본 스타일:
- 따뜻한 베이지, 아이보리, 파스텔톤.
- 옛 여행책 느낌과 현대적인 인포그래픽을 섞는다.
- 굵은 제목, 색상별 카테고리, 번호 시스템, 사진, 일러스트, 지도, 아이콘을 적극 활용한다.
- 지도와 설명 번호는 100% 일치해야 한다.

페이지 구성:
- 이미지 1: PAGE 1과 PAGE 2를 한 장에 구성. 지역 지도, 교통, 추천 동선, 맛집/카페/쇼핑 카드.
- 이미지 2: PAGE 3와 마무리 정보. 쇼핑/귀국 준비/체크리스트/예산/비오는 날 대체코스.
- 필요하면 이미지 3을 추가한다.

지도 규칙:
- Google Maps 실제 위치와 거리감을 기준으로 손그림 일러스트 지도처럼 제작한다.
- 관광지, 맛집, 쇼핑, 카페, 마켓, 사진스팟, 교통을 번호와 색상으로 구분한다.
- 번호는 중복되면 안 되고, 지도 번호와 설명 번호가 일치해야 한다.

완료 후 생성된 이미지 파일을 저장하고 아래 명령으로 사이트에 넘긴다:
npm run codex:publish-guidebook -- --user "${job.userId}" --job "${job.id}" --images "<page1.png>" "<page2.png>"
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
