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

    // 로그인하지 않은 상태에서는 추가창을 무조건 닫음
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

// 추가 버튼을 눌렀을 때만 창을 열음
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
  document.querySelector("#formStatus").value = x?.status || "owned";
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

// 페이지가 열리자마자 추가창이 뜨지 않도록 강제로 닫고 시작
modal.hidden = true;

init();
