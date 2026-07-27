export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body = await request.json().catch(()=>null);
  const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0,18) : [];
  if (!body?.trip || !candidates.length) return Response.json({error:"여행 정보와 장소 후보가 필요해요."},{status:400});
  const koreaTime = new Intl.DateTimeFormat("ko-KR",{
    timeZone:"Asia/Seoul",dateStyle:"full",timeStyle:"short"
  }).format(new Date());

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    signal:AbortSignal.timeout(18000),
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      thinking:{type:"disabled"},
      response_format:{type:"json_object"},
      temperature:0.2,
      max_tokens:2200,
      messages:[
        {role:"system",content:`너는 일본 가족여행 편집자다. 제공된 Google 후보만 사용해 JSON만 답한다. 최대 12곳을 선정한다. 상호는 업종으로 번역하지 말고 실제 일본어 발음을 한글로 쓴다. 메뉴·상품·가격은 입력의 Google 가격·리뷰·recommendedMenu를 우선하며 근거가 없으면 "가격 현장 확인"으로 쓴다. 이유와 팁은 각 1문장으로 짧게 쓴다. 일정은 고령자와 어린이를 고려해 하루 3~4곳, 점심·카페·휴식을 포함하고 같은 카테고리를 연속 배치하지 않는다. 형식 {"overview":"한 문장","localizations":[{"id":"후보 id","koreanName":"한글 독음"}],"recommendations":[{"id":"후보 id","reason":"선정 이유","famousItems":["대표 항목 최대 2개"],"recommendedItems":[{"name":"메뉴·상품·체험","price":"가격"}],"priceGuide":"가격대","evidence":"Google 가격 또는 일반 시세 추정","familyTip":"가족 팁","visitTip":"방문 팁","parkingTip":"주차 팁","bestTime":"추천 시간","priority":1}],"guide":{"title":"지역명 가족 여행 가이드","overview":"여행 콘셉트","days":[{"day":1,"title":"그날의 테마","stops":[{"id":"선택 장소 id","time":"09:30","reason":"무엇을 보고·먹고·살지와 예상 가격"}],"tips":["이동·휴식 팁"]}],"familyTips":["3개"],"weatherBackup":["3개"]}}.`},
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
