import { renderPagination } from '../../assets/js/components/pagination.js';

const grid = document.getElementById('comicsGrid');
const pagination = document.getElementById('pagination');
const publisherFilter = document.getElementById('publisherFilter');
const yearFilter = document.getElementById('yearFilter');
const sortFilter = document.getElementById('sortFilter');
const filterBtn = document.getElementById('filterBtn');

let currentPage = 1;
const limit = 12;

loadComics();
loadFilters();

filterBtn.addEventListener('click', () => {
    currentPage = 1;
    loadComics();
});

// 📚 LISTAR QUADRINHOS
function loadComics() {

    let url = `${API_BASE}/comics?page=${currentPage}&limit=${limit}`;

    if (publisherFilter.value) {
        url += `&publisher=${publisherFilter.value}`;
    }

    if (yearFilter.value) {
        url += `&year=${yearFilter.value}`;
    }

    if (sortFilter.value) {
        url += `&sort=${sortFilter.value}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(({ data, pagination: pageData }) => {
            renderComics(data);
            renderPaginationWrapper(pageData);
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<p>Erro ao carregar quadrinhos.</p>';
        });
}

// 🎨 RENDER DOS CARDS
function renderComics(comics) {

    grid.innerHTML = '';

    if (!comics || comics.length === 0) {
        grid.innerHTML = '<p>Nenhum quadrinho encontrado.</p>';
        return;
    }

    comics.forEach(comic => {

        const rating = comic.average_rating || 0;
        const percent = Math.round((rating / 5) * 100);

        const card = document.createElement('div');
        card.className = 'card comic-card shadow-sm';

        card.innerHTML = `
            <div class="rating-circle" data-percent="${percent}">
                <svg viewBox="0 0 36 36">
                    <path class="circle-bg"
                        d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"/>
                    <path class="circle-progress"
                        stroke-dasharray="${percent}, 100"
                        d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"/>
                </svg>
                <div class="circle-text">
                    ${rating.toFixed(1)}
                </div>
            </div>

            <img
            src="${comic.cover ? BASE_URL + comic.cover : '/assets/img/placeholder-comic.png'}"
            alt="${comic.title}"
            class="card-img-top"
            loading="lazy"
            onerror="this.onerror=null;this.src='/assets/img/placeholder-comic.png'">

            <div class="card-body p-2 text-center">

                <h6>
                    ${comic.title}

                    ${comic.display_issue
                        ? (
                            comic.display_issue === 'Edição Única'
                                ? `<span class="badge bg-warning text-dark ms-1">Edição Única</span>`
                                : ` ${comic.display_issue}`
                        )
                        : ''
                    }
                </h6>

                ${comic.in_collection
                    ? '<span class="badge bg-success ms-1">Na coleção</span>'
                    : ''
                }

                <small class="text-muted">
                    ${comic.original_publisher_name || ''} • 
                    ${comic.publisher_name || ''} • ${comic.year || ''}
                </small>

            </div>
        `;

        card.onclick = () => {
            window.location.href = Routes.comic(comic);
        };

        grid.appendChild(card);
    });

    applyRatingColors();
}

// 🎨 CORES DO RATING
function applyRatingColors() {

    document.querySelectorAll('.rating-circle')
        .forEach(circle => {

            const percent = parseInt(circle.dataset.percent);
            const progress = circle.querySelector('.circle-progress');

            if (percent >= 70)
                progress.style.stroke = '#21d07a';
            else if (percent >= 40)
                progress.style.stroke = '#d2d531';
            else
                progress.style.stroke = '#db2360';

        });

}

// 🔢 PAGINAÇÃO (USANDO COMPONENTE)
function renderPaginationWrapper(pageData) {
    renderPagination({
        container: pagination,
        page: pageData.page,
        totalPages: pageData.totalPages,
        total: pageData.total,
        onPageChange: (newPage) => {
            currentPage = newPage;
            loadComics();
        }
    });
}




// 🎛️ FILTROS
function loadFilters() {

    fetch(`${API_BASE}/public/publishers?limit=1000`)
        .then(res => res.json())
        .then(response => {

            publisherFilter.innerHTML =
                '<option value="">Todas</option>';

            response.data.forEach(p => {

                publisherFilter.innerHTML += `
                    <option value="${p.id}">
                        ${p.name}
                    </option>
                `;

            });

        })
        .catch(err => console.error(err));

    // continua carregando os anos pelos quadrinhos
    loadYears();
}

function loadYears() {

    fetch(`${API_BASE}/comics?limit=10000`)
        .then(res => res.json())
        .then(response => {

            const comics = response.data || [];

            const years = new Set();

            comics.forEach(c => {
                if (c.year) {
                    years.add(c.year);
                }
            });

            yearFilter.innerHTML =
                '<option value="">Todos</option>';

            [...years]
                .sort((a, b) => b - a)
                .forEach(year => {

                    yearFilter.innerHTML += `
                        <option value="${year}">
                            ${year}
                        </option>
                    `;

                });

        })
        .catch(err => console.error(err));
}