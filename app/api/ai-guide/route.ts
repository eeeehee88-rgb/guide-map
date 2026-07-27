export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body = await request.json().catch(()=>null);
  const places = Array.isArray(body?.places) ? body.places.slice(0,18) : [];
  if (!body?.trip || !places.length) return Response.json({error:"추천 장소와 여행 정보가 필요해요."},{status:400});

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      response_format:{type:"json_object"},
      temperature:0.2,
      max_tokens:2400,
      messages:[
        {role:"system",content:`너는 일본 가족여행 일정 설계자다. 제공된 장소만 사용하고, 아이와 고령자가 무리하지 않도록 하루 3~5곳과 휴식을 배치한다. 이동 동선은 좌표와 카테고리를 참고한다. 설명은 짧게 쓴다. 한국어 JSON {"title":"...","overview":"...","days":[{"day":1,"title":"...","stops":[{"id":"장소 id","time":"09:30","reason":"짧은 방문 포인트"}],"tips":["짧은 팁"]}],"familyTips":["최대 3개"],"weatherBackup":["최대 3개"]}만 출력한다. 여행 일수가 없으면 1일 코스로 만든다.`},
        {role:"user",content:JSON.stringify({trip:body.trip,hotel:body.hotel,places})}
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
