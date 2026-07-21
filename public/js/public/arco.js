const slug = window.location.pathname.split('/').pop();

const arcId = slug.split('-')[0];

async function loadArc() {
    if (!arcId) {
        document.body.innerHTML = "<h3 class='text-center mt-5'>Arco não encontrado</h3>";
        return;
    }

    const res = await fetch(`${API_BASE}/arcs/${arcId}`);
    const data = await res.json();

    renderArc(data.arc);
    renderComics(data.comics);
}

function renderArc(arc) {
    document.getElementById("arcName").textContent = arc.name;

    const years = [arc.start_year, arc.end_year]
        .filter(Boolean)
        .join(" - ");

    

    document.getElementById("arcYears").textContent = years || "";

    document.getElementById("arcDescription").textContent =
        arc.description || "Sem descrição disponível.";

    document.title =
    `${arc.name} | My Comics Database`;

    const cover = document.getElementById("arcCover");

    const description =
    arc.description
    ? arc.description.substring(0, 160)
    : `Veja a ordem de leitura do arco ${arc.name}.`;

    document
    .querySelector('meta[name="description"]')
    .setAttribute('content', description);

    document
    .querySelector('meta[property="og:title"]')
    .setAttribute(
        'content',
        `${arc.name} | My Comics Database`
    );

    document
        .querySelector('meta[property="og:description"]')
        .setAttribute('content', description);

    document
        .querySelector('meta[property="og:url"]')
        
        .setAttribute(
            'content',
            window.location.href
        );

    const placeholder = '/assets/img/placeholder-comic.png';

    cover.src = arc.cover
        ? BASE_URL + arc.cover
        : placeholder;

    cover.onerror = () => {
        cover.onerror = null;
        cover.src = placeholder;
    };

    cover.alt = `Capa do arco ${arc.name}`;    
}

function renderComics(comics) {
    const container = document.getElementById("arcComics");

    if (!comics.length) {
        container.innerHTML = `
      <p class="text-muted">
        Nenhum quadrinho vinculado a este arco.
      </p>
    `;
        return;
    }

    container.innerHTML = "";

    comics.forEach((c, index) => {
        container.innerHTML += `
      <div class="col-md-2 mb-4">
        <div class="card comic-card h-100 shadow-sm">

          <a href="${Routes.comic(c)}">
              <img
                  src="${c.cover ? BASE_URL + c.cover : '/assets/img/placeholder-comic.png'}"
                  class="card-img-top"
                  loading="lazy"
                  alt="${c.title}"
                  onerror="this.onerror=null;this.src='/assets/img/placeholder-comic.png'">
          </a>

          <div class="card-body text-center">
            <h6>
              ${index + 1}. ${c.title}
            </h6>

            <small class="text-muted">
              ${c.series_name || ""}
              #${c.issue_number || ""}
            </small>
          </div>

        </div>
      </div>
    `;
    });
}

loadArc();
