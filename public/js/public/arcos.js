const params = new URLSearchParams(window.location.search);
const arcId = params.get("id");

async function loadArcs() {
    try {
        const res = await fetch(`${API_BASE}/arcs`);
        const arcs = await res.json();

        renderArcs(arcs);
    } catch (err) {
        console.error("Erro ao carregar arcos:", err);
    }
}

function renderArcs(arcs) {
    const container = document.getElementById("arcsContainer");

    if (!arcs.length) {
        container.innerHTML = `
      <p class="text-muted">
        Nenhum arco cadastrado até o momento.
      </p>
    `;
        return;
    }

    container.innerHTML = "";

    arcs.forEach(arc => {
      container.innerHTML += `
      <div class="col-md-2 mb-4">
        <div class="card comic-card h-100 shadow-sm">

          ${arc.cover
                ? `<a href="${Routes.arc(arc)}">
                    <img src="${BASE_URL}${arc.cover}" class="card-img-top">
                 </a>`
                : `<div class="text-center p-3 bg-light">
                    <small>Sem capa</small>
                 </div>`
            }

          <div class="card-body text-center">

            <h6 class="card-title">
              <a href="${Routes.arc(arc)}" class="text-decoration-none">
                ${arc.name}
              </a>
            </h6>

            <p class="text-muted small mb-1">
              ${[arc.start_year, arc.end_year]
                .filter(Boolean)
                .join(" - ")
            }
            </p>

            <p class="small">
              ${arc.comics_count || 0} quadrinho(s)
            </p>

          </div>

        </div>
      </div>
    `;
    });
}

loadArcs();

