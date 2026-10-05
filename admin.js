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
로그인 확인
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

/* =========================
로그인 화면
========================= */

function showLogin() {

loginBox.hidden = false;
manageBox.hidden = true;
logoutButton.hidden = true;

}

/* =========================
관리자 화면
========================= */

function showAdmin(session) {

loginBox.hidden = true;
manageBox.hidden = false;
logoutButton.hidden = false;

loadStickers();

}

/* =========================
로그인
========================= */

loginButton.addEventListener(
"click",
async function () {

```
const email =
  document
    .getElementById("email")
    .value
    .trim();

const password =
  document
    .getElementById("password")
    .value;

if (!email || !password) {

  loginMsg.textContent =
    "이메일과 비밀번호를 입력해줘";

  return;
}

loginButton.disabled = true;

loginMsg.textContent =
  "로그인 중...";


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
```

}
);

/* =========================
로그아웃
========================= */

logoutButton.addEventListener(
"click",
async function () {

```
await sb.auth.signOut();

showLogin();
```

}
);

/* =========================
로그인 상태 감지
========================= */

sb.auth.onAuthStateChange(
function (_event, session) {

```
if (session) {
  showAdmin(session);
} else {
  showLogin();
}
```

}
);

/* =========================
데이터 불러오기
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

```
document.getElementById(
  "rows"
).innerHTML =
  `<tr>
    <td colspan="7">
      ${escapeHtml(result.error.message)}
    </td>
  </tr>`;

return;
```

}

all = result.data || [];

render();

}

/* =========================
표 출력
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

```
  return (
    !search ||

    String(item.number)
      .includes(search) ||

    (item.name || "")
      .toLowerCase()
      .includes(search) ||

    (item.form || "")
      .toLowerCase()
      .includes(search)
  );

});
```

const rows =
document.getElementById("rows");

rows.innerHTML =
list.map(function (item) {

```
  return `

    <tr>

      <td>
        #${String(item.number).padStart(3, "0")}
      </td>

      <td>
        ${escapeHtml(item.name || "")}
      </td>

      <td>
        ${
          item.status === "owned"
            ? "보유"
            : "구하는 중"
        }
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
```

/* 수정 버튼 */

