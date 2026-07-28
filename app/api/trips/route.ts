import { createUserSupabase, requireSupabaseUser } from "../../lib/server/supabase";

type TripPayload = {
  hotel?: unknown;
  savedPlaces?: unknown[];
  guideStart?: string;
  guideEnd?: string;
  travelers?: unknown[];
  travelArea?: string;
  travelCountry?: string;
};

function cleanTrip(input: TripPayload) {
  return {
    hotel: input.hotel ?? null,
    savedPlaces: Array.isArray(input.savedPlaces) ? input.savedPlaces.slice(0, 200) : [],
    guideStart: String(input.guideStart ?? "").slice(0, 20),
    guideEnd: String(input.guideEnd ?? "").slice(0, 20),
    travelers: Array.isArray(input.travelers) ? input.travelers.slice(0, 30) : [],
    travelArea: String(input.travelArea ?? "").slice(0, 120),
    travelCountry: String(input.travelCountry ?? "").slice(0, 8),
  };
}

export async function GET(request: Request) {
  try {
    const { token } = await requireSupabaseUser(request);
    const supabase = createUserSupabase(token);
    const { data, error } = await supabase
      .from("trip_profiles")
      .select("trip")
      .maybeSingle();

    if (error) throw error;

    return Response.json(
      { trip: data?.trip ?? null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Trip data could not be loaded." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { token, user } = await requireSupabaseUser(request);
    const payload = (await request.json()) as { trip?: TripPayload };
    const trip = cleanTrip(payload.trip ?? {});
    const supabase = createUserSupabase(token);
    const { error } = await supabase
      .from("trip_profiles")
      .upsert(
        {
          user_id: user.id,
          trip,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) throw error;

    return Response.json(
      { trip },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Trip data could not be saved." }, { status: 500 });
  }
}
