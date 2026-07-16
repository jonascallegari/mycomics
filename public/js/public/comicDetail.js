const slug = window.location.pathname.split('/').pop();

const comicId = slug.split('-')[0];
const token = localStorage.getItem('token');

/**
 * ============================
 * ESTRELAS
 * ============================
 */
function renderStars(rating) {
  let html = '<div class="stars-display">';

  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      html += '<span class="star filled">★</span>';
    } else {
      html += '<span class="star">★</span>';
    }
  }

  html += '</div>';
  return html;
}

/**
 * ============================
 * RESOLVER CAMINHO DE IMAGEM
 * ============================
 */
function resolveImagePath(image, type) {
  if (!image) return null;

  // já vem no formato correto do backend
  if (image.startsWith('/uploads')) {
    return `${BASE_URL}${image}`;
  }

  // veio só o nome do arquivo
  if (!image.includes('/')) {
    return `${BASE_URL}/uploads/${type}/${image}`;
  }

  // fallback genérico
  return `${BASE_URL}/${image}`;
}

/**
 * ============================
 * DADOS DO QUADRINHO
 * ============================
 */
async function loadComic() {
  const res = await fetch(`${API_BASE}/comics/${comicId}`);
  if (!res.ok) {
    alert('Erro ao carregar quadrinho');
    return;
  }

  const data = await res.json();

  const comic = data.comic;
  const stories = data.stories || [];
  const moreFromSeries = data.moreFromSeries || [];
  const seriesComics = [comic, ...moreFromSeries]; 
 

  // 🧾 Dados principais
  document.getElementById('comicTitle').textContent = comic.title;
  document.getElementById('comicOriginalPublisher').textContent =
    comic.original_publisher_name || '-'; 
  document.getElementById('comicPublisher').textContent =
    comic.publisher_name || '-';   
  document.getElementById('comicYear').textContent = comic.year || '-';
  document.getElementById('comicGenre').textContent = comic.genre || '-';  
  const issueElement = document.getElementById('comicIssue');
  const badgeElement = document.getElementById('comicBadge');

  if (comic.display_issue === 'Edição Única') {

    issueElement.textContent = '';

    badgeElement.textContent = comic.display_issue;
    badgeElement.classList.remove('hidden');
    badgeElement.classList.add('one-shot');

  } else {

    issueElement.textContent = comic.display_issue || '-';

    badgeElement.classList.add('hidden');
    badgeElement.classList.remove('one-shot');
  }

  
  document.getElementById('comicPages').textContent =
    comic.pages || '-';

  function formatPrice(price, currency) {
    if (!price) return '-';

    if (currency === 'BRL') {
      return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
    }

    if (currency === 'USD') {
      return `US$ ${parseFloat(price).toFixed(2)}`;
    }

    return `${currency} ${price}`;
  }
  document.getElementById('comicPrice').textContent =
    formatPrice(comic.cover_price, comic.currency);

  const container = document.getElementById('comicSynopsis');

if (container) {

  container.innerHTML = '';

  const synopsis = comic.synopsis?.trim();

  // ===== SEM SINOPSE =====
  if (!synopsis) {

    const span = document.createElement('span');
    span.className = 'text-muted';
    span.textContent = 'Sinopse não informada.';

    container.appendChild(span);

  } else {

    // ===== COM SINOPSE =====
    const text = document.createElement('div');
    text.id = 'synopsisText';
    text.className = 'synopsis-text';
    text.innerHTML = synopsis;

    container.appendChild(text);

    setTimeout(() => {

      if (text.scrollHeight > 120) {

        const toggle = document.createElement('div');
        toggle.id = 'synopsisToggle';
        toggle.className = 'synopsis-toggle';
        toggle.textContent = 'Expandir sinopse';

        container.appendChild(toggle);

        toggle.addEventListener('click', () => {

          const expanded = text.classList.toggle('expanded');

          toggle.textContent = expanded
            ? 'Recolher sinopse'
            : 'Expandir sinopse';

        });

      }

    }, 50);

  }

}

  

  // 📚 EXIBIÇÃO DA SÉRIE COM LINK
  const seriesContainer = document.getElementById('comic_series_container');
  const seriesElement = document.getElementById('comicSeries');

  if (comic.series_id) {
    seriesElement.innerHTML = `
      <a href="serie.html?id=${comic.series_id}" class="text-decoration-none link-warning">
        ${comic.series_name}
      </a>
    `;
  } else {
    seriesContainer.style.display = 'none';
  }

  
  // 🖼️ Capa
const placeholderCover = '/assets/img/placeholder-comic.png';

const coverUrl = comic.cover
  ? `${BASE_URL}${comic.cover}`
  : placeholderCover;

const coverImg = document.getElementById('comicCover');
const bg = document.getElementById('comicCoverBg');

coverImg.src = coverUrl;

// Se a imagem não existir, usa o placeholder
coverImg.onerror = () => {
  coverImg.onerror = null;
  coverImg.src = placeholderCover;
  bg.style.backgroundImage = `url(${placeholderCover})`;
};

coverImg.style.display = 'block';

// Fundo desfocado
bg.style.backgroundImage = `url(${coverUrl})`;
bg.style.backgroundSize = 'cover';
bg.style.backgroundPosition = 'center';

const zoomImg = document.getElementById('coverZoom');
const modal = new bootstrap.Modal(
  document.getElementById('coverModal')
);

coverImg.onclick = () => {

  zoomImg.src = coverImg.src;

  zoomImg.onerror = () => {
    zoomImg.onerror = null;
    zoomImg.src = placeholderCover;
  };

  modal.show();
};

zoomImg.onclick = () => modal.hide();

  // ✅ RENDERIZAÇÕES CORRETAS
  renderComicArcs(data.arcs);
  renderStories(stories);
  renderCharacters(stories);
  renderCreators(stories);
  renderMoreFromSeries(moreFromSeries);
  renderSeriesNavigation(comic, seriesComics);

  loadBuyLinks(comicId);
}

