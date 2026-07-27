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
      max_tokens:1500,
      messages:[
        {role:"system",content:`너는 실제 여행책을 만드는 일본 가족여행 편집자다. 제공된 장소만 사용하고 JSON만 답한다. 고령자와 5·9세 어린이가 무리하지 않도록 하루 3~4곳, 90분마다 휴식을 둔다. 각 stop 설명에는 그 장소에서 실제로 할 일, 대표 메뉴·상품, 입력에 있는 가격, 이동·대기 유의사항 중 중요한 내용을 구체적으로 넣는다. 식사·카페·쇼핑·관광의 균형을 맞추고 같은 유형을 연속 배치하지 않는다. 근거 없는 가격은 만들지 말고 '가격 현장 확인'으로 쓴다. 형식 {"title":"지역명 우리 가족 가이드","overview":"이 여행의 콘셉트","days":[{"day":1,"title":"하루 테마","stops":[{"id":"장소 id","time":"09:30","reason":"무엇을 보고·먹고·살지와 가격·가족 유의점"}],"tips":["교통·휴식·예약 팁"]}],"familyTips":["3개"],"weatherBackup":["실내 대체안 3개"]}.`},
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
