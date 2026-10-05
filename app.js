const sb = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

let all = [];

const grid = document.querySelector("#grid");
const empty = document.querySelector("#empty");

async function load() {
  const { data, error } = await sb
    .from("stickers")
    .select("*")
    .order("number", { ascending: true });

  if (error) {
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
    .querySelector("#search")
    .value
    .trim()
    .toLowerCase();

  const s = document.querySelector("#status").value;

  const list = all.filter(
    (x) =>
      (s === "all" || x.status === s) &&
      (
        !q ||
        String(x.number).includes(q) ||
        (x.name || "").toLowerCase().includes(q) ||
        (x.form || "").toLowerCase().includes(q)
      )
  );

  document.querySelector("#ownedCount").textContent =
    all.filter((x) => x.status === "owned").length;

  document.querySelector("#wantedCount").textContent =
    all.filter((x) => x.status === "wanted").length;

  grid.innerHTML = list
    .map((x) => {
      const statusText =
        x.status === "owned" ? "보유" : "구하는 중";

      const quantity = Number(x.quantity || 0);
      const form = x.form || "일반";

      return `
        <article class="card">
          <div class="num">
            #${String(x.number).padStart(3, "0")}
          </div>

          <div class="name">
            ${escapeHtml(x.name || "이름 미등록")}
          </div>

          <div class="card-info">
            <span class="badge ${x.status}">
              ${statusText}
            </span>

            <span class="quantity">
              ${quantity}개
            </span>
          </div>

          <div class="form">
            ${escapeHtml(form)}
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
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[m]
  );
}

document
  .querySelector("#search")
  .addEventListener("input", render);

document
  .querySelector("#status")
  .addEventListener("change", render);

load();
