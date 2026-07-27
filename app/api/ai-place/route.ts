type RateEntry = { count:number; resetAt:number };

const rateStore = new Map<string,RateEntry>();

export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 키가 설정되지 않았어요."},{status:503});

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const current = rateStore.get(ip);
  if (current && current.resetAt > now && current.count >= 20) {
    return Response.json({error:"AI 분석 사용량이 많아요. 잠시 후 다시 시도해 주세요."},{status:429});
  }
  rateStore.set(ip,current && current.resetAt > now
    ? {...current,count:current.count+1}
    : {count:1,resetAt:now+60*60*1000});

  const body = await request.json().catch(()=>null);
  if (!body?.place?.name) return Response.json({error:"장소 정보가 필요해요."},{status:400});

  const payload = {
    place:{
      name:String(body.place.name).slice(0,160),
      originalName:String(body.place.originalName || "").slice(0,160),
      category:String(body.place.category || "").slice(0,60),
      address:String(body.place.address || "").slice(0,260),
      description:String(body.place.description || "").slice(0,800),
      hours:String(body.place.hours || "").slice(0,200),
      rating:body.place.rating,
      reviews:Array.isArray(body.place.reviews) ? body.place.reviews.slice(0,5).map((item:unknown)=>String(item).slice(0,900)) : []
    },
    trip:{
      area:String(body.trip?.area || "").slice(0,100),
      dates:String(body.trip?.dates || "").slice(0,100),
      travelers:Array.isArray(body.trip?.travelers) ? body.trip.travelers.slice(0,12) : []
    }
  };

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      response_format:{type:"json_object"},
      temperature:0.2,
      max_tokens:1200,
      messages:[
        {role:"system",content:`너는 일본 가족여행 장소 분석가다. 제공된 장소 데이터와 리뷰만 근거로 한국어 JSON을 작성한다. 확인되지 않은 메뉴·가격·시설을 만들어내지 말고 반드시 "확인 필요"라고 표시한다. JSON 키는 summary, famousItems(string[]), familyFit, childTip, seniorTip, priceGuide, waitTip, cautions(string[]), confidence("높음"|"보통"|"낮음"), evidence(string[])만 사용한다.`},
        {role:"user",content:JSON.stringify(payload)}
      ]
    })
  });
  if (!response.ok) {
    const message = response.status === 402 ? "DeepSeek 잔액을 확인해 주세요." : "AI 분석을 불러오지 못했어요.";
    return Response.json({error:message},{status:response.status});
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return Response.json({error:"AI 응답이 비어 있어요."},{status:502});
  try {
    return Response.json({analysis:JSON.parse(content)});
  } catch {
    return Response.json({error:"AI 응답을 정리하지 못했어요."},{status:502});
  }
}
