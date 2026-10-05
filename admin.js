```js
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

  const { error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  document.querySelector("#loginMsg").textContent =
    error ? error.message : "로그인 완료";
};

logoutBtn.onclick = () => {
  modal.hidden = true;
  sb.auth.signOut();
};

async function load() {
  const { data, error } = await sb
    .from("stickers")
    .select("*")
    .order("number", { ascending: true });

  if (error) {
    document.querySelector("#rows").innerHTML =
      `<tr><td colspan="5">${error.message}</td></tr>`;
    return;
  }

  all = data || [];
  render();
}

function render() {
  const q = document
    .querySelector("#adminSearch")
    .value
    .trim()
    .toLowerCase();

  document.querySelector("#rows").innerHTML = all
    .filter(
      x =>
        !q ||
        String(x.number).includes(q) ||
        (x.name || "").toLowerCase().includes(q)
    )
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

document.querySelector("#adminSearch").oninput = render;

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

  document.querySelector("#formNo").value = x?.number || "";
  document.querySelector("#formName").value = x?.name || "";

  document.querySelector("#formStatus").value =
    x?.status || "wanted";

  document.querySelector("#formNote").value = x?.note || "";
  document.querySelector("#formMsg").textContent = "";

  modal.hidden = false;
}

document.querySelector("#saveBtn").onclick = async () => {
  const payload = {
    number: Number(document.querySelector("#formNo").value),
    name: document.querySelector("#formName").value.trim(),
    status: document.querySelector("#formStatus").value,
    note: document.querySelector("#formNote").value.trim()
  };

  if (!payload.number || !payload.name) {
    document.querySelector("#formMsg").textContent =
      "번호와 이름을 입력해줘";
    return;
  }

  const q = editing
    ? sb.from("stickers").update(payload).eq("id", editing)
    : sb.from("stickers").insert(payload);

  const { error } = await q;

  if (error) {
    document.querySelector("#formMsg").textContent = error.message;
    return;
  }

  modal.hidden = true;
  load();
};

async function remove(id) {
  if (!confirm("정말 삭제할까?")) return;

  const { error } = await sb
    .from("stickers")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
  } else {
    load();
  }
}


/* =========================
   전국도감 1~1026 자동 등록
   ========================= */

document.querySelector("#pokemonLoadBtn").onclick = async () => {

  const msg = document.querySelector("#pokemonLoadMsg");
  const button = document.querySelector("#pokemonLoadBtn");

  const ok = confirm(
    "전국도감 1~1026번을 자동으로 등록할까?\n\n" +
    "이미 등록된 포켓몬은 건드리지 않고\n" +
    없는 포켓몬만 '구하는 중'으로 추가해."
  );

  if (!ok) return;

  button.disabled = true;
  msg.textContent = "전국도감 정보를 가져오는 중...";

  try {

    const { data: existing, error: existingError } = await sb
      .from("stickers")
      .select("number");

    if (existingError) {
      throw existingError;
    }

    const existingNumbers = new Set(
      (existing || []).map(x => Number(x.number))
    );

    const listResponse = await fetch(
      "https://pokeapi.co/api/v2/pokemon-species?limit=1026&offset=0"
    );

    if (!listResponse.ok) {
      throw new Error("포켓몬 데이터를 가져오지 못했어");
    }

    const listData = await listResponse.json();

    const pokemon = listData.results
      .map((x, index) => ({
        number: index + 1,
        url: x.url
      }))
      .filter(x => x.number <= 1026);

    msg.textContent =
      `포켓몬 이름을 가져오는 중... 0 / ${pokemon.length}`;

    const newPokemon = [];

    for (let i = 0; i < pokemon.length; i++) {

      const p = pokemon[i];

      if (existingNumbers.has(p.number)) {
        continue;
      }

      const response = await fetch(p.url);

      if (!response.ok) {
        throw new Error(`#${p.number} 데이터를 가져오지 못했어`);
      }

      const data = await response.json();

      const koreanName = data.names?.find(
        x => x.language?.name === "ko"
      );

      const name =
        koreanName?.name ||
        data.name;

      newPokemon.push({
        number: p.number,
        name: name,
        status: "wanted",
        note: ""
      });

      msg.textContent =
        `포켓몬 이름을 가져오는 중... ${i + 1} / ${pokemon.length}`;
    }

    if (newPokemon.length === 0) {
      msg.textContent = "이미 모든 포켓몬이 등록되어 있어.";
      button.disabled = false;
      return;
    }

    msg.textContent =
      `${newPokemon.length}마리를 등록하는 중...`;

    const batchSize = 100;

    for (let i = 0; i < newPokemon.length; i += batchSize) {

      const batch = newPokemon.slice(i, i + batchSize);

      const { error } = await sb
        .from("stickers")
        .insert(batch);

      if (error) {
        throw error;
      }

      msg.textContent =
        `${Math.min(
          i + batch.length,
          newPokemon.length
        )} / ${newPokemon.length}마리 등록 완료`;
    }

    msg.textContent =
      `완료! ${newPokemon.length}마리를 등록했어.`;

    await load();

  } catch (error) {

    console.error(error);

    msg.textContent =
      "등록 중 오류가 발생했어: " + error.message;

  } finally {

    button.disabled = false;

  }
};


modal.hidden = true;

init();
```