function renderComicArcs(arcs) {
  const container = document.getElementById("comicArcsContainer");
  const list = document.getElementById("comicArcsList");

  if (!arcs || arcs.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";
  list.innerHTML = "";

  arcs.forEach(arc => {
    list.innerHTML += `
      <li>
        <a href="arco.html?id=${arc.id}" class="text-decoration-none link-warning">
          ${arc.name}
        </a>
      </li>
    `;
  });
}

async function addStory() {
  const titleInput = document.getElementById('storyTitle');
  const title = titleInput.value.trim();

  if (!title) {
    alert('Informe o título da história');
    return;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    alert('Você precisa estar logado');
    return;
  }

  const res = await fetch(
    `${API_BASE}/comics/${comicId}/stories`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ title })
    }
  );

  const data = await res.json();

  if (res.ok) {
    titleInput.value = '';
    loadStories(); // atualiza lista
  } else {
    alert(data.error || 'Erro ao adicionar história');
  }
}


/**
 * ============================
 * HISTÓRIAS DA EDIÇÃO
 * ============================
 */
async function loadStories() {
  const res = await fetch(`${API}/comics/${comicId}/stories`);
  const stories = await res.json();

  const list = document.getElementById('storiesList');
  list.innerHTML = '';

  if (!stories || stories.length === 0) {
    list.innerHTML =
      '<li class="list-group-item text-muted">Nenhuma história cadastrada</li>';
    return;
  }

  stories.forEach(s => {
    list.innerHTML += `
      <li class="list-group-item">${s.title}</li>
    `;
  });
}


/**
 * ============================
 * RENDERIZAR HISTÓRIAS
 * ============================
 */
function renderStories(stories) {
  const container = document.getElementById('storiesList');
  container.innerHTML = '';

  if (!stories.length) {
    container.innerHTML =
      '<li class="list-group-item text-muted">Nenhuma história cadastrada</li>';
    return;
  }

  stories.forEach(story => {
    const characters =
      story.characters?.map(c => c.alias).join(', ') || '—';

    const creators =
      story.creators?.map(c => c.name).join(', ') || '—';

    container.innerHTML += `
      <li class="list-group-item">
        <h6 class="mb-1">${story.title}</h6>
        <small><strong>Personagens:</strong> ${characters}</small><br>
        <small><strong>Criadores:</strong> ${creators}</small>
      </li>
    `;
  });
}

