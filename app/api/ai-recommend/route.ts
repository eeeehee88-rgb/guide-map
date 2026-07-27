export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body = await request.json().catch(()=>null);
  const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0,24) : [];
  if (!body?.trip || !candidates.length) return Response.json({error:"여행 정보와 장소 후보가 필요해요."},{status:400});
  const koreaTime = new Intl.DateTimeFormat("ko-KR",{
    timeZone:"Asia/Seoul",dateStyle:"full",timeStyle:"short"
  }).format(new Date());

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    signal:AbortSignal.timeout(25000),
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      thinking:{type:"disabled"},
      response_format:{type:"json_object"},
      temperature:0.2,
      max_tokens:3200,
      messages:[
        {role:"system",content:`너는 일본 가족여행 추천 기획자다. 제공된 Google 장소 후보만 사용해 여행 구성원과 일정에 맞는 장소를 선정하고 한국어 JSON으로 답한다. 존재하지 않는 장소를 추가하지 않는다. localizations에는 모든 후보 id와 실제 일본어 상호·장소명의 한글 독음을 빠짐없이 쓴다. 업종 번역인 "일본 음식점", "현지 카페", "관광 명소" 등을 koreanName으로 쓰면 안 된다. 최대 14곳을 카테고리별로 다양하게 선정하고, 선택한 id만 이용해 무리 없는 일정을 함께 만든다. 음식점·카페는 famousItems에 실제 대표 음식이나 메뉴를 1~2개 반드시 쓰고 priceGuide에는 1인 기준 엔화 가격 범위를 반드시 쓴다. 쇼핑·주류는 대표 상품과 예상 엔화 가격을 쓴다. 정확한 가격을 확신할 수 없으면 일본 현지의 일반적인 가격을 '약 ¥금액~'으로 표시한다. 관광지는 입장료가 있으면 성인·어린이 기준을 쓰고 무료이면 무료라고 쓴다. JSON 형식은 {"overview":"한 문장","localizations":[{"id":"모든 후보 id","koreanName":"실제 명칭의 한글 독음"}],"recommendations":[{"id":"후보 id","reason":"짧은 추천 이유","famousItems":["대표 메뉴/상품/볼거리 최대 2개"],"priceGuide":"엔화 가격대","familyTip":"짧은 가족 팁","bestTime":"추천 시간","priority":1}],"guide":{"title":"...","overview":"...","days":[{"day":1,"title":"...","stops":[{"id":"선택한 장소 id","time":"09:30","reason":"대표 음식·가격·방문 포인트를 포함한 짧은 설명"}],"tips":["짧은 팁"]}],"familyTips":["최대 3개"],"weatherBackup":["최대 3개"]}}다. 하루 장소는 3~5곳으로 제한한다.`},
        {role:"user",content:JSON.stringify({currentTimeKST:koreaTime,trip:body.trip,candidates})}
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
