export async function POST(request:Request) {
  const key=process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({error:"AI 설정이 필요해요."},{status:503});
  const body=await request.json().catch(()=>null);
  if (!body?.name) return Response.json({error:"장소 정보가 필요해요."},{status:400});
  const reviews=Array.isArray(body.reviews) ? body.reviews.slice(0,5) : [];
  const response=await fetch("https://api.deepseek.com/chat/completions",{
    method:"POST",
    signal:AbortSignal.timeout(14000),
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"deepseek-v4-flash",
      thinking:{type:"disabled"},
      response_format:{type:"json_object"},
      temperature:0.1,
      max_tokens:800,
      messages:[
        {role:"system",content:`너는 일본 현지 매장 정보 편집자다. 입력된 Google 매장명·업종·설명·후기만 근거로 한국어 JSON을 만든다. 식당·카페면 무엇을 파는 곳인지 한 문장으로 구체적으로 설명하고, 후기에서 실제 언급된 메뉴를 우선해 2~5개 제시한다. 쇼핑점이면 주요 상품군과 후기에서 언급된 상품을 제시한다. 입력에 실제 가격이 있으면 사용한다. 가격이 없지만 품목 종류가 명확하면 일본 일반 시세를 "추정 약 ¥금액~"으로 표시한다. 근거 없이 특정 시그니처 메뉴라고 단정하지 않는다. 업종만 알 수 있으면 판매 음식 종류를 설명하고 메뉴명에는 "매장 인기 메뉴 현장 확인"을 쓰지 말고 대표적인 판매 품목 종류를 쓴다. 형식 {"description":"무엇을 파는 곳인지 구체적인 설명","items":[{"name":"메뉴·상품명 또는 판매 품목 종류","price":"실제 또는 추정 가격"}],"source":"Google 매장 설명·후기 / Google 업종·일반 시세 추정 중 해당 근거"}.`},
        {role:"user",content:JSON.stringify({
          name:body.name,originalName:body.originalName,type:body.type,
          googleSummary:body.googleSummary,googlePrice:body.googlePrice,reviews
        })}
      ]
    })
  });
  if (!response.ok) return Response.json({error:"매장 정보를 보강하지 못했어요."},{status:response.status});
  const data=await response.json();
  try {
    const result=JSON.parse(data.choices?.[0]?.message?.content||"{}");
    return Response.json({
      detail:{
        description:String(result.description||"").trim(),
        items:Array.isArray(result.items)?result.items.filter((item:any)=>item?.name).slice(0,5).map((item:any)=>({
          name:String(item.name),price:String(item.price||"가격 현장 확인")
        })):[],
        source:String(result.source||"Google 장소 정보").trim()
      }
    });
  } catch {
    return Response.json({error:"매장 정보를 정리하지 못했어요."},{status:502});
  }
}
