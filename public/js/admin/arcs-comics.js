const API_ARCS = `${API_BASE}/arcs`;
const API_COMICS = `${API_BASE}/comics`;

const token = localStorage.getItem("token");

const arcSelect = document.getElementById("arcSelect");
const comicSelect = document.getElementById("comicSelect");
const list = document.getElementById("arcComicsList");

document.getElementById("addComic").addEventListener("click", addComicToArc);

async function loadArcs() {
    const res = await fetch(API_ARCS);
    const arcs = await res.json();

    arcSelect.innerHTML = arcs
        .map(a => `<option value="${a.id}">${a.name}</option>`)
        .join("");

    loadArcComics();
}

async function loadComics() {
    const res = await fetch(API_COMICS);
    const comics = await res.json();

    comicSelect.innerHTML = comics
        .map(c => `<option value="${c.id}">${c.title} #${c.issue_number}</option>`)
        .join("");
}

arcSelect.addEventListener("change", loadArcComics);

async function loadArcComics() {
    const arcId = arcSelect.value;

    if (!arcId) return;

    const res = await fetch(`${API_ARCS}/${arcId}`);
    const data = await res.json();

    list.innerHTML = "";

    data.comics.forEach(c => {
        list.innerHTML += renderComicItem(c);
    });

    enableSorting();
}

function renderComicItem(comic) {
    return `
    <li 
      class="list-group-item d-flex align-items-center justify-content-between comic-item"
      data-link="${comic.link_id}"
    >
      <div class="d-flex align-items-center gap-3">
        ${comic.cover
            ? `<img src="${BASE_URL}${comic.cover}" class="cover-thumb">`
            : ""
        }

        <div>
          <strong>${comic.title}</strong>
          <small class="text-muted d-block">
            ${comic.series_name || ""}
            #${comic.issue_number || ""}
          </small>
        </div>
      </div>

      <button 
        class="btn btn-sm btn-danger"
        onclick="removeComic(${comic.link_id})"
      >
        Remover
      </button>
    </li>
  `;
}

async function addComicToArc() {
    const arcId = arcSelect.value;
    const comicId = comicSelect.value;

    await fetch(`${API_ARCS}/${arcId}/comics`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comic_id: comicId })
    });

    loadArcComics();
}

async function removeComic(linkId) {
    const arcId = arcSelect.value;

    await fetch(`${API_ARCS}/${arcId}/comics/${linkId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    loadArcComics();
}

function enableSorting() {
    new Sortable(list, {
        animation: 150,
        onEnd: saveOrder
    });
}

async function saveOrder() {
    const arcId = arcSelect.value;

    const items = document.querySelectorAll(".comic-item");

    for (let i = 0; i < items.length; i++) {
        const linkId = items[i].dataset.link;

        await fetch(`${API_ARCS}/${arcId}/comics/${linkId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                reading_order: i + 1
            })
        });
    }

    console.log("Ordem salva!");
}

loadArcs();
loadComics();
