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
  recommendationDir,
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

async function createRecommendationRequest(input) {
  const id = requestId(input);
  const dir = path.join(requestDir, id);
  await mkdir(dir, { recursive: true });
  const promptPath = path.join(dir, "recommendations-prompt.md");
  const payloadPath = path.join(dir, "recommendations-input.json");
  await writeJson(payloadPath, input);
  await writeFile(promptPath, buildRecommendationPrompt(input), "utf8");
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
    "아래 조건으로 A4 가로 여행 가이드북 이미지 2~3장을 생성한다.",
    "스타일은 일본 여행잡지 + 인포그래픽이며, 지도/번호/사진/맛집/쇼핑/팁이 포함되어야 한다.",
    "완료 후 이미지를 저장하고 다음 명령으로 등록한다.",
    "",
    `npm run codex:register-guidebook -- --id "${requestId(input)}" --area "${input.area || ""}" --start "${input.startDate || ""}" --end "${input.endDate || ""}" --duration "${input.duration || ""}" --title "${input.area || "여행"} AI 가이드북" --images "<page1.png>" "<page2.png>"`,
    "",
  ].join("\n");
}

function buildRecommendationPrompt(input) {
  return [
    "# Guide-trip local Codex recommendation request",
    "",
    `지역: ${input.area || ""}`,
    `국가: ${input.country || ""}`,
    `기간: ${input.duration || ""}`,
    "",
    "가족 여행자가 바로 쓸 수 있는 추천 장소 JSON을 만든다.",
    "각 장소는 name, sub, category, lat, lng, color, hours, description, tip, query, placeType, aiReason, aiFamilyTip, aiVisitTip, aiParkingTip 값을 포함한다.",
    "완료 후 JSON 파일로 저장하고 다음 명령으로 등록한다.",
    "",
    `npm run codex:register-recommendations -- --id "${requestId(input)}" --area "${input.area || ""}" --file "<recommendations.json>"`,
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

async function findRecommendations(input) {
  const index = await readJson(path.join(recommendationDir, "index.json"), []);
  const areaKey = normalizeKey(input.area || "");
  const matched = index.find((entry) => {
    const aliases = entry.areaAliases || [entry.area || entry.id];
    return aliases.some((alias) => {
      const aliasKey = normalizeKey(alias);
      return areaKey === aliasKey || areaKey.includes(aliasKey) || aliasKey.includes(areaKey);
    });
  });
  if (!matched) return null;
  return readJson(path.join(recommendationDir, matched.file), null);
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
      const guidebook = await findGuidebook(input, baseUrl);
      if (guidebook) return sendJson(res, 200, { status: "ready", guidebook });
      const request = await createGuidebookRequest(input);
      return sendJson(res, 202, {
        status: "queued",
        message: "로컬 Codex 서버에 이미지 가이드북 생성 요청을 남겼어요.",
        request,
      });
    }

    if (url.pathname === "/recommendations" && req.method === "POST") {
      const input = await parseBody(req);
      const recommendations = await findRecommendations(input);
      if (recommendations?.recommendations?.length) {
        return sendJson(res, 200, { status: "ready", ...recommendations });
      }
      const request = await createRecommendationRequest(input);
      return sendJson(res, 202, {
        status: "queued",
        overview: "로컬 Codex 서버에 추천 생성 요청을 남겼어요.",
        recommendations: [],
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