/**
 * ============================
 * REVIEWS DO QUADRINHO
 * ============================
 */

let selectedRating = 0;

function setupStars() {
  const stars = document.querySelectorAll('#starRating span');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = star.dataset.value;
      updateStars(selectedRating);
    });

    star.addEventListener('mouseover', () => {
      updateStars(star.dataset.value);
    });

    star.addEventListener('mouseout', () => {
      updateStars(selectedRating);
    });
  });
}

function updateStars(rating) {
  const stars = document.querySelectorAll('#starRating span');

  stars.forEach(star => {
    if (star.dataset.value <= rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

let currentPage = 1;

async function loadReviews(comicId, page = 1) {
  currentPage = page;

  const res = await fetch(
    `${API_BASE}/reviews/comic/${comicId}?page=${page}&limit=5`
  );

  const result = await res.json();

  const reviews = result.data;
  const pagination = result.pagination;

  const list = document.getElementById('reviewsList');
list.innerHTML = '';

if (!reviews || reviews.length === 0) {

  list.innerHTML = `
    <div class="text-center py-4">

      <i class="fa-regular fa-comment-dots fa-3x text-secondary mb-3"></i>

      <h5>Ainda não existem reviews</h5>

      <p class="text-muted mb-0">
        Seja o primeiro a compartilhar sua opinião sobre este quadrinho!
      </p>

    </div>
  `;

  document.getElementById('reviewsPagination').innerHTML = '';

  return;
}

reviews.forEach(r => {
  list.innerHTML += `
    <div class="review mb-3 pb-3 border-bottom">

      <strong>${r.username}</strong>

      <div class="mb-2">
        ${renderStars(r.rating)}
      </div>

      <p class="mb-0">
        ${r.comment || '<span class="text-muted">Sem comentário.</span>'}
      </p>

    </div>
  `;
});

  /**
 * ============================
 * PAGINAÇÃO
 * ============================
 */
  renderPagination({
    containerId: 'reviewsPagination',
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    onPageChange: (page) => loadReviews(page)
  });
}


document.getElementById('saveReview')
  .addEventListener('click', async () => {

    if (!requireLogin()) return;

    if (!selectedRating) {
      alert('Selecione uma quantidade de estrelas');
      return;
    }

    const comment = document.getElementById('comment').value;

    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        comic_id: comicId,
        rating: selectedRating,
        comment
      })
    });

    if (!res.ok) {
      alert('Erro ao salvar avaliação.');
      return;
    }

    alert('Avaliação salva!');
    loadReviews(comicId);
    loadAverageRating(comicId);
  });

async function loadMyReview() {

    if (!isLoggedIn()) {
        return;
    }

    const res = await fetch(
        `${API_BASE}/reviews/comic/${comicId}/me`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!res.ok) return;

    const review = await res.json();

    if (review) {

        selectedRating = review.rating;

        updateStars(review.rating);

        document.getElementById('comment').value =
            review.comment || '';

    }

}

async function loadAverageRating(comicId) {
  const res = await fetch(
    `${API_BASE}/reviews/comic/${comicId}/average`
  );

  if (!res.ok) return;

  const data = await res.json();

  const container = document.getElementById('averageRating');

  if (!data || !data.total) {
    container.innerHTML = '<small class="text-white">Ainda não há avaliações</small>';
    return;
  }

  const average = parseFloat(data.average).toFixed(1);

  container.innerHTML = `
    ${renderStars(data.average)}
    <div class="mt-1">
      <strong>Média: ${average}</strong> (${data.total} avaliações)
    </div>
  `;
} 


function updateReviewVisibility() {

    const loggedIn = isLoggedIn();

    document
        .getElementById('reviewLoggedIn')
        .classList.toggle('d-none', !loggedIn);

    document
        .getElementById('reviewLoggedOut')
        .classList.toggle('d-none', loggedIn);

}

updateReviewVisibility();

