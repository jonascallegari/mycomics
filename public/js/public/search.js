const params = new URLSearchParams(window.location.search);
const query = params.get('q');

const searchTermEl = document.getElementById('searchTerm');
const comicsEl = document.getElementById('comicsResults');
const charactersEl = document.getElementById('charactersResults');
const creatorsEl = document.getElementById('creatorsResults');

if (!query) {
    searchTermEl.textContent = '';
    comicsEl.innerHTML = '<p>Nenhuma busca informada.</p>';
} else {
    searchTermEl.textContent = `"${query}"`;
    loadResults(query);
}

function loadResults(q) {
    fetch(`${API_BASE}/public/search?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(renderResults)
        .catch(err => {
            console.error(err);
        });
}

function renderResults({ comics, characters, creators }) {
    renderComics(comics);
    renderCharacters(characters);
    renderCreators(creators);
}

/* ======================
   QUADRINHOS
====================== */
function renderComics(comics) {
    comicsEl.innerHTML = '';

    if (!comics.length) {
        comicsEl.innerHTML = '<p class="text-muted">Nenhum quadrinho encontrado.</p>';
        return;
    }

    comics.forEach(c => {
        const cover = c.cover ? `${BASE_URL}${c.cover}` : '/assets/img/placeholder-comic.png';
        const comicUrl = Routes.comic(c);

        comicsEl.innerHTML += `
            <div class="col-md-2 mb-4">
                <div class="card comic-card h-100 shadow-sm">
                    <a href="${comicUrl}" class="text-decoration-none">
                        <img src="${cover}" class="card-img-top" alt="${c.title}">
                    </a>
                    <div class="card-body text-center">
                        <h6><a href="${comicUrl}" class="text-decoration-none text-dark">${c.title}</a></h6>
                        <small>${c.publisher_name || ''}${c.publisher_name && c.year ? ' • ' : ''}${c.year || ''}</small>
                    </div>
                </div>
            </div>
        `;
    });
}

/* ======================
   PERSONAGENS
====================== */
function renderCharacters(characters) {
    charactersEl.innerHTML = '';

    if (!characters.length) {
        charactersEl.innerHTML = '<p class="text-muted">Nenhum personagem encontrado.</p>';
        return;
    }

    characters.forEach(c => {
        const label = c.alias || c.name || 'Personagem';
        const image = c.image
            ? c.image.startsWith('/uploads')
                ? `${BASE_URL}${c.image}`
                : c.image.includes('/')
                    ? `${BASE_URL}/${c.image}`
                    : `${BASE_URL}/uploads/characters/${c.image}`
            : '/assets/img/placeholder-character.png';
        const characterUrl = Routes.character(c);

        charactersEl.innerHTML += `
            <div class="col-md-2 mb-4">
                <div class="card h-100 shadow-sm text-center">
                    <a href="${characterUrl}" class="text-decoration-none">
                        <img src="${image}" class="card-img-top" alt="${label}">
                    </a>
                    <div class="card-body">
                        <h6><a href="${characterUrl}" class="text-decoration-none text-dark">${label}</a></h6>
                        <small>${c.name && c.alias ? c.name : ''}</small>
                        <a href="${characterUrl}" class="btn btn-sm btn-outline-primary w-100 mt-2">
                            Ver personagem
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
}

/* ======================
   CRIADORES
====================== */
function renderCreators(creators) {
    creatorsEl.innerHTML = '';

    if (!creators.length) {
        creatorsEl.innerHTML = '<p class="text-muted">Nenhum criador encontrado.</p>';
        return;
    }

    creators.forEach(c => {
        const image = c.image
            ? c.image.startsWith('/uploads')
                ? `${BASE_URL}${c.image}`
                : c.image.includes('/')
                    ? `${BASE_URL}/${c.image}`
                    : `${BASE_URL}/uploads/creators/${c.image}`
            : '/assets/img/placeholder-creator.png';
        const creatorUrl = Routes.creator(c);

        creatorsEl.innerHTML += `
            <div class="col-md-2 mb-4">
                <div class="card h-100 shadow-sm text-center">
                    <a href="${creatorUrl}" class="text-decoration-none">
                        <img src="${image}" class="card-img-top" alt="${c.name}">
                    </a>
                    <div class="card-body">
                        <h6><a href="${creatorUrl}" class="text-decoration-none text-dark">${c.name}</a></h6>
                        <small>${c.role || ''}</small>
                        <a href="${creatorUrl}" class="btn btn-sm btn-outline-secondary w-100 mt-2">
                            Ver criador
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
}