document
.querySelectorAll(".edit")
.forEach(function (button) {

```
  button.addEventListener(
    "click",
    function () {

      openModal(
        button.dataset.id
      );

    }
  );

});
```

/* 삭제 버튼 */

document
.querySelectorAll(".delete")
.forEach(function (button) {

```
  button.addEventListener(
    "click",
    function () {

      deleteSticker(
        button.dataset.id
      );

    }
  );

});
```

}

/* =========================
검색
========================= */

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

```
  openModal();

}
```

);

/* =========================
수정창 열기
========================= */

function openModal(id) {

editingId =
id || null;

const item =
all.find(function (x) {

```
  return String(x.id) ===
    String(id);

});
```

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
"formNote"
).value =
item
? item.note || ""
: "";

document.getElementById(
"formMsg"
).textContent = "";

document.getElementById(
"modal"
).hidden = false;

}

/* =========================
수정창 닫기
========================= */

document
.getElementById("closeModal")
.addEventListener(
"click",
function () {

```
  document.getElementById(
    "modal"
  ).hidden = true;

}
```

);

/* =========================
저장
========================= */

document
.getElementById("saveBtn")
.addEventListener(
"click",
async function () {

```
  const number =
    Number(
      document.getElementById(
        "formNo"
      ).value
    );


  const name =
    document.getElementById(
      "formName"
    ).value
    .trim();


  const status =
    document.getElementById(
      "formStatus"
    ).value;


  const quantity =
    Number(
      document.getElementById(
        "formQuantity"
      ).value
    );


  const form =
    document.getElementById(
      "formForm"
    ).value
    .trim();


  const note =
    document.getElementById(
      "formNote"
    ).value
    .trim();


  const msg =
    document.getElementById(
      "formMsg"
    );


  if (!number || !name) {

    msg.textContent =
      "번호와 이름을 입력해줘";

    return;
  }


  if (
    Number.isNaN(quantity) ||
    quantity < 0
  ) {

    msg.textContent =
      "수량은 0개 이상으로 입력해줘";

    return;
  }


  const data = {

    number: number,

    name: name,

    status: status,

    quantity: quantity,

    form: form || "일반",

    note: note

  };


  let result;


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
```

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

```
alert(
  result.error.message
);

return;
```

}

await loadStickers();

}

/* =========================
HTML 문자 보호
========================= */

function escapeHtml(value) {

return String(value).replace(
/[&<>"']/g,
function (char) {

```
  return {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char];

}
```

);

}

/* =========================
전국도감 자동 등록
========================= */

const pokemonLoadBtn =
document.getElementById(
"pokemonLoadBtn"
);

const pokemonLoadMsg =
document.getElementById(
"pokemonLoadMsg"
);

if (pokemonLoadBtn) {

pokemonLoadBtn.addEventListener(
"click",
async function () {

```
  const ok =
    confirm(
      "전국도감 1~1025번을 자동으로 등록할까?\n\n" +
      "이미 등록된 포켓몬은 건드리지 않고\n" +
      "없는 포켓몬만 '구하는 중'으로 추가해."
    );


  if (!ok) return;


  pokemonLoadBtn.disabled = true;

  pokemonLoadMsg.textContent =
    "기존 목록 확인 중...";


  try {

    const existingResult =
      await sb
        .from("stickers")
        .select("number");


    if (existingResult.error) {
      throw existingResult.error;
    }


    const existingNumbers =
      new Set(
        (existingResult.data || [])
          .map(
            x => Number(x.number)
          )
      );


    pokemonLoadMsg.textContent =
      "전국도감 정보를 가져오는 중...";


    const listResponse =
      await fetch(
        "https://pokeapi.co/api/v2/pokemon-species?limit=1025&offset=0"
      );


    if (!listResponse.ok) {

      throw new Error(
        "포켓몬 목록을 가져오지 못했어"
      );

    }


    const listData =
      await listResponse.json();


    const pokemonList =
      listData.results.map(
        (pokemon, index) => ({

          number: index + 1,

          url: pokemon.url

        })
      );


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
        await fetch(
          pokemon.url
        );


      if (!response.ok) {

        throw new Error(
          `#${pokemon.number} 정보를 가져오지 못했어`
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

        number:
          pokemon.number,

        name:
          name,

        status:
          "wanted",

        quantity:
          0,

        form:
          "일반",

        note:
          ""

      });


      pokemonLoadMsg.textContent =
        `포켓몬 정보 가져오는 중... ${i + 1} / 1025`;

    }


    if (
      newPokemon.length === 0
    ) {

      pokemonLoadMsg.textContent =
        "이미 1~1025번이 전부 등록되어 있어.";

      pokemonLoadBtn.disabled =
        false;

      return;
    }


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


      const result =
        await sb
          .from("stickers")
          .insert(batch);


      if (result.error) {
        throw result.error;
      }


      pokemonLoadMsg.textContent =
        `등록 중... ${
          Math.min(
            i + batch.length,
            newPokemon.length
          )
        } / ${newPokemon.length}`;

    }


    pokemonLoadMsg.textContent =
      `완료! ${newPokemon.length}마리가 등록됐어.`;

    await loadStickers();


  } catch (error) {

    console.error(error);

    pokemonLoadMsg.textContent =
      "등록 중 오류가 발생했어: " +
      error.message;

  } finally {

    pokemonLoadBtn.disabled =
      false;

  }

}
```

);

}

/* =========================
보유 목록 일괄 등록
========================= */

const bulkOwnedBtn =
document.getElementById(
"bulkOwnedBtn"
);

const bulkModal =
document.getElementById(
"bulkModal"
);

const closeBulkModal =
document.getElementById(
"closeBulkModal"
);

const bulkSaveBtn =
document.getElementById(
"bulkSaveBtn"
);

const bulkInput =
document.getElementById(
"bulkInput"
);

const bulkMsg =
document.getElementById(
"bulkMsg"
);

const bulkOwnedMsg =
document.getElementById(
"bulkOwnedMsg"
);

/* 일괄 등록 창 열기 */

if (bulkOwnedBtn) {

bulkOwnedBtn.addEventListener(
"click",
function () {

```
  bulkInput.value = "";

  bulkMsg.textContent = "";

  bulkModal.hidden = false;

}
```

);

}

/* 일괄 등록 창 닫기 */

if (closeBulkModal) {

closeBulkModal.addEventListener(
"click",
function () {

```
  bulkModal.hidden = true;

}
```

);

}

/* =========================
일괄 등록 실행
========================= */

if (bulkSaveBtn) {

bulkSaveBtn.addEventListener(
"click",
async function () {

```
  const text =
    bulkInput.value.trim();


  if (!text) {

    bulkMsg.textContent =
      "등록할 목록을 입력해줘";

    return;
  }


  const lines =
    text
      .split("\n")
      .map(
        line => line.trim()
      )
      .filter(Boolean);


  const items = [];


  for (
    const line of lines
  ) {

    const parts =
      line
        .split("|")
        .map(
          part => part.trim()
        );


    if (parts.length < 3) {

      bulkMsg.textContent =
        `형식이 잘못됐어:\n${line}\n\n예시: 001 | 2 | 일반`;

      return;
    }


    const number =
      Number(parts[0]);


    const quantity =
      Number(parts[1]);


    const form =
      parts.slice(2).join("|").trim();


    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > 1025
    ) {

      bulkMsg.textContent =
        `번호가 잘못됐어: ${parts[0]}`;

      return;
    }


    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {

      bulkMsg.textContent =
        `수량이 잘못됐어: ${parts[1]}`;

      return;
    }


    if (!form) {

      bulkMsg.textContent =
        `폼을 입력해줘: #${number}`;

      return;
    }


    items.push({

      number:
        number,

      quantity:
        quantity,

      form:
        form

    });

  }


  bulkSaveBtn.disabled = true;

  bulkMsg.textContent =
    "등록할 포켓몬을 확인하는 중...";


  try {

    const numbers =
      [
        ...new Set(
          items.map(
            x => x.number
          )
        )
      ];


    const result =
      await sb
        .from("stickers")
        .select("*")
        .in("number", numbers);


    if (result.error) {
      throw result.error;
    }


    const existing =
      result.data || [];


    const updates = [];

    const inserts = [];


    for (
      const item of items
    ) {

      const sameNumber =
        existing.filter(
          x =>
            Number(x.number) ===
            item.number
        );


      const sameForm =
        sameNumber.find(
          x =>
            (x.form || "일반")
              .trim()
              .toLowerCase() ===
            item.form
              .trim()
              .toLowerCase()
        );


      if (sameForm) {

        updates.push({

          id:
            sameForm.id,

          number:
            item.number,

          name:
            sameForm.name,

          status:
            "owned",

          quantity:
            item.quantity,

          form:
            item.form,

          note:
            sameForm.note || ""

        });

      } else {

        const base =
          sameNumber[0];


        if (!base) {

          throw new Error(
            `#${String(item.number).padStart(3, "0")} 포켓몬을 찾을 수 없어`
          );

        }


        inserts.push({

          number:
            item.number,

          name:
            base.name,

          status:
            "owned",

          quantity:
            item.quantity,

          form:
            item.form,

          note:
            ""

        });

      }

    }


    bulkMsg.textContent =
      "저장하는 중...";


    for (
      const item of updates
    ) {

      const updateResult =
        await sb
          .from("stickers")
          .update({

            status:
              item.status,

            quantity:
              item.quantity,

            form:
              item.form,

            note:
              item.note

          })
          .eq(
            "id",
            item.id
          );


      if (updateResult.error) {
        throw updateResult.error;
      }

    }


    if (inserts.length > 0) {

      const insertResult =
        await sb
          .from("stickers")
          .insert(
            inserts
          );


      if (insertResult.error) {
        throw insertResult.error;
      }

    }


    bulkMsg.textContent =
      `완료! ${items.length}개 항목을 등록했어.`;


    await loadStickers();


    setTimeout(
      function () {

        bulkModal.hidden = true;

      },
      800
    );


  } catch (error) {

    console.error(error);

    bulkMsg.textContent =
      "등록 중 오류가 발생했어: " +
      error.message;

  } finally {

    bulkSaveBtn.disabled = false;

  }

}
```

);

}

/* =========================
초기화
========================= */

document.getElementById(
"modal"
).hidden = true;

if (bulkModal) {
bulkModal.hidden = true;
}

checkLogin();
