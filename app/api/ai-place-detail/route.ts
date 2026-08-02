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
        {role:"system",content:`너는 선택 국가의 현지 매장 정보를 한국 가족 여행자 관점으로 분석하는 AI 여행 큐레이터다. 입력된 매장명·업종·설명·후기만 근거로 한국어 JSON을 만든다. 과장하지 말고, 근거가 약하면 "확인 필요"라고 쓴다.

모든 비용은 입력된 currency 화폐만 사용하고 다른 국가 화폐를 섞지 않는다. 식당·카페면 무엇을 파는 곳인지 구체적으로 설명하고, 후기에서 실제 언급된 메뉴를 우선해 2~5개 제시한다. 쇼핑점이면 주요 상품군과 후기에서 언급된 상품을 제시한다. 입력에 실제 가격이 있으면 사용한다. 가격이 없지만 품목 종류가 명확하면 해당 국가 일반 시세를 "추정 약 금액"으로 표시한다. 근거 없이 특정 시그니처 메뉴라고 단정하지 않는다.

형식 {"title":"AI 분석 제목 18자 내외","decision":"왜 추천/주의인지 한 문장","description":"무엇을 파는 곳인지와 여행자가 기대할 경험","items":[{"name":"메뉴·상품명 또는 판매 품목 종류","price":"실제 또는 추정 가격"}],"visitTip":"가족 여행자가 방문할 때의 실전 팁","evidenceTags":["후기 기반","영업정보 확인","가족 동선","가격 추정"] 중 실제 근거를 2~4개 자연어 태그로 작성,"source":"장소 설명·후기 / 업종·일반 시세 추정 중 해당 근거"}.`},
        {role:"user",content:JSON.stringify({
          name:body.name,originalName:body.originalName,type:body.type,
          country:body.country,currency:body.currency,
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
        title:String(result.title||"").trim(),
        decision:String(result.decision||"").trim(),
        description:String(result.description||"").trim(),
        items:Array.isArray(result.items)?result.items.filter((item:any)=>item?.name).slice(0,5).map((item:any)=>({
          name:String(item.name),price:String(item.price||"가격 현장 확인")
        })):[],
        visitTip:String(result.visitTip||"").trim(),
        evidenceTags:Array.isArray(result.evidenceTags)?result.evidenceTags.filter(Boolean).slice(0,4).map((item:any)=>String(item)):[],
        source:String(result.source||"장소 정보").trim()
      }
    });
  } catch {
    return Response.json({error:"매장 정보를 정리하지 못했어요."},{status:502});
  }
}

