type LocalizePlace = {
  id?: string;
  name?: string;
  originalName?: string;
  category?: string;
  type?: string;
};

function parseModelJson(content:string) {
  const trimmed = content.trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start,end + 1));
    throw new Error("Invalid JSON");
  }
}

function cleanPlace(place:LocalizePlace) {
  return {
    id:String(place.id || ""),
    name:String(place.name || ""),
    originalName:String(place.originalName || ""),
    category:String(place.category || ""),
    type:String(place.type || "")
  };
}

export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI setting is required."},{status:503});

  const body = await request.json().catch(()=>null);
  const places = Array.isArray(body?.places)
    ? body.places.slice(0,40).map(cleanPlace).filter((place:LocalizePlace)=>place.id && (place.name || place.originalName))
    : [];
  if (!places.length) return Response.json({error:"Place names are required."},{status:400});

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    signal:AbortSignal.timeout(15000),
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      thinking:{type:"disabled"},
      response_format:{type:"json_object"},
      max_tokens:1800,
      messages:[
        {
          role:"system",
          content:[
            "You transliterate Japanese or English place names into Korean Hangul pronunciation for a Korean travel app.",
            "Do not translate business categories into generic names such as 일본 음식점, 현지 카페, 관광 명소, 장소.",
            "Preserve the actual proper noun as much as possible. Examples: Nagoya -> 나고야, Lawson Inuyamahommachi Shop -> 로손 이누야마혼마치점.",
            "Return only JSON in this exact shape: {\"places\":[{\"id\":\"input id\",\"koreanName\":\"한글 발음명\"}]}",
            "Return every input id exactly once. If the original is already Korean, return it unchanged."
          ].join(" ")
        },
        {role:"user",content:JSON.stringify({places})}
      ]
    })
  });

  if (!response.ok) return Response.json({error:"Could not localize place names."},{status:response.status});

  const data = await response.json();
  try {
    const result = parseModelJson(String(data.choices?.[0]?.message?.content || "{}"));
    return Response.json({places:Array.isArray(result.places)?result.places:[]});
  } catch {
    return Response.json({error:"Could not parse localized place names."},{status:502});
  }
}