function updateReviewArea() {

    const reviewForm =
        document.getElementById('reviewForm');

    const loginMessage =
        document.getElementById('loginReviewMessage');

    if (isLoggedIn()) {

        reviewForm.classList.remove('d-none');

        loginMessage.classList.add('d-none');

    } else {

        reviewForm.classList.add('d-none');

        loginMessage.classList.remove('d-none');

    }

}

/**
 * ============================
 * PERSONAGENS
 * ============================
 */
async function loadCharacters() {
  const res = await fetch(`${API}/comic-characters/${comicId}`);
  const characters = await res.json();

  const list = document.getElementById('charactersList');
  list.innerHTML = '';

  if (!characters || characters.length === 0) {
    list.innerHTML =
      '<li class="list-group-item text-muted">Nenhum personagem vinculado</li>';
    return;
  }

  characters.forEach(c => {
    list.innerHTML += `
      <li class="list-group-item">${c.alias}</li>
    `;
  });
}

/**
 * ============================
 * CRIADORES
 * ============================
 */
async function loadCreators() {
  const res = await fetch(`${API}/comic-creators/${comicId}`);
  const creators = await res.json();

  const list = document.getElementById('creatorsList');
  list.innerHTML = '';

  if (!creators || creators.length === 0) {
    list.innerHTML =
      '<li class="list-group-item text-muted">Nenhum criador vinculado</li>';
    return;
  }

  creators.forEach(c => {
    list.innerHTML += `
      <li class="list-group-item">
        ${c.name} — <em>${c.role}</em>
      </li>
    `;
  });
}

/**
 * ============================
 * RENDERIZAR PERSONAGENS
 * ============================
 */
function renderCharacters(stories) {
  const container = document.getElementById('charactersGrid');
  container.innerHTML = '';

  const map = new Map();

  stories.forEach(story => {
    story.characters?.forEach(c => {
      if (!map.has(c.id)) {
        map.set(c.id, c);
      }
    });
  });

  if (map.size === 0) {
    container.innerHTML =
      '<p class="text-muted">Nenhum personagem cadastrado</p>';
    return;
  }
  console.log('STORIES:', stories);
  map.forEach(character => {
    console.log('CHARACTER:', character);
    container.innerHTML += `
      <div class="col-6 col-md-4">
        <div class="row g-2 mb-3">
          <div class="col-4">
            <a href="${Routes.character(character)}">
            <img
            src="${resolveImagePath(
            character.image || character.image_path || character.image_url,
            'characters'
            )
            || '/assets/img/placeholder-character.png'}"
            class="img-fluid rounded-circle"
            alt="${character.alias}">
            </a>
          </div>
          <div class="col-8 align-content-center">
            <h5 class="mb-0">${character.alias}</h5>  
            <p class="text-muted">${character.name}</p>         
          </div>
        </div>        
      </div>      
    `;
  });
}

function renderCreators(stories) {
  const container = document.getElementById('creatorsGrid');
  container.innerHTML = '';

  const map = new Map();

  stories.forEach(story => {
    story.creators?.forEach(c => {
      if (!map.has(c.id)) {
        map.set(c.id, c);
      }
    });
  });

  if (map.size === 0) {
    container.innerHTML =
      '<p class="text-muted">Nenhum criador cadastrado</p>';
    return;
  }

  map.forEach(creator => {
    container.innerHTML += `
      <div class="col-6 col-md-4">
        <div class="row g-2 mb-3">
          <div class="col-4">
            <a href="${Routes.creator(creator)}">
              <img
              src="${resolveImagePath(creator.image, 'creators')
              || '/assets/img/placeholder-creator.png'}"
              class="img-fluid rounded-circle"
              alt="${creator.name}">
            </a> 
          </div>
          <div class="col-8 align-content-center">
            <h5 class="mb-0">${creator.name}</h5> 
            <p class="text-muted">${creator.role}</p>            
          </div>
        </div>
      </div>
    `;
  });
}

/**
 * ============================
 * ADICIONAR À COLEÇÃO / WISHLIST
 * ============================
 */
