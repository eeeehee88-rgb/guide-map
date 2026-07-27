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
      max_tokens:3400,
      messages:[
        {role:"system",content:`너는 일본 가족여행 추천 기획자다. 제공된 Google 장소 후보만 사용해 여행 구성원과 일정에 맞는 장소를 선정하고 한국어 JSON으로 답한다. 존재하지 않는 장소를 추가하지 않는다. localizations에는 모든 후보 id와 실제 일본어 상호·장소명의 한글 독음을 빠짐없이 쓴다. 업종 번역인 "일본 음식점", "현지 카페", "관광 명소" 등을 koreanName으로 쓰면 안 된다. 최대 16곳을 카테고리별로 다양하게 선정하고, 선택한 id만 이용해 무리 없는 일정을 함께 만든다. 시그니처 메뉴·상품은 reviewHighlights에 실제 언급된 항목을 최우선으로 쓴다. 음식점·카페·디저트·술집은 대표 메뉴, 쇼핑·소품샵·시장·주류점은 대표 상품, 관광지는 입장권이나 핵심 체험을 recommendedItems에 2~3개 쓴다. 각 항목 price는 Google 가격·리뷰에 근거한 실제 가격을 우선하고, 근거가 부족하면 "추정 약 ¥금액~", 전혀 알 수 없으면 "가격 현장 확인"으로 쓴다. 매장명만 보고 구체적인 메뉴나 가격을 지어내지 않는다. googlePriceRange가 있으면 숫자와 통화를 그대로 priceGuide에 사용한다. 없으면 googlePriceLevel과 리뷰를 참고하고, 그래도 근거가 없을 때만 일본 현지 일반 가격을 "추정 약 ¥금액~"으로 표시한다. evidence에는 "Google 가격 범위", "Google 리뷰 언급", "Google 가격 수준", "일반 시세 추정" 중 실제 사용한 근거를 쓴다. 관광지는 입장료가 확인되지 않으면 임의 금액을 만들지 않는다. visitTip은 혼잡·대기·아이 동반 유의사항을, parkingTip은 확인된 주차 정보만 쓰고 알 수 없으면 "주차장 정보 방문 전 확인"으로 쓴다. JSON 형식은 {"overview":"한 문장","localizations":[{"id":"모든 후보 id","koreanName":"실제 명칭의 한글 독음"}],"recommendations":[{"id":"후보 id","reason":"짧은 추천 이유","famousItems":["근거 있는 대표 메뉴/상품/볼거리 최대 2개"],"recommendedItems":[{"name":"메뉴·상품·체험명","price":"개별 가격 또는 가격 현장 확인"}],"priceGuide":"근거 있는 엔화 가격대","evidence":"정보 근거","familyTip":"짧은 가족 팁","visitTip":"혼잡·대기·연령 팁","parkingTip":"확인된 주차 정보 또는 주차장 정보 방문 전 확인","bestTime":"추천 시간","priority":1}],"guide":{"title":"...","overview":"...","days":[{"day":1,"title":"...","stops":[{"id":"선택한 장소 id","time":"09:30","reason":"대표 음식·가격·방문 포인트를 포함한 짧은 설명"}],"tips":["짧은 팁"]}],"familyTips":["최대 3개"],"weatherBackup":["최대 3개"]}}다. 하루 장소는 3~5곳으로 제한한다.`},
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
