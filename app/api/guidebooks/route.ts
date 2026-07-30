import { createUserSupabase, requireSupabaseUser } from "../../lib/server/supabase";

type GuidebookJob = {
  id: string;
  status: "pending" | "ready" | "failed";
  area: string;
  startDate: string;
  endDate: string;
  duration: string;
  title: string;
  pages: string[];
  error?: string;
  requestedAt: string;
  updatedAt: string;
};

function cleanText(value: unknown, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

function makeJobId(userId: string, area: string) {
  const seed = `${userId}:${area}:${Date.now()}:${Math.random()}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return `gb_${Date.now().toString(36)}_${hash.toString(36)}`;
}

async function getTrip(supabase: ReturnType<typeof createUserSupabase>) {
  const { data, error } = await supabase
    .from("trip_profiles")
    .select("trip")
    .maybeSingle();
  if (error) throw error;
  return data?.trip && typeof data.trip === "object" ? data.trip as Record<string, unknown> : {};
}

async function saveTrip(
  supabase: ReturnType<typeof createUserSupabase>,
  userId: string,
  trip: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("trip_profiles")
    .upsert(
      {
        user_id: userId,
        trip,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

export async function GET(request: Request) {
  try {
    const { token } = await requireSupabaseUser(request);
    const supabase = createUserSupabase(token);
    const trip = await getTrip(supabase);
    return Response.json(
      { guidebookJob: trip.guidebookJob ?? null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Guidebook request could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { token, user } = await requireSupabaseUser(request);
    const payload = await request.json().catch(() => ({}));
    const area = cleanText(payload.area);
    if (!area) {
      return Response.json({ error: "Guidebook area is required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const job: GuidebookJob = {
      id: makeJobId(user.id, area),
      status: "pending",
      area,
      startDate: cleanText(payload.startDate, 20),
      endDate: cleanText(payload.endDate, 20),
      duration: cleanText(payload.duration, 30),
      title: `${area}${payload.duration ? ` ${cleanText(payload.duration, 30)}` : ""} AI 가이드북`,
      pages: [],
      requestedAt: now,
      updatedAt: now,
    };

    const supabase = createUserSupabase(token);
    const trip = await getTrip(supabase);
    trip.guidebookJob = job;
    await saveTrip(supabase, user.id, trip);

    return Response.json(
      {
        guidebookJob: job,
        message: "Codex에 이미지 가이드북 생성 요청을 보냈어요.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Guidebook request could not be created." }, { status: 500 });
  }
}