async function addToCollection(status) {
  const token = localStorage.getItem('token');

  if (!requireLogin()) return;

  const res = await fetch(`${API}/collection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({
      comic_id: comicId,
      status
    })
  });

  const data = await res.json();

  if (res.ok) {
    updateButtonsAfterAdd(status, data.id); // <- importante
  } else {
    alert(data.error || 'Erro ao adicionar');
  }
}


function updateButtonsAfterAdd(status, collectionId) {
  const btnCollection = document.getElementById('btnAddCollection');
  const btnWishlist = document.getElementById('btnAddWishlist');
  const info = document.getElementById('alreadyInCollection');

  const activeBtn =
    status === 'Quero ler' ? btnWishlist : btnCollection;

  const otherBtn =
    status === 'Quero ler' ? btnCollection : btnWishlist;

  // Fade out do botão que vai sumir
  otherBtn.classList.add('fade-out');

  setTimeout(() => {
    otherBtn.classList.add('d-none');
    otherBtn.classList.remove('fade-out');
  }, 300);

  // Atualizar botão ativo
  activeBtn.classList.add('success-pulse');

  if (status === 'Quero ler') {
    activeBtn.innerHTML =
      '<i class="fa fa-fw fa-trash"></i> Remover da Wishlist';
  } else {
    activeBtn.innerHTML =
      '<i class="fa fa-fw fa-trash"></i> Remover da Coleção';
  }

  activeBtn.classList.remove('btn-dark', 'btn-outline-warning');
  activeBtn.classList.add('btn-outline-danger');

  activeBtn.onclick = () =>
    removeFromCollection(collectionId);

  info.textContent =
    status === 'Quero ler'
      ? '⭐ Adicionado à sua wishlist'
      : '✔ Adicionado à sua coleção';

  info.classList.remove('d-none');

  setTimeout(() => {
    activeBtn.classList.remove('success-pulse');
  }, 400);
}

async function removeFromCollection(id) {
  const token = localStorage.getItem('token');

  if (!confirm('Deseja remover?')) return;

  const res = await fetch(`${API}/collection/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + token
    }
  });

  if (res.ok) {
    resetButtons();
  } else {
    alert('Erro ao remover');
  }
}

function resetButtons() {
  const btnCollection = document.getElementById('btnAddCollection');
  const btnWishlist = document.getElementById('btnAddWishlist');
  const info = document.getElementById('alreadyInCollection');

  btnCollection.classList.add('fade-out');
  btnWishlist.classList.add('fade-out');

  setTimeout(() => {

    btnCollection.innerHTML =
      '<i class="fa fa-fw fa-book"></i> Adicionar à Coleção';
    btnCollection.classList.remove('btn-outline-danger');
    btnCollection.classList.add('btn-dark');
    btnCollection.onclick = () => addToCollection('Lendo');
    btnCollection.classList.remove('d-none');

    btnWishlist.innerHTML =
      '<i class="fa fa-fw fa-star"></i> Adicionar à Wishlist';
    btnWishlist.classList.remove('btn-outline-danger');
    btnWishlist.classList.add('btn-outline-warning');
    btnWishlist.onclick = () => addToCollection('Quero ler');
    btnWishlist.classList.remove('d-none');

    btnCollection.classList.remove('fade-out');
    btnWishlist.classList.remove('fade-out');

    info.classList.add('d-none');

  }, 200);
}
/**
 * ============================
 * VERIFICAR SE JÁ ESTÁ NA COLEÇÃO
 * ============================
 */
async function checkIfInCollection() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const res = await fetch(
    `${API}/collection/check/${comicId}`,
    {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }
  );

  if (!res.ok) return;

  const data = await res.json();

  if (data.exists) {
    updateButtonsAfterAdd(data.status, data.collectionId);
  }
}

/**
 * ============================
 * QUADRINHOS DA SÉRIE
 * ============================
 */

