type GuideImagePlace = {
  nameKo?: string;
  nameLocal?: string;
  category?: string;
  description?: string;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildPrompt(body: any) {
  const area = text(body?.area, "Japan");
  const title = text(body?.title, `${area} travel guide`);
  const subtitle = text(body?.subtitle);
  const overview = text(body?.overview);
  const places = Array.isArray(body?.places) ? body.places.slice(0, 8) as GuideImagePlace[] : [];
  const placeLines = places
    .map((place, index) => `${index + 1}. ${text(place.nameKo || place.nameLocal, "local place")} - ${text(place.category, "spot")} - ${text(place.description).slice(0, 120)}`)
    .join("\n");

  return [
    "Create one premium editorial travel guidebook cover image. No text, no letters, no logos, no UI.",
    "Style: polished Korean/Japanese travel magazine, warm natural daylight, elegant but practical, family-friendly, high-end guidebook photography mixed with subtle illustrated map motifs.",
    "Composition: landscape cover hero with recognizable local travel atmosphere, food, shopping, walking route hints, small map texture, tasteful paper grain.",
    `Area: ${area}`,
    `Guide title context: ${title}`,
    subtitle ? `Subtitle context: ${subtitle}` : "",
    overview ? `Trip overview: ${overview}` : "",
    placeLines ? `Use these real guidebook places as inspiration:\n${placeLines}` : "",
    "Avoid fake signage and avoid readable text. Make it suitable to place inside an AI guidebook preview.",
  ].filter(Boolean).join("\n");
}

export async function POST(request: Request) {
  if (process.env.ENABLE_DEV_GUIDE_IMAGES !== "true") {
    return Response.json({ error: "Dev guide images are disabled." }, { status: 404 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const prompt = buildPrompt(body);
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      signal: AbortSignal.timeout(75_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "1536x1024",
        quality: "medium",
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return Response.json({ error: data?.error?.message || `Image generation failed (${response.status}).` }, { status: response.status });
    }

    const image = data?.data?.[0];
    const dataUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;
    if (!dataUrl) {
      return Response.json({ error: "Image generation returned no image." }, { status: 502 });
    }

    return Response.json({
      image: {
        dataUrl,
        prompt,
        model,
      },
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || "Image generation timed out." }, { status: 504 });
  }
}
