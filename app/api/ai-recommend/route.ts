export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body = await request.json().catch(()=>null);
  const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0,45) : [];
  if (!body?.trip || !candidates.length) return Response.json({error:"여행 정보와 장소 후보가 필요해요."},{status:400});

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      response_format:{type:"json_object"},
      temperature:0.25,
      max_tokens:5000,
      messages:[
        {role:"system",content:`너는 일본 가족여행 추천 기획자다. 제공된 Google 장소 후보만 사용해 여행 구성원과 일정에 맞는 장소를 선정하고 한국어 JSON으로 답한다. 존재하지 않는 장소를 추가하지 않는다. 메뉴·상품·가격이 후보 정보로 확인되지 않으면 "방문 전 확인"이라고 쓴다. 결과는 {"overview":"...","recommendations":[{"id":"후보 id","reason":"가족 맞춤 추천 이유","famousItems":["대표 메뉴/상품/볼거리"],"priceGuide":"가격대 또는 확인 필요","familyTip":"아이·고령자 포함 방문 팁","bestTime":"추천 시간대","priority":1}]} 형식이다. 카테고리를 다양하게 유지하고 최대 24곳을 추천한다.`},
        {role:"user",content:JSON.stringify({trip:body.trip,candidates})}
      ]
    })
  });
  if (!response.ok) return Response.json({error:response.status===402?"AI 잔액을 확인해 주세요.":"AI 추천을 만들지 못했어요."},{status:response.status});
  const data = await response.json();
  try {
    return Response.json({result:JSON.parse(data.choices?.[0]?.message?.content || "{}")});
  } catch {
    return Response.json({error:"AI 추천 결과를 정리하지 못했어요."},{status:502});
  }
}
