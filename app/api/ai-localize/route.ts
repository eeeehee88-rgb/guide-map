export async function POST(request:Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body = await request.json().catch(()=>null);
  const places = Array.isArray(body?.places) ? body.places.slice(0,12) : [];
  if (!places.length) return Response.json({error:"장소명이 필요해요."},{status:400});

  const response = await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    signal:AbortSignal.timeout(15000),
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      thinking:{type:"disabled"},
      response_format:{type:"json_object"},
      max_tokens:700,
      messages:[
        {role:"system",content:`일본 장소·상호명의 한글 독음 전문가다. 번역한 업종명이 아니라 일본인이 읽는 실제 명칭을 한글로 적는다. 예: 松野屋→마쓰노야, 犬山城→이누야마성. "일본 음식점", "현지 카페", "관광 명소" 같은 일반 업종명은 절대 쓰지 않는다. 모르는 고유명사는 원문 발음을 최대한 음역한다. {"places":[{"id":"입력 id","koreanName":"한글 독음"}]} JSON만 출력하고 모든 입력 id를 빠짐없이 반환한다.`},
        {role:"user",content:JSON.stringify({places})}
      ]
    })
  });
  if (!response.ok) return Response.json({error:"장소명을 변환하지 못했어요."},{status:response.status});
  const data = await response.json();
  try {
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return Response.json({places:Array.isArray(result.places)?result.places:[]});
  } catch {
    return Response.json({error:"장소명 결과를 정리하지 못했어요."},{status:502});
  }
}
