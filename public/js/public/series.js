let allSeries = [];

async function loadSeries() {
    const res = await fetch(`${API_BASE}/series`);
    allSeries = await res.json();

    renderSeries(allSeries);
}

function renderSeries(series) {
    const container = document.getElementById('seriesContainer');

    if (!series.length) {
        container.innerHTML = `
      <p class="text-muted">Nenhuma série cadastrada.</p>
    `;
        return;
    }

    container.innerHTML = '';

    series.forEach(s => {
      container.innerHTML += `
        <div class="col-md-2 mb-4">
        <div class="card comic-card h-100 shadow-sm">

          ${s.cover
                ? `<a href="${Routes.serie(s)}">
                   <img src="${BASE_URL}${s.cover}"
                        class="card-img-top"
                        style="height:250px; object-fit:cover">
                 </a>`
                : ''
            }

          <div class="card-body">

            <h5 class="card-title">
              <a href="${Routes.serie(s)}" class="text-decoration-none">
                ${s.name}
              </a>
            </h5>

            <p class="card-text text-muted mb-1">
              ${s.publisher_name || ''}
            </p>

            ${s.comics_count
                ? `<small class="text-muted">
                     ${s.comics_count} edições
                   </small>`
                : ''
            }

          </div>
        </div>
      </div>
    `;
    });
}

/**
 * BUSCA
 */
document.getElementById('searchSeries')
    .addEventListener('input', e => {

        const term = e.target.value.toLowerCase();

        const filtered = allSeries.filter(s =>
            s.name.toLowerCase().includes(term)
        );

        renderSeries(filtered);
    });

/**
 * ORDENAÇÃO
 */
document.getElementById('orderSeries')
    .addEventListener('change', e => {

        const order = e.target.value;

        let ordered = [...allSeries];

        if (order === 'az') {
            ordered.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (order === 'za') {
            ordered.sort((a, b) => b.name.localeCompare(a.name));
        }

        if (order === 'recent') {
            ordered.sort((a, b) => b.id - a.id);
        }

        renderSeries(ordered);
    });

loadSeries();
