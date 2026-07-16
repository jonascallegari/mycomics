const slug = window.location.pathname.split('/').pop();

const id = slug.split('-')[0];
const token = localStorage.getItem('token');

fetch(`${API_BASE}/creators/${id}`)
    .then(res => res.json())
    .then(data => {
        const { creator, comics } = data;

        document.title = creator.name;
        document.getElementById('creatorName').textContent = creator.name;
        document.getElementById('creatorRole').textContent =
            creator.role || '';
        document.getElementById('creatorNationality').textContent = creator.nationality;
        document.getElementById('creatorBirthYear').textContent = creator.birth_year;
        document.getElementById('creatorBio').innerHTML =
            creator.bio || 'Biografia não informada.';

        if (creator.image) {
            const imageUrl = `${BASE_URL}${creator.image}`;

            document.getElementById('creatorImage').src = imageUrl;
            document.getElementById('creatorBg').style.backgroundImage =
                `url(${imageUrl})`;

            // 🔍 Zoom
            document.getElementById('creatorImage').onclick = () => {
                document.getElementById('imageZoom').src = imageUrl;
                new bootstrap.Modal('#imageModal').show();
            };
        }

        const list = document.getElementById('comicsList');

        if (comics.length === 0) {
            list.innerHTML = '<p class="text-muted">Nenhum quadrinho encontrado.</p>';
        } else {
            comics.forEach(c => {
                list.innerHTML += `
            <div class="col-md-2 mb-4">
                <a href="${Routes.comic(c)}" class="text-decoration-none">
                    <div class="card comic-card h-100 shadow-sm">
                        <img src="${BASE_URL}${c.cover}" class="card-img-top">
                        <div class="card-body">
                            <h6 class="card-title">${c.title}</h6>
                            <small class="text-muted">
                                ${c.year || ''}
                                ${c.issue_number ? `• #${c.issue_number}` : ''}
                            </small>
                        </div>
                    </div>
                </a>
            </div>
        `;
            });
        }
    });