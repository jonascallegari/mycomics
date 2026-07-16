const slug = window.location.pathname.split('/').pop();

const seriesId = slug.split('-')[0];

async function loadSeries() {
    const res = await fetch(`${API_BASE}/series/${seriesId}`);

    if (!res.ok) {
        alert('Erro ao carregar série');
        return;
    }

    const data = await res.json();
    const series = data.series;
    const comics = data.comics || [];

    document.title = series.name;
    document.getElementById('seriesName').textContent = series.name;

    document.getElementById('seriesPublisher').textContent =
        series.publisher_name || '-';

    document.getElementById('seriesDescription').innerHTML =
        series.description || '<span class="text-muted">Sem descrição</span>';

    // 🖼️ IMAGEM DA SÉRIE
    if (series.cover) {
        const coverUrl = `${BASE_URL}${series.cover}`;

        const coverImg = document.getElementById('seriesCover');
        coverImg.src = coverUrl;
        coverImg.classList.remove('d-none');

        document.getElementById('seriesCoverBg').style.backgroundImage =
            `url(${coverUrl})`;

        const zoomImg = document.getElementById('coverZoom');
        const modal = new bootstrap.Modal(
            document.getElementById('coverModal')
        );

        coverImg.onclick = () => {
            zoomImg.src = coverUrl;
            modal.show();
        };
    }

    renderComics(comics);
}

function renderComics(comics) {
    const container = document.getElementById('seriesComics');

    if (!comics.length) {
        container.innerHTML =
            '<p class="text-muted">Nenhum quadrinho cadastrado nesta série.</p>';
        return;
    }

    container.innerHTML = '';

    comics.forEach(c => {
        container.innerHTML += `
      <div class="col-md-2 mb-4">
        <div class="comic-card card h-100 shadow-sm">

          ${c.cover
          ? `<a href="${Routes.comic(c)}"><img src="${BASE_URL}${c.cover}" class="card-img-top"></a>`
                : ''
            }

          <div class="card-body">
            <h6 class="card-title">${c.title}</h6>

            <small class="text-muted">
              ${c.year || ''}
              ${c.issue_number ? `• #${c.issue_number}` : ''}
            </small>
          </div>          

        </div>
      </div>
    `;
    });
}

loadSeries();