function renderMoreFromSeries(comics) {

    const container = document.getElementById('moreFromSeries');

    if (!container) return;

    if (!comics.length) {

        container.innerHTML = `
            <p class="text-muted">
                Nenhum outro quadrinho desta série.
            </p>
        `;

        return;
    }

    const placeholder = '/assets/img/placeholder-comic.png';

    container.innerHTML = '';

    comics.forEach(c => {

        container.innerHTML += `
            <div class="col-md-2 mb-3">

                <div class="card comic-card h-100 shadow-sm">

                    <a href="${Routes.comic(c)}">

                        <img
                            src="${c.cover ? BASE_URL + c.cover : placeholder}"
                            class="card-img-top"
                            alt="${c.title}"
                            loading="lazy"
                            onerror="this.onerror=null;this.src='${placeholder}'">

                    </a>

                    <div class="card-body text-center">

                        <h6>

                            ${c.title}

                            ${
                                c.display_issue
                                    ? `<small>${c.display_issue}</small>`
                                    : ''
                            }

                        </h6>

                    </div>

                </div>

            </div>
        `;

    });

}

function renderSeriesNavigation(currentComic, seriesComics) {
  console.log("Quadrinhos recebidos:", seriesComics);
  console.log("Atual:", currentComic);

  const container = document.getElementById('seriesNavigation');

  if (!container) return;

  if (!seriesComics.length) {
    container.innerHTML = '';
    return;
  }

  // Ordena por número da edição
  const ordered = [...seriesComics].sort((a, b) => {
    const aNum = a.issue_number ?? 999999;
    const bNum = b.issue_number ?? 999999;
    return aNum - bNum;
  });

  const index = ordered.findIndex(c => c.id === currentComic.id);

  let prev = null;
  let next = null;

  if (index > 0) {
    prev = ordered[index - 1];
  }

  if (index < ordered.length - 1) {
    next = ordered[index + 1];
  }

  const renderButton = (comic, direction) => {
    if (!comic) return '<div></div>';

    const placeholder = '/assets/img/placeholder-comic.png';

const cover = `
    <img
        src="${comic.cover ? BASE_URL + comic.cover : placeholder}"
        class="series-nav-thumb"
        alt="${comic.title}"
        onerror="this.onerror=null;this.src='${placeholder}'">
`;

    if (direction === 'prev') {
      return `
        <a href="${Routes.comic(comic)}" class="series-nav-btn">
          ${cover}
          <div class="series-nav-info text-start">
            <small>← Anterior</small>
            <div class="fw-bold small">
              ${comic.display_issue ? comic.display_issue + ' – ' : ''}
  ${comic.title}
            </div>
          </div>
        </a>
      `;
    }

    return `
      <a href="${Routes.comic(comic)}" class="series-nav-btn text-end">
        <div class="series-nav-info">
          <small>Próxima →</small>
          <div class="fw-bold small">
            ${comic.title}
  ${comic.display_issue ? ' – ' + comic.display_issue : ''}
          </div>
        </div>
        ${cover}
      </a>
    `;
  };

  container.innerHTML = `
    <div class="series-navigation-container">
      ${renderButton(prev, 'prev')}
      ${renderButton(next, 'next')}
    </div>
  `;
}




/**
 * ============================
 * 🛒 LINKS DE COMPRA
 * ============================
 */
async function loadBuyLinks(comicId) {
  try {
    const res = await fetch(`${API_BASE}/comics/${comicId}/buy-links`);
    const links = await res.json();

    renderBuyLinks(links);

  } catch (err) {
    console.error('Erro ao carregar links:', err);
  }
}

function renderBuyLinks(links) {
  const container = document.getElementById('buyLinksPublic');

  if (!container) return;

  container.innerHTML = '';

  if (!links || links.length === 0) {
    container.innerHTML =
      '<p class="text-white">Sem links de compra disponíveis.</p>';
    return;
  }

  links.forEach(link => {
    const a = document.createElement('a');

    a.href = link.url;
    a.target = '_blank';
    a.className = 'btn btn-success me-2 mb-2';
    a.innerHTML = `
    <i class="fa-solid fa-cart-shopping me-2"></i>
    Comprar na ${link.store_name}
`;

    container.appendChild(a);
  });
}

/**
 * ============================
 * INICIALIZAÇÃO
 * ============================
 */
loadComic();
checkIfInCollection();
loadReviews(comicId);
loadAverageRating(comicId);
setupStars();
loadMyReview();