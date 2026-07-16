function initGlobalSearch() {

    console.log('Busca global iniciada');

    const input = document.getElementById('globalSearch');
    const resultsBox = document.getElementById('searchResults');

    if (!input || !resultsBox) {
        console.warn('Input ou resultsBox não encontrados');
        return;
    }

    let timeout;

    input.addEventListener('input', () => {

        clearTimeout(timeout);

        const q = input.value.trim();

        if (q.length < 2) {
            resultsBox.classList.add('d-none');
            resultsBox.innerHTML = '';
            return;
        }

        timeout = setTimeout(async () => {

            try {

                const res = await fetch(
                    `${API_BASE}/public/search?q=${encodeURIComponent(q)}`
                );

                const data = await res.json();

                let html = '';

                // =========================
                // COMICS (URL AMIGÁVEL)
                // =========================
                data.comics?.forEach(c => {

                    html += `
                        <div class="search-item">
                            <a href="${Routes.comic(c)}"
                               class="text-decoration-none d-block">
                                <i class="fa-solid fa-book text-warning"></i>
                                ${c.title}
                            </a>
                        </div>
                    `;
                });

                // =========================
                // CHARACTERS
                // =========================
                data.characters?.forEach(c => {

                    html += `
                        <div class="search-item">
                            <a href="${Routes.character(c)}"
                               class="text-decoration-none d-block">
                                <i class="fa-solid fa-user text-info"></i>
                                ${c.alias}
                            </a>
                        </div>
                    `;
                });

                // =========================
                // CREATORS
                // =========================
                data.creators?.forEach(c => {

                    html += `
                        <div class="search-item">
                            <a href="${Routes.creator(c)}"
                               class="text-decoration-none d-block">
                                <i class="fa-solid fa-pen-nib text-success"></i>
                                ${c.name}
                            </a>
                        </div>
                    `;
                });

                if (!html) {
                    html = `<div class="text-muted p-2">Nenhum resultado</div>`;
                }

                resultsBox.innerHTML = html;
                resultsBox.classList.remove('d-none');

            } catch (e) {
                console.error('Erro na busca:', e);
            }

        }, 300);
    });
}