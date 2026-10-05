```javascript
const sb = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const loginBox = document.querySelector("#loginBox");
const manageBox = document.querySelector("#manageBox");
const modal = document.querySelector("#modal");
const logoutBtn = document.querySelector("#logout");

let editing = null;
let all = [];


/* =========================
   로그인
========================= */

async function init() {
  const {
    data: { session }
  } = await sb.auth.getSession();

  setLogged(session);

  sb.auth.onAuthStateChange((_event, session) => {
    setLogged(session);
  });
}

function setLogged(session) {
  if (session) {
    loginBox.hidden = true;
    manageBox.hidden = false;
    logoutBtn.hidden = false;

    load();
  } else {
    loginBox.hidden = false;
    manageBox.hidden = true;
    logoutBtn.hidden = true;

    modal.hidden = true;
  }
}

document.querySelector("#login").onclick = async () => {
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  const msg = document.querySelector("#loginMsg");

  if (!email || !password) {
    msg.textContent = "이메일과 비밀번호를 입력해줘";
    return;
  }

  msg.textContent = "로그인 중...";

  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  if (data.session) {
    msg.textContent = "로그인 완료";
    setLogged(data.session);
  }
};


/* =========================
   로그아웃
========================= */

logoutBtn.onclick = async () => {
  modal.hidden = true;
  await sb.auth.signOut();
};


/* =========================
   띠부실 불러오기
========================= */

async function load() {
  const { data, error } = await sb
    .from("stickers")
    .select("*")
    .order("number", { ascending: true });

  if (error) {
    document.querySelector("#rows").innerHTML =
      `<tr><td colspan="5">${esc(error.message)}</td></tr>`;
    return;
  }

  all = data || [];
  render();
}


/* =========================
   목록 표시
========================= */

function render() {
  const q = document
    .querySelector("#adminSearch")
    .value
    .trim()
    .toLowerCase();

  const list = all.filter(
    x =>
      !q ||
      String(x.number).includes(q) ||
      (x.name || "").toLowerCase().includes(q)
  );

  document.querySelector("#rows").innerHTML = list
    .map(
      x => `
        <tr>
          <td>#${x.number}</td>
          <td>${esc(x.name || "")}</td>
          <td>${x.status === "owned" ? "보유" : "구하는 중"}</td>
          <td>${esc(x.note || "")}</td>
          <td>
            <button class="edit" data-id="${x.id}">수정</button>
            <button class="delete" data-id="${x.id}">삭제</button>
          </td>
        </tr>
      `
    )
    .join("");
    
  document.querySelectorAll(".edit").forEach(button => {
    button.onclick = () => openEdit(button.dataset.id);
  });

  document.querySelectorAll(".delete").forEach(button => {
    button.onclick = () => remove(button.dataset.id);
  });
}


/* =========================
   HTML 문자 보호
========================= */

function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[m]
  );
}


/* =========================
   검색
========================= */

document.querySelector("#adminSearch").oninput = render;


/* =========================
   추가 / 수정 창
========================= */

document.querySelector("#addBtn").onclick = () => {
  openEdit();
};

document.querySelector("#closeModal").onclick = () => {
  modal.hidden = true;
};

modal.addEventListener("click", event => {
  if (event.target === modal) {
    modal.hidden = true;
  }
});


function openEdit(id) {
  editing = id || null;

  const x = all.find(item => item.id === id);

  document.querySelector("#modalTitle").textContent =
    x ? "띠부실 수정" : "띠부실 추가";

  document.querySelector("#formNo").value =
    x?.number || "";

  document.querySelector("#formName").value =
    x?.name || "";

  // 기존 포켓몬은 기존 상태 유지
  // 새로 추가하는 포켓몬은 구하는 중
  document.querySelector("#formStatus").value =
    x?.status || "wanted";

  document.querySelector("#formNote").value =
    x?.note || "";

  document.querySelector("#formMsg").textContent = "";

  modal.hidden = false;
}


/* =========================
   저장
========================= */

document.querySelector("#saveBtn").onclick = async () => {
  const payload = {
    number: Number(
      document.querySelector("#formNo").value
    ),

    name: document
      .querySelector("#formName")
      .value
      .trim(),

    status: document
      .querySelector("#formStatus")
      .value,

    note: document
      .querySelector("#formNote")
      .value
      .trim()
  };

  const msg = document.querySelector("#formMsg");

  if (!payload.number || !payload.name) {
    msg.textContent = "번호와 이름을 입력해줘";
    return;
  }

  const q = editing
    ? sb
        .from("stickers")
        .update(payload)
        .eq("id", editing)
    : sb
        .from("stickers")
        .insert(payload);

  const { error } = await q;

  if (error) {
    msg.textContent = error.message;
    return;
  }

  modal.hidden = true;

  await load();
};


/* =========================
   삭제
========================= */

async function remove(id) {
  if (!confirm("정말 삭제할까?")) {
    return;
  }

  const { error } = await sb
    .from("stickers")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await load();
}


/* =========================
   전국도감 1~1026 자동 등록
========================= */

document.querySelector("#pokemonLoadBtn").onclick = async () => {

  const button =
    document.querySelector("#pokemonLoadBtn");

  const msg =
    document.querySelector("#pokemonLoadMsg");

  const ok = confirm(
    "전국도감 1~1026번을 자동으로 등록할까?\n\n" +
    "이미 등록된 포켓몬은 건드리지 않고\n" +
    "없는 포켓몬만 '구하는 중'으로 추가해."
  );

  if (!ok) {
    return;
  }

  button.disabled = true;

  msg.textContent =
    "전국도감 정보를 가져오는 중...";

  try {

    /* 현재 등록된 번호 확인 */

    const {
      data: existing,
      error: existingError
    } = await sb
      .from("stickers")
      .select("number");

    if (existingError) {
      throw existingError;
    }

    const existingNumbers =
      new Set(
        (existing || []).map(
          x => Number(x.number)
        )
      );


    /* PokéAPI에서 1~1026 목록 가져오기 */

    const listResponse = await fetch(
      "https://pokeapi.co/api/v2/pokemon-species?limit=1026&offset=0"
    );

    if (!listResponse.ok) {
      throw new Error(
        "포켓몬 목록을 가져오지 못했어"
      );
    }

    const listData =
      await listResponse.json();

    const pokemonList =
      listData.results
        .map((x, index) => ({
          number: index + 1,
          url: x.url
        }))
        .filter(
          x => x.number <= 1026
        );


    /* 없는 포켓몬만 가져오기 */

    const newPokemon = [];

    for (
      let i = 0;
      i < pokemonList.length;
      i++
    ) {

      const pokemon =
        pokemonList[i];

      if (
        existingNumbers.has(
          pokemon.number
        )
      ) {
        continue;
      }

      const response =
        await fetch(pokemon.url);

      if (!response.ok) {
        throw new Error(
          `#${pokemon.number} 데이터를 가져오지 못했어`
        );
      }

      const data =
        await response.json();

      const koreanName =
        data.names?.find(
          x =>
            x.language?.name === "ko"
        );

      const name =
        koreanName?.name ||
        data.name;

      newPokemon.push({
        number: pokemon.number,
        name: name,
        status: "wanted",
        note: ""
      });

      msg.textContent =
        `포켓몬 이름을 가져오는 중... ${
          i + 1
        } / ${pokemonList.length}`;
    }


    /* 이미 전부 등록되어 있는 경우 */

    if (newPokemon.length === 0) {

      msg.textContent =
        "이미 모든 포켓몬이 등록되어 있어.";

      button.disabled = false;

      return;
    }


    /* Supabase에 100개씩 등록 */

    const batchSize = 100;

    for (
      let i = 0;
      i < newPokemon.length;
      i += batchSize
    ) {

      const batch =
        newPokemon.slice(
          i,
          i + batchSize
        );

      const { error } =
        await sb
          .from("stickers")
          .insert(batch);

      if (error) {
        throw error;
      }

      msg.textContent =
        `${
          Math.min(
            i + batch.length,
            newPokemon.length
          )
        } / ${
          newPokemon.length
        }마리 등록 완료`;
    }


    /* 완료 */

    msg.textContent =
      `완료! ${
        newPokemon.length
      }마리를 등록했어.`;

    await load();

  } catch (error) {

    console.error(error);

    msg.textContent =
      "등록 중 오류가 발생했어: " +
      error.message;

  } finally {

    button.disabled = false;

  }
};


/* =========================
   시작
========================= */

modal.hidden = true;

init();
```
