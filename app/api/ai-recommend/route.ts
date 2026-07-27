export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body = await request.json().catch(()=>null);
  const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0,30) : [];
  if (!body?.trip || !candidates.length) return Response.json({error:"여행 정보와 장소 후보가 필요해요."},{status:400});

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      response_format:{type:"json_object"},
      temperature:0.2,
      max_tokens:3400,
      messages:[
        {role:"system",content:`너는 일본 가족여행 추천 기획자다. 제공된 Google 장소 후보만 사용해 여행 구성원과 일정에 맞는 장소를 선정하고 한국어 JSON으로 답한다. 존재하지 않는 장소를 추가하지 않는다. 메뉴·상품·가격이 확인되지 않으면 "방문 전 확인"이라고 쓴다. 최대 16곳을 카테고리별로 다양하게 선정하고, 선택한 id만 이용해 무리 없는 일정을 함께 만든다. JSON 형식은 {"overview":"한 문장","recommendations":[{"id":"후보 id","reason":"짧은 추천 이유","famousItems":["대표 메뉴/상품/볼거리 최대 2개"],"priceGuide":"짧은 가격대","familyTip":"짧은 가족 팁","bestTime":"추천 시간","priority":1}],"guide":{"title":"...","overview":"...","days":[{"day":1,"title":"...","stops":[{"id":"선택한 장소 id","time":"09:30","reason":"짧은 방문 포인트"}],"tips":["짧은 팁"]}],"familyTips":["최대 3개"],"weatherBackup":["최대 3개"]}}다. 하루 장소는 3~5곳으로 제한한다.`},
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
