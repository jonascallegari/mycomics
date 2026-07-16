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
        comicsEl.innerHTML += `
            <div class="col-md-3 mb-4">
                <div class="card comic-card h-100 shadow-sm">
                    <img src="${BASE_URL}${c.cover}" class="card-img-top">
                    <div class="card-body text-center">
                        <h6>${c.title}</h6>
                        <small>${c.publisher_name || ''} • ${c.year || ''}</small>
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
        charactersEl.innerHTML += `
            <div class="col-md-3 mb-4">
                <div class="card h-100 shadow-sm text-center">
                    <img 
                        src="${BASE_URL}${c.image || '/uploads/placeholder-character.png'}"
                        class="card-img-top">
                    <div class="card-body">
                        <h6>${c.name}</h6>
                        <small>${c.alias || ''}</small>
                        <a href="character.html?id=${c.id}" class="btn btn-sm btn-outline-primary w-100 mt-2">
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
        creatorsEl.innerHTML += `
            <div class="col-md-3 mb-4">
                <div class="card h-100 shadow-sm text-center">
                    <img 
                        src="${BASE_URL}${c.image || '/uploads/placeholder-creator.png'}"
                        class="card-img-top">
                    <div class="card-body">
                        <h6>${c.name}</h6>
                        <small>${c.role || ''}</small>
                        <a href="creator.html?id=${c.id}" class="btn btn-sm btn-outline-secondary w-100 mt-2">
                            Ver criador
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
}