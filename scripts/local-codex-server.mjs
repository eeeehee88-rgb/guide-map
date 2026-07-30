import http from "node:http";
import path from "node:path";
import { createReadStream } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import {
  ensureLocalCodexDirs,
  guidebookDir,
  matchesGuidebook,
  normalizeKey,
  readJson,
  requestDir,
  requestId,
  rootDir,
  writeJson,
} from "./local-codex-shared.mjs";

const port = Number(process.env.LOCAL_CODEX_PORT || 8789);
const host = process.env.LOCAL_CODEX_HOST || "127.0.0.1";

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

async function createGuidebookRequest(input) {
  const id = requestId(input);
  const dir = path.join(requestDir, id);
  await mkdir(dir, { recursive: true });
  const promptPath = path.join(dir, "guidebook-prompt.md");
  const payloadPath = path.join(dir, "input.json");
  await writeJson(payloadPath, input);
  await writeFile(promptPath, buildGuidebookPrompt(input), "utf8");
  return { id, promptPath, payloadPath };
}

function buildGuidebookPrompt(input) {
  return [
    "# Guide-trip local Codex guidebook request",
    "",
    `지역: ${input.area || ""}`,
    `시작일: ${input.startDate || ""}`,
    `종료일: ${input.endDate || ""}`,
    `기간: ${input.duration || ""}`,
    "",
    `요청시각: ${input.requestedAt || new Date().toISOString()}`,
    "",
    "아래 조건으로 A4 가로 여행 가이드북 이미지 2~3장을 새로 생성한다.",
    "사용자가 제공한 오키나와 샘플처럼 일본 여행잡지 + 손그림 지도 + 현대적 인포그래픽 스타일로 만든다.",
    "따뜻한 베이지/아이보리/파스텔톤 종이 배경, 파란색 섹션 헤더, 주황색 번호 마커, 초록색 체크리스트를 사용한다.",
    "지도, 번호, 사진, 카드, 일정표, 팁 박스, 체크리스트, 쇼핑 리스트, 아이콘이 빽빽하게 들어간 완성형 여행 가이드북이어야 한다.",
    "PAGE 1~2를 담은 이미지 1장과 PAGE 3/마무리 정보를 담은 이미지 1장을 기본으로 만들고, 필요하면 3장까지 만든다.",
    "지도 번호와 설명 번호는 일치해야 하며, 지역과 여행 기간은 반드시 입력 조건을 따른다.",
    "완료 후 이미지를 저장하고 다음 명령으로 등록한다.",
    "",
    `npm run codex:register-guidebook -- --id "${requestId(input)}" --area "${input.area || ""}" --start "${input.startDate || ""}" --end "${input.endDate || ""}" --duration "${input.duration || ""}" --title "${input.area || "여행"} AI 가이드북" --images "<page1.png>" "<page2.png>"`,
    "",
  ].join("\n");
}

async function findGuidebook(input, baseUrl) {
  const indexPath = path.join(guidebookDir, "index.json");
  const guidebooks = await readJson(indexPath, []);
  const matched = guidebooks.find((entry) => matchesGuidebook(entry, input));
  if (!matched) return null;
  return {
    ...matched,
    pages: matched.pages.map((page) => page.startsWith("http") ? page : `${baseUrl}/files/${matched.id}/${page.replace(/^\/+/, "")}`),
  };
}

function safeFilePath(id, file) {
  const resolved = path.resolve(guidebookDir, normalizeKey(id), file);
  if (!resolved.startsWith(path.resolve(guidebookDir))) return null;
  return resolved;
}

await ensureLocalCodexDirs();

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });
  const baseUrl = `http://${host}:${port}`;
  const url = new URL(req.url || "/", baseUrl);

  try {
    if (url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, rootDir });
    }

    if (url.pathname === "/guidebooks" && req.method === "GET") {
      const input = Object.fromEntries(url.searchParams.entries());
      const guidebook = await findGuidebook(input, baseUrl);
      if (guidebook) return sendJson(res, 200, { status: "ready", guidebook });
      const request = await createGuidebookRequest(input);
      return sendJson(res, 202, {
        status: "queued",
        message: "로컬 Codex 서버에 이미지 가이드북 생성 요청을 남겼어요.",
        request,
      });
    }

    if (url.pathname === "/guidebooks" && req.method === "POST") {
      const input = await parseBody(req);
      const request = await createGuidebookRequest(input);
      return sendJson(res, 202, {
        status: "queued",
        message: "로컬 Codex 서버에 새 이미지 가이드북 생성 요청을 남겼어요.",
        request,
      });
    }

    if (url.pathname.startsWith("/files/") && req.method === "GET") {
      const [, , id, ...fileParts] = url.pathname.split("/");
      const filePath = safeFilePath(id, fileParts.join("/"));
      if (!filePath) return sendJson(res, 400, { error: "Invalid file path" });
      await access(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".png" ? "image/png" : "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      });
      return createReadStream(filePath).pipe(res);
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || "Local Codex server error" });
  }
});

server.listen(port, host, () => {
  console.log(`Local Codex guide-trip server listening on http://${host}:${port}`);
});
