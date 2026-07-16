const grid = document.getElementById('collectionGrid');
const statsDiv = document.getElementById('collectionStats');
const token = localStorage.getItem('token');

let allItems = [];

// Redireciona se não estiver logado
if (!token) {
  alert('Faça login para acessar sua coleção');
  window.location.href = 'login.html';
}

/**
 * ============================
 * CARREGAR COLEÇÃO
 * ============================
 */
async function loadCollection() {
  try {
    const res = await fetch(`${window.API_BASE}/collection`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Erro ao carregar coleção');

    allItems = await res.json();
    allItems = allItems.map(item => ({
      ...item,
      rating:
        item.review_rating !== null && item.review_rating !== undefined
          ? item.review_rating
          : item.rating || 0
    }));
    renderCollection(allItems);
    console.log(allItems);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `
      <div class="col-12 text-center text-danger">
        Erro ao carregar coleção
      </div>
    `;
  }
}

/**
 * ============================
 * ESTRELAS EDITÁVEIS (COLEÇÃO)
 * ============================
 */

function renderEditableStars(id, rating = 0) {
  let html = '<div class="stars-display">';

  for (let i = 1; i <= 5; i++) {
    html += `
      <span class="star ${i <= rating ? 'filled' : ''}"
            data-id="${id}"
            data-value="${i}">
        ★
      </span>
    `;
  }

  html += '</div>';
  return html;
}

// Delegação de evento (funciona para todos os cards)
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('star')) {
    const id = parseInt(e.target.dataset.id);
    const value = parseInt(e.target.dataset.value);

    setRating(id, value);
  }
});

document.addEventListener('mouseover', function (e) {
  if (e.target.classList.contains('star')) {
    const id = e.target.dataset.id;
    const value = e.target.dataset.value;
    highlightStars(id, value);
  }
});

document.addEventListener('mouseout', function (e) {
  if (e.target.classList.contains('star')) {
    const id = e.target.dataset.id;
    const item = allItems.find(i => i.id == id);
    highlightStars(id, item?.rating || 0);
  }
});

function highlightStars(id, rating) {
  const container = document.querySelector(`.star-rating[data-id='${id}']`);
  if (!container) return;

  const stars = container.querySelectorAll('.star');

  stars.forEach(star => {
    if (star.dataset.value <= rating) {
      star.classList.add('filled');
    } else {
      star.classList.remove('filled');
    }
  });
}

async function setRating(id, rating) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;

  item.rating = rating;

  try {
    // Atualiza coleção
    await updateItem(id, item.status, rating, item.notes || '');

    // Cria ou atualiza review
    await fetch(`${window.API_BASE}/reviews/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        comic_id: item.comic_id,
        rating
      })
    });

    highlightStars(id, rating);
    renderStats(allItems);

  } catch (err) {
    console.error('Erro ao salvar avaliação', err);
  }
}

/**
 * ============================
 * RENDERIZAR COLEÇÃO
 * ============================
 */
function renderCollection(items) {
  grid.innerHTML = '';

  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center text-muted">
        Nenhum quadrinho encontrado
      </div>
    `;
    statsDiv.innerHTML = '';
    return;
  }

  renderStats(items);

  items.forEach(item => {
    grid.innerHTML += `
      <div class="col-md-2 col-lg-2 mb-4">
        <div class="card comic-card shadow-sm h-100">
          <a href="/comic/${item.comic_id}">
            <img src="${window.BASE_URL || ''}${item.cover}"
            onerror="this.src='/site/assets/no-cover.jpg'"
            class="card-img-top"
            style="height: 320px; object-fit: cover;">
          </a>
          <div class="card-body d-flex flex-column">

            <h6 class="fw-bold">
              <a href="comic.html?id=${item.comic_id}"
                 class="text-decoration-none">
                 ${item.title}
              </a>
              ${item.issue_number ? `• #${item.issue_number}` : ''}
            </h6>

            <small class="text-muted mb-2">
              ${item.publisher_name || ''}
            </small>

            <div class="mb-2">
              <select class="form-select form-select-sm"
                onchange="updateItem(${item.id}, this.value, ${item.rating || 0}, \`${item.notes || ''}\`)">
                <option ${item.status === 'Quero ler' ? 'selected' : ''}>Quero ler</option>
                <option ${item.status === 'Lendo' ? 'selected' : ''}>Lendo</option>
                <option ${item.status === 'Lido' ? 'selected' : ''}>Lido</option>
              </select>
            </div>

            <div class="mb-2">
              <div class="star-rating" data-id="${item.id}">
                ${renderEditableStars(item.id, item.rating)}
              </div>
            </div>

            <div class="mb-2">
              <input type="text"
                placeholder="Observações"
                value="${item.notes || ''}"
                class="form-control form-control-sm"
                onchange="updateItem(${item.id}, '${item.status}', ${item.rating || 0}, this.value)">
            </div>

            <div class="mt-auto text-end">
              <button class="btn btn-outline-danger btn-sm"
                onclick="removeItem(${item.id})">
                Remover
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  });
}

/**
 * ============================
 * ESTATÍSTICAS
 * ============================
 */
function renderStats(items) {
  const total = items.length;
  const lidos = items.filter(i => i.status === 'Lido').length;
  const lendo = items.filter(i => i.status === 'Lendo').length;
  const quero = items.filter(i => i.status === 'Quero ler').length;

  const ratings = items.filter(i => i.rating);
  const media = ratings.length
    ? (ratings.reduce((acc, i) => acc + Number(i.rating), 0) / ratings.length).toFixed(1)
    : 0;

  statsDiv.innerHTML = `
    📚 Total: <strong>${total}</strong> |
    📖 Lendo: <strong>${lendo}</strong> |
    ✅ Lidos: <strong>${lidos}</strong> |
    ⭐ Média: <strong>${media}</strong>
  `;
}

/**
 * ============================
 * FILTRO
 * ============================
 */
document.getElementById('statusFilter')
  .addEventListener('change', e => {
    const status = e.target.value;

    const filtered = status
      ? allItems.filter(i => i.status === status)
      : allItems;

    renderCollection(filtered);
  });

/**
 * ============================
 * ATUALIZAR ITEM
 * ============================
 */
async function updateItem(id, status, rating, notes) {
  try {
    await fetch(`${window.API_BASE}/collection/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, rating, notes })
    });

    // Atualiza memória local
    const item = allItems.find(i => i.id === id);
    if (item) {
      item.status = status;
      item.rating = rating;
      item.notes = notes;
    }

  } catch (err) {
    console.error('Erro ao atualizar item', err);
  }
}

/**
 * ============================
 * REMOVER ITEM
 * ============================
 */
async function removeItem(id) {
  if (!confirm('Remover da sua coleção?')) return;

  try {
    await fetch(`${window.API_BASE}/collection/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    allItems = allItems.filter(i => i.id !== id);
    renderCollection(allItems);

  } catch (err) {
    console.error('Erro ao remover item', err);
  }
}

// Inicializa
loadCollection();