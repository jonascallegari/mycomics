import { renderPagination } from '../../assets/js/components/pagination.js';

const grid = document.getElementById('charactersGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const publisherFilter = document.getElementById('publisherFilter');



let currentPage = 1;
const limit = 12;

let currentLetter = '';

loadPublishers();
loadCharacters();
loadAlphabet();

// 🔍 busca com debounce
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadCharacters();
    }, 400);
});

publisherFilter.addEventListener('change', () => {
    currentPage = 1;
    loadCharacters();
});

function loadCharacters() {
    let url = `${API_BASE}/public/characters?page=${currentPage}&limit=${limit}`;

    if (searchInput.value.trim()) {
        url += `&search=${encodeURIComponent(searchInput.value.trim())}`;
    }

    if (publisherFilter.value) {
        url += `&publisher=${publisherFilter.value}`;
    }

    // NOVO FILTRO POR LETRA
    if (currentLetter) {
        url += `&letter=${currentLetter}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(({ data, pagination: pageData }) => {
            renderCharacters(data);
            renderPaginationWrapper(pageData);
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<p>Erro ao carregar personagens.</p>';
        });
}

function renderCharacters(characters) {
    grid.innerHTML = '';

    if (!characters.length) {
        grid.innerHTML = '<p>Nenhum personagem encontrado.</p>';
        return;
    }

    characters.forEach(c => {
        const col = document.createElement('div');
        col.className = 'card comic-card shadow-sm';

        const image = c.image
            ? `${BASE_URL}${c.image}`
            : 'assets/img/placeholder-character.png';

        col.innerHTML = `
            <div class="h-100 text-center">
                <img src="${image}" class="card-img-top">
                <div class="card-body">
                    <h6 class="mb-0">${c.alias || ''}</h6>
                    <small class="text-muted">
                        ${c.name}<br>
                        ${c.publisher_name || ''}
                    </small>
                </div>
            </div>
        `;

        col.onclick = () => {
            window.location.href = Routes.character(c);
        };

        grid.appendChild(col);
    });
}

//Filtro Letras
function loadAlphabet() {
    const container = document.getElementById('alphabetFilter');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    container.innerHTML = '';

    // botão "Todos"
    const allBtn = document.createElement('button');
    allBtn.className = 'btn btn-sm btn-secondary me-1 mb-1';
    allBtn.classList.toggle('active', currentLetter === '');
    allBtn.textContent = 'Todos';
    allBtn.onclick = () => {
        currentLetter = '';
        currentPage = 1;
        searchInput.value = '';
        loadAlphabet();
        loadCharacters();
    };
    container.appendChild(allBtn);

    letters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-primary me-1 mb-1';
        btn.classList.toggle('active', currentLetter === letter);
        btn.textContent = letter;

        btn.onclick = () => {
            if (currentLetter === letter) return;
            currentLetter = letter;
            currentPage = 1;
            searchInput.value = '';
            loadAlphabet();
            loadCharacters();
        };

        container.appendChild(btn);
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
            loadCharacters();
        }
    });
}

function loadPublishers() {
    fetch(`${API_BASE}/public/publishers`)
        .then(res => res.json())
        .then(({ data }) => {
            data.forEach(p => {
                publisherFilter.innerHTML += `
                    <option value="${p.id}">${p.name}</option>
                `;
            });
        });
}
