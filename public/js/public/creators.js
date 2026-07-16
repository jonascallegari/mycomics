import { renderPagination } from '../../assets/js/components/pagination.js';

const grid = document.getElementById('creatorsGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');

let currentPage = 1;
const limit = 12;

loadCreators();

// 🔍 busca com debounce
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadCreators();
    }, 400);
});

roleFilter.addEventListener('change', () => {
    currentPage = 1;
    loadCreators();
});

function loadCreators() {
    let url = `${API_BASE}/public/creators?page=${currentPage}&limit=${limit}`;

    if (searchInput.value.trim()) {
        url += `&search=${encodeURIComponent(searchInput.value.trim())}`;
    }

    if (roleFilter.value) {
        url += `&role=${encodeURIComponent(roleFilter.value)}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(({ data, pagination: pageData }) => {
            renderCreators(data);
            renderPaginationWrapper(pageData);
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<p>Erro ao carregar criadores.</p>';
        });
}

function renderCreators(creators) {
    grid.innerHTML = '';

    if (!creators.length) {
        grid.innerHTML = '<p>Nenhum criador encontrado.</p>';
        return;
    }

    creators.forEach(c => {
        const col = document.createElement('div');
        col.className = 'card comic-card shadow-sm';

        const image = c.image
            ? `${BASE_URL}${c.image}`
            : '/assets/img/placeholder-creator.png';

        col.innerHTML = `
            <div class="h-100 text-center">
                <img src="${image}" class="card-img-top">
                <div class="card-body">
                    <h6>${c.name}</h6>
                    <small class="text-muted">${c.role || ''}</small>
                </div>
            </div>
        `;

        col.onclick = () => {
            window.location.href = `${Routes.creator(c)}`;
        };

        grid.appendChild(col);
    });
}

function renderPaginationWrapper(pageData) {
    renderPagination({
        container: pagination,
        page: pageData.page,
        totalPages: pageData.totalPages,
        total: pageData.total,
        onPageChange: (newPage) => {
            currentPage = newPage;
            loadCreators();
        }
    });
}
