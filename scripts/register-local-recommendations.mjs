import path from "node:path";
import {
  ensureLocalCodexDirs,
  normalizeKey,
  readJson,
  recommendationDir,
  requestId,
  writeJson,
} from "./local-codex-shared.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item.startsWith("--")) {
      args[item.slice(2)] = argv[i + 1] || "";
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.area || !args.file) {
  console.error("Usage: npm run codex:register-recommendations -- --area \"교토\" --file recommendations.json");
  process.exit(1);
}

await ensureLocalCodexDirs();

const source = path.resolve(args.file);
const data = await readJson(source, null);
if (!Array.isArray(data?.recommendations)) {
  console.error("Recommendation file must be JSON: { overview, recommendations: [...] }");
  process.exit(1);
}

const id = normalizeKey(args.id || requestId({
  area: args.area,
  startDate: args.start || args.startDate || "",
  endDate: args.end || args.endDate || "",
  duration: args.duration || "",
}));
const fileName = `${id}.json`;
await writeJson(path.join(recommendationDir, fileName), {
  overview: data.overview || `${args.area} 로컬 Codex 추천`,
  recommendations: data.recommendations,
  updatedAt: new Date().toISOString(),
});

const indexPath = path.join(recommendationDir, "index.json");
const index = await readJson(indexPath, []);
const entry = {
  id,
  area: args.area,
  areaAliases: [args.area, ...(args.aliases ? String(args.aliases).split(",").map((item) => item.trim()).filter(Boolean) : [])],
  file: fileName,
  updatedAt: new Date().toISOString(),
};
await writeJson(indexPath, [entry, ...index.filter((item) => item.id !== id)]);

console.log(`Registered local recommendations ${id}`);
