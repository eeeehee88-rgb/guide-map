import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAdminSupabase } from "./supabase-admin.mjs";

function parseArgs(argv) {
  const args = { images: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--images") {
      args.images = argv.slice(index + 1);
      break;
    }
    if (item.startsWith("--")) {
      args[item.slice(2)] = argv[index + 1] || "";
      index += 1;
    }
  }
  return args;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "image/png";
}

const args = parseArgs(process.argv.slice(2));
if (!args.user || !args.job || (args.images.length < 1 && !args.failed)) {
  console.error("Usage: npm run codex:publish-guidebook -- --user <user_id> --job <job_id> --images page1.png page2.png");
  console.error("   or: npm run codex:publish-guidebook -- --user <user_id> --job <job_id> --failed \"reason\"");
  process.exit(1);
}

const supabase = createAdminSupabase();
await supabase.storage.createBucket("guidebook-pages", {
  public: true,
  fileSizeLimit: "25MB",
  allowedMimeTypes: ["image/png", "image/jpeg"],
}).catch(() => undefined);

const { data: profile, error: profileError } = await supabase
  .from("trip_profiles")
  .select("trip")
  .eq("user_id", args.user)
  .maybeSingle();

if (profileError) throw profileError;
const trip = profile?.trip && typeof profile.trip === "object" ? profile.trip : {};
const job = trip.guidebookJob;
if (!job || job.id !== args.job) {
  throw new Error(`Guidebook job ${args.job} was not found for user ${args.user}.`);
}

const pages = [];
if (!args.failed) {
  for (let index = 0; index < args.images.length; index += 1) {
    const source = path.resolve(args.images[index]);
    const ext = path.extname(source).toLowerCase() || ".png";
    const objectPath = `${args.user}/${args.job}/page-${index + 1}${ext}`;
    const buffer = await readFile(source);
    const { error: uploadError } = await supabase.storage
      .from("guidebook-pages")
      .upload(objectPath, buffer, {
        upsert: true,
        contentType: contentType(source),
        cacheControl: "60",
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("guidebook-pages").getPublicUrl(objectPath);
    pages.push(data.publicUrl);
  }
}

const readyJob = {
  ...job,
  status: args.failed ? "failed" : "ready",
  pages,
  error: args.failed ? String(args.failed) : undefined,
  updatedAt: new Date().toISOString(),
};

const { error: updateError } = await supabase
  .from("trip_profiles")
  .update({
    trip: {
      ...trip,
      guidebookJob: readyJob,
    },
    updated_at: new Date().toISOString(),
  })
  .eq("user_id", args.user);

if (updateError) throw updateError;

console.log(JSON.stringify({
  status: "ready",
  userId: args.user,
  jobId: args.job,
  pages,
}, null, 2));
