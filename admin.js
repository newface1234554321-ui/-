const sb = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const loginBox = document.getElementById("loginBox");
const manageBox = document.getElementById("manageBox");
const loginButton = document.getElementById("login");
const logoutButton = document.getElementById("logout");
const loginMsg = document.getElementById("loginMsg");

let all = [];
let editingId = null;


/* =========================
   로그인
========================= */

async function checkLogin() {
  const result = await sb.auth.getSession();
  const session = result.data.session;

  if (session) {
    showAdmin(session);
  } else {
    showLogin();
  }
}

function showLogin() {
  loginBox.hidden = false;
  manageBox.hidden = true;
  logoutButton.hidden = true;
}

function showAdmin(session) {
  loginBox.hidden = true;
  manageBox.hidden = false;
  logoutButton.hidden = false;

  loadStickers();
}


/* =========================
   로그인 버튼
========================= */

loginButton.addEventListener("click", async function () {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  if (!email || !password) {
    loginMsg.textContent =
      "이메일과 비밀번호를 입력해줘";
    return;
  }

  loginButton.disabled = true;
  loginMsg.textContent = "로그인 중...";

  const result =
    await sb.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (result.error) {

    loginMsg.textContent =
      result.error.message;

    loginButton.disabled = false;
    return;
  }

  loginMsg.textContent =
    "로그인 완료";

  showAdmin(result.data.session);

  loginButton.disabled = false;
});


/* =========================
   로그아웃
========================= */

logoutButton.addEventListener(
  "click",
  async function () {

    await sb.auth.signOut();

    showLogin();
  }
);


sb.auth.onAuthStateChange(
  function (_event, session) {

    if (session) {
      showAdmin(session);
    } else {
      showLogin();
    }

  }
);


/* =========================
   포켓몬 목록 불러오기
========================= */

async function loadStickers() {

  const result =
    await sb
      .from("stickers")
      .select("*")
      .order("number", {
        ascending: true
      });

  if (result.error) {

    document.getElementById("rows").innerHTML =
      `<tr>
        <td colspan="7">
          ${escapeHtml(result.error.message)}
        </td>
      </tr>`;

    return;
  }

  all = result.data || [];

  render();
}


/* =========================
   목록 표시
========================= */

function render() {

  const search =
    document
      .getElementById("adminSearch")
      .value
      .trim()
      .toLowerCase();

  const list =
    all.filter(function (item) {

      return (
        !search ||
        String(item.number).includes(search) ||
        (item.name || "")
          .toLowerCase()
          .includes(search) ||
        (item.form || "")
          .toLowerCase()
          .includes(search)
      );

    });


  const rows =
    document.getElementById("rows");


  rows.innerHTML =
    list.map(function (item) {

      return `
        <tr>

          <td>
            #${String(item.number).padStart(3, "0")}
          </td>

          <td>
            ${escapeHtml(item.name || "")}
          </td>

          <td>
            ${item.status === "owned"
              ? "보유"
              : "구하는 중"}
          </td>

          <td>
            ${Number(item.quantity || 0)}개
          </td>

          <td>
            ${escapeHtml(item.form || "일반")}
          </td>

          <td>
            ${escapeHtml(item.note || "")}
          </td>

          <td>

            <button
              class="edit"
              data-id="${item.id}"
              type="button"
            >
              수정
            </button>

            <button
              class="delete"
              data-id="${item.id}"
              type="button"
            >
              삭제
            </button>

          </td>

        </tr>
      `;

    }).join("");


  document
    .querySelectorAll(".edit")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          openModal(
            button.dataset.id
          );

        }
      );

    });


  document
    .querySelectorAll(".delete")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          deleteSticker(
            button.dataset.id
          );

        }
      );

    });

}


document
  .getElementById("adminSearch")
  .addEventListener(
    "input",
    render
  );


/* =========================
   추가 버튼
========================= */

document
  .getElementById("addBtn")
  .addEventListener(
    "click",
    function () {

      openModal();

    }
  );


/* =========================
   수정창
========================= */

function openModal(id) {

  editingId =
    id || null;


  const item =
    all.find(function (x) {

      return String(x.id) ===
        String(id);

    });


  document.getElementById(
    "modalTitle"
  ).textContent =
    item
      ? "띠부실 수정"
      : "띠부실 추가";


  document.getElementById(
    "formNo"
  ).value =
    item
      ? item.number
      : "";


  document.getElementById(
    "formName"
  ).value =
    item
      ? item.name
      : "";


  document.getElementById(
    "formStatus"
  ).value =
    item
      ? item.status
      : "wanted";


  document.getElementById(
    "formNote"
  ).value =
    item
      ? item.note || ""
      : "";


  /*
     새로 추가된 값
  */

  document.getElementById(
    "formQuantity"
  ).value =
    item
      ? Number(item.quantity || 0)
      : 0;


  document.getElementById(
    "formForm"
  ).value =
    item
      ? item.form || "일반"
      : "일반";


  document.getElementById(
    "formMsg"
  ).textContent = "";


  document.getElementById(
    "modal"
  ).hidden = false;

}


/* =========================
   모달 닫기
========================= */

document
  .getElementById("closeModal")
  .addEventListener(
    "click",
    function () {

      document.getElementById(
        "modal"
      ).hidden = true;

    }
  );


/* =========================
   저장
========================= */

document
  .getElementById("saveBtn")
  .addEventListener(
    "click",
    async function () {

      const number =
        Number(
          document.getElementById(
            "formNo"
          ).value
        );


      const name =
        document.getElementById(
          "formName"
        ).value.trim();


      const status =
        document.getElementById(
          "formStatus"
        ).value;


      const note =
        document.getElementById(
          "formNote"
        ).value.trim();


      const quantity =
        Number(
          document.getElementById(
            "formQuantity"
          ).value
        );


      const form =
        document.getElementById(
          "formForm"
        ).value.trim();


      const msg =
        document.getElementById(
          "formMsg"
        );


      if (!number || !name) {

        msg.textContent =
          "번호와 이름을 입력해줘";

        return;
      }


      if (quantity < 0) {

        msg.textContent =
          "수량은 0개 이상으로 입력해줘";

        return;
      }


      let result;


      const data = {

        number: number,

        name: name,

        status: status,

        note: note,

        quantity: quantity,

        form: form || "일반"

      };


      if (editingId) {

        result =
          await sb
            .from("stickers")
            .update(data)
            .eq("id", editingId);

      } else {

        result =
          await sb
            .from("stickers")
            .insert(data);

      }


      if (result.error) {

        msg.textContent =
          result.error.message;

        return;
      }


      document.getElementById(
        "modal"
      ).hidden = true;


      await loadStickers();

    }
  );


/* =========================
   삭제
========================= */

async function deleteSticker(id) {

  if (
    !confirm(
      "정말 삭제할까?"
    )
  ) {
    return;
  }


  const result =
    await sb
      .from("stickers")
      .delete()
      .eq("id", id);


  if (result.error) {

    alert(
      result.error.message
    );

    return;
  }


  await loadStickers();

}


/* =========================
   HTML 보호
========================= */

function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    function (char) {

      return {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      }[char];

    }
  );

}


/* =========================
   초기화
========================= */

document.getElementById(
  "modal"
).hidden = true;


checkLogin();
