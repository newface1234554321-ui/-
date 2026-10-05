const sb = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

let all = [];

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const formFilter = document.getElementById("formFilter");

async function load() {
  const { data, error } = await sb
    .from("stickers")
    .select("*")
    .order("number", { ascending: true });

  if (error) {
    console.error(error);

    empty.hidden = false;
    empty.textContent =
      "데이터를 불러오지 못했습니다. config.js 설정을 확인하세요.";

    return;
  }

  all = data || [];

  updateFormFilter();
  render();
}

function updateFormFilter() {
  const currentValue = formFilter.value;

  const forms = [
    ...new Set(
      all.map(function (item) {
        return (item.form || "일반").trim();
      })
    )
  ];

  forms.sort(function (a, b) {
    if (a === "일반") return -1;
    if (b === "일반") return 1;

    return a.localeCompare(b, "ko");
  });

  formFilter.innerHTML = `
    <option value="all">전체 폼</option>
    ${forms
      .map(function (form) {
        return `
          <option value="${escapeHtml(form)}">
            ${escapeHtml(form)}
          </option>
        `;
      })
      .join("")}
  `;

  if (forms.includes(currentValue)) {
    formFilter.value = currentValue;
  }
}

function render() {
  const q = document
    .getElementById("search")
    .value
    .trim()
    .toLowerCase();

  const status = document.getElementById("status").value;
  const selectedForm = formFilter.value;

  const list = all.filter(function (item) {
    const itemForm = (item.form || "일반").trim();

    const matchesSearch =
      !q ||
      String(item.number).includes(q) ||
      (item.name || "").toLowerCase().includes(q) ||
      itemForm.toLowerCase().includes(q);

    const matchesStatus =
      status === "all" ||
      item.status === status;

    const matchesForm =
      selectedForm === "all" ||
      itemForm === selectedForm;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesForm
    );
  });

  /* =========================
     보유 / 구하는 중 숫자
  ========================= */

  const ownedNumbers = new Set();

  all.forEach(function (item) {
    if (item.status === "owned") {
      ownedNumbers.add(Number(item.number));
    }
  });

  const ownedCount = ownedNumbers.size;

  const wantedCount = all.filter(function (item) {
    return item.status === "wanted";
  }).length;

  document.getElementById("totalCount").textContent =
    1025;

  document.getElementById("ownedCount").textContent =
    ownedCount;

  document.getElementById("wantedCount").textContent =
    wantedCount;

  /* =========================
     카드 출력
  ========================= */

  grid.innerHTML = list
    .map(function (item) {
      const number =
        String(item.number).padStart(3, "0");

      const name =
        escapeHtml(item.name || "이름 미등록");

      const quantity =
        Number(item.quantity || 0);

      const form =
        escapeHtml(item.form || "일반");

      const statusText =
        item.status === "owned"
          ? "보유"
          : "구하는 중";

      return `
        <article class="card">

          <div class="num">
            #${number}
          </div>

          <div class="name">
            ${name}
          </div>

          <div class="card-info">

            <div class="badge ${item.status}">
              ${statusText}
            </div>

            <div class="quantity">
              ${quantity}개
            </div>

          </div>

          <div class="form">
            ${form}
          </div>

        </article>
      `;
    })
    .join("");

  empty.hidden = list.length > 0;
}

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

document
  .getElementById("search")
  .addEventListener("input", render);

document
  .getElementById("status")
  .addEventListener("change", render);

formFilter.addEventListener(
  "change",
  render
);

load();
