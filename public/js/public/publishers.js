const grid = document.getElementById('publishersGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');

let currentPage = 1;
const limit = 12;

loadPublishers();

// 🔍 busca com debounce
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadPublishers();
    }, 400);
});

function loadPublishers() {
    const search = searchInput.value.trim();

    let url = `${API_BASE}/public/publishers?page=${currentPage}&limit=${limit}`;

    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(({ data, pagination: pageData }) => {
            renderPublishers(data);
            renderPagination(pageData);
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<p>Erro ao carregar editoras.</p>';
        });
}

function renderPublishers(publishers) {
    grid.innerHTML = '';

    if (!publishers.length) {
        grid.innerHTML = '<p>Nenhuma editora encontrada.</p>';
        return;
    }

    publishers.forEach(p => {
        const col = document.createElement('div');
        col.className = 'card comic-card shadow-sm';

        const logo = p.logo
            ? `${BASE_URL}${p.logo}`
            : '/assets/img/placeholder-publisher.png';

        col.innerHTML = `
            <div class="h-100 text-center">
                <img src="${logo}" class="card-img-top p-3 bg-light">
                <div class="card-body">
                    <h6>${p.name}</h6>
                    <small class="text-muted">
                        ${p.total_comics} quadrinho(s)
                    </small>
                </div>
            </div>
        `;

        col.onclick = () => {
            window.location.href = Routes.publisher(p);
        };

        grid.appendChild(col);
    });
}

function renderPagination({ page, totalPages }) {
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === page ? 'active' : ''}`;

        li.innerHTML = `
            <button class="page-link">${i}</button>
        `;

        li.onclick = () => {
            currentPage = i;
            loadPublishers();
        };

        pagination.appendChild(li);
    }
}
