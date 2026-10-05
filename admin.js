const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const loginBox=document.querySelector("#loginBox"), manageBox=document.querySelector("#manageBox"), modal=document.querySelector("#modal");
let editing=null, all=[];
async function init(){
 const {data:{session}}=await sb.auth.getSession(); setLogged(session);
 sb.auth.onAuthStateChange((_e,s)=>setLogged(s));
}
function setLogged(session){
 if(session){loginBox.hidden=true;manageBox.hidden=false;document.querySelector("#logout").hidden=false;load()}
 else{loginBox.hidden=false;manageBox.hidden=true;document.querySelector("#logout").hidden=true}
}
document.querySelector("#login").onclick=async()=>{
 const email=document.querySelector("#email").value.trim(), password=document.querySelector("#password").value;
 const {error}=await sb.auth.signInWithPassword({email,password});
 document.querySelector("#loginMsg").textContent=error?error.message:"로그인 완료";
};
document.querySelector("#logout").onclick=()=>sb.auth.signOut();
async function load(){
 const {data,error}=await sb.from("stickers").select("*").order("number",{ascending:true});
 if(error){document.querySelector("#rows").innerHTML=`<tr><td colspan="5">${error.message}</td></tr>`;return}
 all=data||[]; render();
}
function render(){
 const q=document.querySelector("#adminSearch").value.trim().toLowerCase();
 document.querySelector("#rows").innerHTML=all.filter(x=>!q||String(x.number).includes(q)||(x.name||"").toLowerCase().includes(q)).map(x=>`<tr><td>#${x.number}</td><td>${esc(x.name||"")}</td><td>${x.status==="owned"?"보유":"구하는 중"}</td><td>${esc(x.note||"")}</td><td><button class="edit" data-id="${x.id}">수정</button> <button class="delete" data-id="${x.id}">삭제</button></td></tr>`).join("");
 document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>openEdit(b.dataset.id));
 document.querySelectorAll(".delete").forEach(b=>b.onclick=()=>remove(b.dataset.id));
}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
document.querySelector("#adminSearch").oninput=render;
document.querySelector("#addBtn").onclick=()=>openEdit();
document.querySelector("#closeModal").onclick=()=>modal.hidden=true;
function openEdit(id){
 editing=id||null; const x=all.find(a=>a.id===id);
 document.querySelector("#modalTitle").textContent=x?"띠부실 수정":"띠부실 추가";
 document.querySelector("#formNo").value=x?.number||"";
 document.querySelector("#formName").value=x?.name||"";
 document.querySelector("#formStatus").value=x?.status||"owned";
 document.querySelector("#formNote").value=x?.note||"";
 document.querySelector("#formMsg").textContent="";
 modal.hidden=false;
}
document.querySelector("#saveBtn").onclick=async()=>{
 const payload={number:Number(document.querySelector("#formNo").value),name:document.querySelector("#formName").value.trim(),status:document.querySelector("#formStatus").value,note:document.querySelector("#formNote").value.trim()};
 if(!payload.number||!payload.name){document.querySelector("#formMsg").textContent="번호와 이름을 입력해줘";return}
 const q=editing?sb.from("stickers").update(payload).eq("id",editing):sb.from("stickers").insert(payload);
 const {error}=await q;
 if(error){document.querySelector("#formMsg").textContent=error.message;return}
 modal.hidden=true;load();
};
async function remove(id){
 if(!confirm("정말 삭제할까?"))return;
 const {error}=await sb.from("stickers").delete().eq("id",id);
 if(error)alert(error.message);else load();
}
init();