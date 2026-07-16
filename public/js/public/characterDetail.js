const slug = window.location.pathname.split('/').pop();
const id = slug.split('-')[0];

fetch(`${API_BASE}/characters/${id}`)
    .then(res => res.json())
    .then(data => {
        const { character, comics } = data;

        document.title = character.name;
        document.getElementById('characterName').textContent = character.name;
        document.getElementById('characterAlias').textContent =
            character.alias ? `(${character.alias})` : '';

        const publisherLink = document.getElementById('characterPublisher');

        if (character.publisher_id && character.publisher_name) {
            publisherLink.textContent = character.publisher_name;
            publisherLink.href = Routes.publisher({
                id: character.publisher_id,
                name: character.publisher_name
            });
            publisherLink.classList.remove('text-muted');
        } else {
            publisherLink.textContent = '—';
            publisherLink.removeAttribute('href');
            publisherLink.classList.add('text-muted');
        }

        document.getElementById('characterFirstAppearance').textContent =
            character.first_appearance || '—';

        document.getElementById('characterHistory').innerHTML =
            character.history || 'Histórico não informado.';

        if (character.image) {
            const imageUrl = `${BASE_URL}${character.image}`;
            document.getElementById('characterImage').src = imageUrl;
            document.getElementById('characterBg').style.backgroundImage =
                `url(${imageUrl})`;

            document.getElementById('characterImage').onclick = () => {
                document.getElementById('imageZoom').src = imageUrl;
                new bootstrap.Modal('#imageModal').show();
            };
        }

        const list = document.getElementById('comicsList');
        list.innerHTML = '';

        if (!comics || comics.length === 0) {
            list.innerHTML =
                '<p class="text-muted">Nenhum quadrinho relacionado.</p>';
            return;
        }

        comics.forEach(c => {
            list.innerHTML += `
        <div class="col-6 col-md-2 mb-4">
          <div class="card comic-card h-100 shadow-sm position-relative">
            <img
              src="${c.cover
                    ? `${BASE_URL}${c.cover}`
                    : 'assets/img/placeholder-comic.png'}"
              class="card-img-top"
              alt="${c.title}">
            <div class="card-body text-center">
              <h6 class="card-title">${c.title}</h6>
                <small class="text-muted">
                    ${c.year || ''}
                    ${c.issue_number ? `• #${c.issue_number}` : ''}
                </small>
            </div>
            <a href="${Routes.comic(c)}" class="stretched-link"></a>
          </div>
        </div>
      `;
        });
    });