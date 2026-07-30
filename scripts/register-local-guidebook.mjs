import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  ensureLocalCodexDirs,
  guidebookDir,
  normalizeKey,
  readJson,
  requestId,
  writeJson,
} from "./local-codex-shared.mjs";

function parseArgs(argv) {
  const args = { images: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "--images") {
      args.images = argv.slice(i + 1);
      break;
    }
    if (item.startsWith("--")) {
      args[item.slice(2)] = argv[i + 1] || "";
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const images = args.images.filter(Boolean);
if (!args.area || images.length < 1) {
  console.error("Usage: npm run codex:register-guidebook -- --area \"이누야마\" --start 2026-08-01 --end 2026-08-03 --duration \"2박 3일\" --images page1.png page2.png");
  process.exit(1);
}

await ensureLocalCodexDirs();

const id = normalizeKey(args.id || requestId({
  area: args.area,
  startDate: args.start || args.startDate || "",
  endDate: args.end || args.endDate || "",
  duration: args.duration || "",
}));
const targetDir = path.join(guidebookDir, id);
await mkdir(targetDir, { recursive: true });

const pages = [];
for (let i = 0; i < images.length; i += 1) {
  const source = path.resolve(images[i]);
  const ext = path.extname(source).toLowerCase() || ".png";
  const fileName = `page-${i + 1}${ext}`;
  await copyFile(source, path.join(targetDir, fileName));
  pages.push(fileName);
}

const indexPath = path.join(guidebookDir, "index.json");
const index = await readJson(indexPath, []);
const entry = {
  id,
  title: args.title || `${args.area} AI 가이드북`,
  areaAliases: [args.area, ...(args.aliases ? String(args.aliases).split(",").map((item) => item.trim()).filter(Boolean) : [])],
  startDate: args.start || args.startDate || "",
  endDate: args.end || args.endDate || "",
  duration: args.duration || "",
  pages,
  updatedAt: new Date().toISOString(),
};
const next = [entry, ...index.filter((item) => item.id !== id)];
await writeJson(indexPath, next);

console.log(`Registered local guidebook ${id}`);
console.log(`Pages: ${pages.join(", ")}`);
