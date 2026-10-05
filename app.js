const sb = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

let all = [];

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");

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

  render();
}

function render() {
  const q = document
    .getElementById("search")
    .value
    .trim()
    .toLowerCase();

  const status = document.getElementById("status").value;

  const list = all.filter(function (item) {
    return (
      (status === "all" || item.status === status) &&
      (
        !q ||
        String(item.number).includes(q) ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.form || "").toLowerCase().includes(q)
      )
    );
  });

  /* =========================
     실제 도감 번호 기준 계산
  ========================= */

  const ownedNumbers = new Set();

  all.forEach(function (item) {
    if (item.status === "owned") {
      ownedNumbers.add(Number(item.number));
    }
  });

  const ownedCount = ownedNumbers.size;
  const totalCount = 1025;
  const wantedCount = Math.max(
    totalCount - ownedCount,
    0
  );

  const collectionRate =
    ((ownedCount / totalCount) * 100).toFixed(1);

  document.getElementById("totalCount").textContent =
    totalCount;

  document.getElementById("ownedCount").textContent =
    ownedCount;

  document.getElementById("wantedCount").textContent =
    wantedCount;

  document.getElementById("collectionRate").textContent =
    collectionRate + "%";

  /* =========================
     카드 출력
  ========================= */

  grid.innerHTML = list
    .map(function (item) {
      const number = String(item.number).padStart(3, "0");
      const name = escapeHtml(
        item.name || "이름 미등록"
      );

      const quantity = Number(
        item.quantity || 0
      );

      const form = escapeHtml(
        item.form || "일반"
      );

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

load();
