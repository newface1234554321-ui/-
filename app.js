const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
let all = [];
const grid = document.querySelector("#grid"), empty = document.querySelector("#empty");
async function load(){
  const {data,error}=await sb.from("stickers").select("*").order("number",{ascending:true});
  if(error){empty.hidden=false;empty.textContent="데이터를 불러오지 못했습니다. config.js 설정을 확인하세요.";return}
  all=data||[]; render();
}
function render(){
  const q=document.querySelector("#search").value.trim().toLowerCase(), s=document.querySelector("#status").value;
  const list=all.filter(x=>(s==="all"||x.status===s)&&(!q||String(x.number).includes(q)||(x.name||"").toLowerCase().includes(q)));
  document.querySelector("#ownedCount").textContent=all.filter(x=>x.status==="owned").length;
  document.querySelector("#wantedCount").textContent=all.filter(x=>x.status==="wanted").length;
  grid.innerHTML=list.map(x=>`<article class="card"><div class="num">#${x.number}</div><div class="name">${escapeHtml(x.name||"이름 미등록")}</div><span class="badge ${x.status}">${x.status==="owned"?"보유":"구하는 중"}</span></article>`).join("");
  empty.hidden=list.length>0;
}
function escapeHtml(v){return v.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
document.querySelector("#search").addEventListener("input",render);
document.querySelector("#status").addEventListener("change",render);
load();