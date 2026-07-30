import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const rootDir = path.resolve("tmp/local-codex");
export const guidebookDir = path.join(rootDir, "guidebooks");
export const requestDir = path.join(rootDir, "requests");

export function normalizeKey(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "guide-trip";
}

export function requestId({ area = "", startDate = "", endDate = "", duration = "" }) {
  return [normalizeKey(area), normalizeKey(startDate), normalizeKey(endDate), normalizeKey(duration)]
    .filter(Boolean)
    .join("__");
}

export async function ensureLocalCodexDirs() {
  await Promise.all([
    mkdir(guidebookDir, { recursive: true }),
    mkdir(requestDir, { recursive: true }),
  ]);
}

export async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export function matchesGuidebook(entry, { area = "", startDate = "", endDate = "", duration = "" }) {
  const areaKey = normalizeKey(area);
  const areaMatch = (entry.areaAliases || [entry.title || entry.id]).some((alias) => {
    const aliasKey = normalizeKey(alias);
    return areaKey === aliasKey || areaKey.includes(aliasKey) || aliasKey.includes(areaKey);
  });
  const dateMatch = entry.startDate && entry.endDate
    ? entry.startDate === startDate && entry.endDate === endDate
    : true;
  const durationMatch = entry.duration ? !duration || entry.duration === duration : true;
  return areaMatch && dateMatch && durationMatch && Array.isArray(entry.pages) && entry.pages.length;
}
