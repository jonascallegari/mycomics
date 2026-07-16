const slug = window.location.pathname.split('/').pop();
const id = slug.split('-')[0];

fetch(`${API_BASE}/publishers/${id}`)
    .then(res => res.json())
    .then(data => {
        const { publisher, comics } = data;

        document.title = publisher.name;
        document.getElementById('publisherName').textContent = publisher.name;
        document.getElementById('publisherDescription').innerHTML =
            publisher.description || 'Informações não disponíveis.';

        if (publisher.website) {
            const site = document.getElementById('publisherSite');
            site.href = publisher.website;
        }

        if (publisher.logo) {
            const logoUrl = `${BASE_URL}${publisher.logo}`;

            document.getElementById('publisherLogo').src = logoUrl;
            document.getElementById('publisherBg').style.backgroundImage =
                `url(${logoUrl})`;

            // 🔍 Zoom
            document.getElementById('publisherLogo').onclick = () => {
                document.getElementById('logoZoom').src = logoUrl;
                new bootstrap.Modal('#logoModal').show();
            };
        }

        // 📚 Quadrinhos
        const container = document.getElementById('publisherComics');

        if (!comics.length) {
            container.innerHTML = '<p class="text-muted">Nenhum quadrinho cadastrado.</p>';
            return;
        }

       
        
        comics.forEach(c => {
            container.innerHTML += `
                <div class="col-md-2 mb-4">
                    <div class="card h-100">
                        ${c.cover
                    ? `<img src="${BASE_URL}${c.cover}" class="card-img-top">`
                    : ''
                }
                        <div class="card-body">
                            <h6 class="card-title">${c.title}</h6>
                            <small class="text-muted">
                                ${c.year || ''}
                                ${c.issue_number ? `• #${c.issue_number}` : ''}
                            </small>
                        </div>
                        <div class="card-footer text-center">
                            <a href="${Routes.comic(c)}" class="btn btn-sm btn-outline-primary">
                                Ver detalhes
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
    });
