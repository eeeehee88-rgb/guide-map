export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body = await request.json().catch(()=>null);
  const places = Array.isArray(body?.places) ? body.places.slice(0,16) : [];
  if (!body?.trip || !places.length) return Response.json({error:"추천 장소와 여행 정보가 필요해요."},{status:400});
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
      max_tokens:2600,
      messages:[
        {role:"system",content:`너는 실제 여행책을 만드는 가족여행 편집자다. 제공된 장소만 사용하고 JSON만 답한다. 모든 비용은 반드시 trip.currency 화폐만 사용하고 다른 국가 화폐를 섞지 않는다. Google 설명과 reviewHighlights에 실제로 언급된 메뉴·상품명을 최우선으로 추출한다. "대표 메뉴", "추천 상품", "지역 특산품", "시그니처 음료" 같은 일반명은 items.name에 절대 쓰지 않는다. 근거가 없으면 상품을 지어내지 말고 "매장 현장 메뉴 확인"으로 쓴다. placeDetails에는 식당·카페·쇼핑·주류 장소를 최대 14곳까지 빠짐없이 넣고, 각 장소별 실제 메뉴·상품을 최대 4개와 확인 가능한 가격으로 적는다. 고령자와 어린이가 무리하지 않도록 하루 3~4곳, 90분마다 휴식을 둔다. 각 stop reason에는 관광지에서 할 일, 식당의 실제 주문 메뉴, 쇼핑할 실제 상품, 주류 종류와 이동 유의점을 구체적으로 쓴다. 형식 {"title":"지역명 우리 가족 실전 가이드","overview":"이 지역에서 무엇을 보고 먹고 살지 요약","placeDetails":[{"id":"장소 id","description":"실제 판매 품목과 특징","items":[{"name":"후기·설명에 나온 실제 메뉴·상품명","price":"입력 가격 또는 가격 현장 확인"}]}],"days":[{"day":1,"title":"하루 테마","stops":[{"id":"장소 id","time":"09:30","reason":"여기서 할 일·먹을 것·살 것·가격·이동 팁"}],"tips":["교통·휴식·예약 팁"]}],"familyTips":["3개"],"weatherBackup":["실내 대체안 3개"]}.`},
        {role:"user",content:JSON.stringify({currentTimeKST:koreaTime,trip:body.trip,hotel:body.hotel,places})}
      ]
    })
  });
  if (!response.ok) return Response.json({error:response.status===402?"AI 잔액을 확인해 주세요.":"AI 가이드북을 만들지 못했어요."},{status:response.status});
  const data = await response.json();
  try {
    return Response.json({guide:JSON.parse(data.choices?.[0]?.message?.content || "{}")});
  } catch {
    return Response.json({error:"AI 가이드북 결과를 정리하지 못했어요."},{status:502});
  }
}
