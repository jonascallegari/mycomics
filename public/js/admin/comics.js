import { renderPagination } from '../../assets/js/components/pagination.js';

const API_URL = `${API_BASE}/comics`;
const form = document.getElementById('comicForm');
const table = document.getElementById('comicsTable');
const token = localStorage.getItem('token');
const coverInput = document.getElementById('cover');
const coverPreview = document.getElementById('coverPreview');

let synopsisEditor;
let editSynopsisEditor;

let currentPage = 1;
const limit = 12;

const paginationContainer = document.getElementById('pagination');

/**
 * ============================
 * INICIALIZAR EDITORES
 * ============================
 */
function initEditors() {
  if (document.getElementById('synopsisEditor')) {
    synopsisEditor = createSimpleEditor('#synopsisEditor');
  }

  if (document.getElementById('editSynopsisEditor')) {
    editSynopsisEditor = createSimpleEditor('#editSynopsisEditor');
  }
}

function resolveImagePath(imagePath, folder) {
  if (!imagePath) return null;

  // se já vier como /uploads/...
  if (imagePath.startsWith('/uploads')) {
    return `${BASE_URL}${imagePath}`;
  }

  // fallback seguro
  return `${BASE_URL}/uploads/${folder}/${imagePath}`;
}


/**
 * ============================
 * PREVIEW IMAGEM FORM
 * ============================
 */
if (coverInput) {
  coverInput.addEventListener('change', () => {
    const file = coverInput.files[0];

    if (!file) {
      coverPreview.classList.add('d-none');
      coverPreview.src = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida');
      coverInput.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      coverPreview.src = e.target.result;
      coverPreview.classList.remove('d-none');
    };

    reader.readAsDataURL(file);
  });
}

/**
 * ============================
 * EVITAR DUPLICAÇÕES
 * ============================
 */
function addItemToList(selectId, listId, type) {
  const select = document.getElementById(selectId);
  const list = document.getElementById(listId);

  const id = select.value;
  const name = select.options[select.selectedIndex].text;

  if (!id) return;

  // evita duplicado
  if (list.querySelector(`[data-id="${id}"]`)) return;

  const span = document.createElement('span');
  span.className = 'badge bg-primary me-2 mb-2 p-2';
  span.dataset.id = id;
  span.innerHTML = `
    ${name}
    <span class="ms-1" style="cursor:pointer" onclick="this.parentElement.remove()">✖</span>
  `;

  list.appendChild(span);
}

function getSelectedFromList(container) {
  return Array.from(container.querySelectorAll('[data-id]'))
    .map(el => Number(el.dataset.id));
}

/**
 * ============================
 * HISTÓRIAS DINÂMICAS
 * ============================
 */
async function addStoryField() {
  const container = document.getElementById('storiesContainer');

const charactersRes = await fetch(`${API_BASE}/characters?limit=1000`);
const charactersResponse = await charactersRes.json();

const creatorsRes = await fetch(`${API_BASE}/creators?limit=1000`);
const creatorsResponse = await creatorsRes.json();

const characters = charactersResponse.data || [];
const creators = creatorsResponse.data || [];

  const storyId = Date.now(); // id temporário para diferenciar selects

  const div = document.createElement('div');
  div.className = 'border rounded p-3 mb-3 story-block';

  div.innerHTML = `
    <div class="mb-2">
      <label class="form-label">Título da História</label>
      <input type="text" class="form-control story-title" required>
    </div>

    <div class="mb-2">
      <label class="form-label">Personagens</label>

      <div class="d-flex gap-2 mb-2">
        <select class="form-select" id="charSelect_${storyId}">
          <option value="">Selecione...</option>
          ${characters.map(c =>
    `<option value="${c.id}">${c.alias}</option>`
  ).join('')}
        </select>

        <button type="button" class="btn btn-outline-primary"
          onclick="addItemToList('charSelect_${storyId}', 'charList_${storyId}')">
          Adicionar
        </button>
      </div>

      <div id="charList_${storyId}"></div>
    </div>

    <div class="mb-2">
      <label class="form-label">Criadores</label>

      <div class="d-flex gap-2 mb-2">
        <select class="form-select" id="creatorSelect_${storyId}">
          <option value="">Selecione...</option>
          ${creators.map(c =>
    `<option value="${c.id}">${c.name}</option>`
  ).join('')}
        </select>

        <button type="button" class="btn btn-outline-primary"
          onclick="addItemToList('creatorSelect_${storyId}', 'creatorList_${storyId}')">
          Adicionar
        </button>
      </div>

      <div id="creatorList_${storyId}"></div>
    </div>

    <button
      type="button"
      class="btn btn-sm btn-outline-danger remove-story"
      onclick="this.closest('.story-block').remove()">
      Remover História
    </button>
  `;

  container.appendChild(div);
}


/**
 * ============================
 * CADASTRAR QUADRINHO (COM CAPA)
 * ============================
 */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append('title', document.getElementById('title').value);
  formData.append(
    'isbn',
    document.getElementById('isbn').value.trim()
);
  formData.append(
    'publication_type',
    document.getElementById('publication_type').value
  );
  formData.append(
    'issue_number',
    document.getElementById('issue_number').value || ''
  );
  
  formData.append(
    'pages',
    document.getElementById('pages').value || ''
  );

  // 🛒 links de compra
const buyLinks = [];

document.querySelectorAll('.buy-link-item').forEach(item => {
  const store_name = item.querySelector('.store-name').value.trim();
  const url = item.querySelector('.store-url').value.trim();

  if (store_name && url) {
    buyLinks.push({ store_name, url });
  }
});

formData.append('buy_links', JSON.stringify(buyLinks));
  formData.append(
    'cover_price',
    document.getElementById('cover_price').value || ''
  );
  formData.append(
    'currency',
    document.getElementById('currency').value || ''
  );
  formData.append(
    'publisher_id',
    document.getElementById('publisher_id').value
  );
  formData.append(
    'original_publisher_id',
    document.getElementById('original_publisher_id').value || ''
  );

  formData.append(
    'series_id',
    document.getElementById('series_id').value || ''
  );
  
  formData.append('year', document.getElementById('year').value || '');
  formData.append('genre', document.getElementById('genre').value || '');

  // 📝 sinopse
  formData.append(
    'synopsis',
    synopsisEditor ? synopsisEditor.root.innerHTML : ''
  );


  // 📚 histórias
  const stories = [];

  document.querySelectorAll('.story-block').forEach(block => {
    const title = block.querySelector('.story-title')?.value.trim();

    if (!title) return;

    const storyId = block.querySelector('[id^="charList_"]').id.split('_')[1];

    const characters = getSelectedFromList(
      document.getElementById(`charList_${storyId}`)
    );

    const creators = getSelectedFromList(
      document.getElementById(`creatorList_${storyId}`)
    );

    stories.push({
      title,
      characters,
      creators
    });
  });

  formData.append('stories', JSON.stringify(stories));

  // 🖼️ capa
  const cover = document.getElementById('cover').files[0];
  if (cover) {
    formData.append('cover', cover);
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    alert('Erro ao cadastrar quadrinho');
    return;
  }

  form.reset();
  coverPreview.src = '';
  if (synopsisEditor) {
    synopsisEditor.root.innerHTML = '';
  }
  coverPreview.classList.add('d-none');
  document.getElementById('storiesContainer').innerHTML = '';
  loadComics(currentPage);
});


/**
 * ============================
 * SÉRIES
 * ============================
 */

async function loadSeries(selectId, selected = null) {
  const res = await fetch(`${API_BASE}/series`);
  const series = await res.json();

  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Nenhuma (edição avulsa)</option>';

  series.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;

    if (selected && selected == s.id) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

/**
 * ============================
 * LISTAR QUADRINHOS
 * ============================
 */
async function loadComics() {

  const res = await fetch(`${API_URL}?page=${currentPage}&limit=${limit}`);
  const response = await res.json();

  const comics = response.data || [];
  const pageData = response.pagination;

  table.innerHTML = '';

  comics.forEach(c => {
    table.innerHTML += `
      <tr>
        <td>
          <img
          src="${c.cover ? BASE_URL + c.cover : '/assets/img/placeholder-comic.png'}"
          width="50"
          alt="${c.title}"
          class="rounded shadow-sm"
          loading="lazy"
          onerror="this.onerror=null;this.src='/assets/img/placeholder-comic.png'">
        </td>
        <td>
          <a href="comic.html?id=${c.id}" class="fw-bold text-decoration-none">
            ${c.title}
          </a>
        </td>
        <td>${c.issue_number ?? ''}</td>
        <td>${c.isbn || ''}</td>
        <td>
          ${c.original_publisher_name
            ? `<a href="publisher.html?id=${c.original_publisher_id}" class="text-decoration-none">
                ${c.original_publisher_name}
              </a>`
            : '—'
          }
        </td>
        <td>
          ${c.publisher_name
            ? `<a href="publisher.html?id=${c.publisher_id}" class="text-decoration-none">
                ${c.publisher_name}
              </a>`
            : '—'
          }
        </td>
        <td>${c.year ?? ''}</td>        
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editComic(${c.id})">
            Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteComic(${c.id})">
            Excluir
          </button>
        </td>
      </tr>
    `;
  });

  // 🔢 PAGINAÇÃO
  if (pageData && paginationContainer) {
    renderPagination({
      container: paginationContainer,
      page: pageData.page,
      totalPages: pageData.totalPages,
      total: pageData.total,
      onPageChange: (newPage) => {
        currentPage = newPage;
        loadComics();
      }
    });
  }
}


async function loadPublishers(selectId, selected = null) {
  const res = await fetch(`${API_BASE}/publishers`);
  const publishers = await res.json();

  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Selecione a editora</option>';

  publishers.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;

    if (selected && selected == p.id) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

loadPublishers('publisher_id');
loadPublishers('original_publisher_id');
loadSeries('series_id');

initEditors();

/**
 * ============================
 * EXCLUIR QUADRINHO
 * ============================
 */
async function deleteComic(id) {
  if (!confirm('Deseja realmente excluir este quadrinho?')) return;

  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  alert('Quadrinho excluído!');
  loadComics(currentPage);
}

/**
 * ============================
 * EDITAR QUADRINHO (COM CAPA)
 * ============================
 */
async function editComic(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    alert('Erro ao buscar quadrinho');
    return;
  }

  const data = await res.json();

  const comic = data.comic ?? data;
  const stories = data.stories ?? [];

  // 🛒 carregar links de compra
  const linksRes = await fetch(`${API_URL}/${id}/buy-links`);
  let buyLinks = [];

  try {
    const result = await linksRes.json();
    buyLinks = Array.isArray(result) ? result : [];
  } catch {
    buyLinks = [];
  }

  const container = document.getElementById('editBuyLinksContainer');
  container.innerHTML = '';

  buyLinks.forEach(link => {
    addBuyLinkField(link, true); // ✅ IMPORTANTE
  });

  if (!comic || !comic.id) {
    console.error('Resposta inesperada da API:', data);
    alert('Erro ao carregar dados do quadrinho');
    return;
  }

  document.getElementById('edit_id').value = comic.id;
  document.getElementById('edit_title').value = comic.title;
  document.getElementById('edit_isbn').value =
    comic.isbn || '';
  document.getElementById('edit_publication_type').value =
    comic.publication_type || 'regular';
  document.getElementById('edit_issue_number').value =
    comic.issue_number || '';
  document.getElementById('edit_pages').value =
    comic.pages || '';
  document.getElementById('edit_cover_price').value =
    comic.cover_price || '';
  document.getElementById('edit_currency').value =
    comic.currency || '';

  await loadPublishers('edit_publisher_id', comic.publisher_id);
  await loadPublishers(
    'edit_original_publisher_id',
    comic.original_publisher_id
  );
  await loadSeries('edit_series_id', comic.series_id);

  document.getElementById('edit_year').value = comic.year || '';
  document.getElementById('edit_genre').value = comic.genre || '';

  if (editSynopsisEditor) {
    editSynopsisEditor.root.innerHTML = comic.synopsis || '';
  }

  await renderEditStories(stories);

  new bootstrap.Modal(
    document.getElementById('editComicModal')
  ).show();
}


/**
 * ============================
 * RENDERIZAR HISTÓRIAS
 * ============================
 */
async function renderEditStories(stories) {
  const container = document.getElementById('editStoriesContainer');
  container.innerHTML = '';

  const charactersResponse = await fetch(`${API_BASE}/characters?limit=1000`)
  .then(r => r.json());

  const creatorsResponse = await fetch(`${API_BASE}/creators?limit=1000`)
    .then(r => r.json());

  const characters = charactersResponse.data || [];
  const creators = creatorsResponse.data || [];

  stories.forEach(story => {

    const storyId = story.id;

    const div = document.createElement('div');
    div.className = 'border rounded p-3 mb-3 story-block';
    div.dataset.storyId = story.id;

    div.innerHTML = `
      <div class="mb-2">
        <label class="form-label">Título da História</label>
        <input type="text" class="form-control story-title" value="${story.title}">
      </div>

      <div class="mb-2">
        <label class="form-label">Personagens</label>

        <div class="d-flex gap-2 mb-2">
          <select class="form-select" id="editCharSelect_${storyId}">
            <option value="">Selecione...</option>
            ${characters.map(c =>
      `<option value="${c.id}">${c.alias}</option>`
    ).join('')}
          </select>

          <button type="button" class="btn btn-outline-primary"
            onclick="addItemToList('editCharSelect_${storyId}', 'editCharList_${storyId}')">
            Adicionar
          </button>
        </div>

        <div id="editCharList_${storyId}">
          ${story.characters.map(c => `
            <span class="badge bg-primary me-2 mb-2 p-2" data-id="${c.id}">
              ${c.alias}
              <span class="ms-1" style="cursor:pointer" onclick="this.parentElement.remove()">✖</span>
            </span>
          `).join('')}
        </div>
      </div>

      <div class="mb-2">
        <label class="form-label">Criadores</label>

        <div class="d-flex gap-2 mb-2">
          <select class="form-select" id="editCreatorSelect_${storyId}">
            <option value="">Selecione...</option>
            ${creators.map(c =>
      `<option value="${c.id}">${c.name}</option>`
    ).join('')}
          </select>

          <button type="button" class="btn btn-outline-primary"
            onclick="addItemToList('editCreatorSelect_${storyId}', 'editCreatorList_${storyId}')">
            Adicionar
          </button>
        </div>

        <div id="editCreatorList_${storyId}">
          ${story.creators.map(c => `
            <span class="badge bg-primary me-2 mb-2 p-2" data-id="${c.id}">
              ${c.name}
              <span class="ms-1" style="cursor:pointer" onclick="this.parentElement.remove()">✖</span>
            </span>
          `).join('')}
        </div>
      </div>

      <button type="button"
        class="btn btn-sm btn-outline-danger remove-story"
        onclick="this.closest('.story-block').remove()">
        Remover História
      </button>
    `;

    container.appendChild(div);
  });
}



/**
 * ============================
 * ADCIONAR NOVA HISTÓRIA NO MODAL
 * ============================
 */
async function addNewStoryEdit() {
  const container = document.getElementById('editStoriesContainer');

  const [charsRes, creatorsRes] = await Promise.all([
    fetch(`${API_BASE}/characters`),
    fetch(`${API_BASE}/creators`)
  ]);

  const charactersResponse = await fetch(
    `${API_BASE}/characters?limit=1000`
).then(r => r.json());
  const creatorsResponse = await fetch(
    `${API_BASE}/creators?limit=1000`
).then(r => r.json());

  const characters = charactersResponse.data || [];
  const creators = creatorsResponse.data || [];

  const tempId = Date.now();

  const div = document.createElement('div');
  div.className = 'border rounded p-3 mb-3 story-block';

  div.innerHTML = `
    <div class="mb-2">
      <label class="form-label">Título da História</label>
      <input type="text" class="form-control story-title" placeholder="Nova história">
    </div>

    <div class="mb-2">
      <label class="form-label">Personagens</label>

      <div class="d-flex gap-2 mb-2">
        <select class="form-select" id="editCharSelect_${tempId}">
          <option value="">Selecione...</option>
          ${characters.map(c =>
    `<option value="${c.id}">${c.alias}</option>`
  ).join('')}
        </select>

        <button type="button" class="btn btn-outline-primary"
          onclick="addItemToList('editCharSelect_${tempId}', 'editCharList_${tempId}')">
          Adicionar
        </button>
      </div>

      <div id="editCharList_${tempId}"></div>
    </div>

    <div class="mb-2">
      <label class="form-label">Criadores</label>

      <div class="d-flex gap-2 mb-2">
        <select class="form-select" id="editCreatorSelect_${tempId}">
          <option value="">Selecione...</option>
          ${creators.map(c =>
    `<option value="${c.id}">${c.name}</option>`
  ).join('')}
        </select>

        <button type="button" class="btn btn-outline-primary"
          onclick="addItemToList('editCreatorSelect_${tempId}', 'editCreatorList_${tempId}')">
          Adicionar
        </button>
      </div>

      <div id="editCreatorList_${tempId}"></div>
    </div>

    <button
      type="button"
      class="btn btn-sm btn-outline-danger remove-story"
      onclick="this.closest('.story-block').remove()">
      Remover História
    </button>
  `;

  container.appendChild(div);
}


/**
 * ============================
 * SALVAR ALTERAÇÕES
 * ============================
 */
document
  .getElementById('editComicForm')
  .addEventListener('submit', async e => {
    e.preventDefault();

    const id = document.getElementById('edit_id').value;

    const formData = new FormData();

    formData.append('title', document.getElementById('edit_title').value);
    formData.append('isbn', document.getElementById('edit_isbn').value.trim());
    formData.append('publication_type', document.getElementById('edit_publication_type').value);
    formData.append('issue_number', document.getElementById('edit_issue_number').value || '');
    formData.append('pages', document.getElementById('edit_pages').value || '');
    formData.append('cover_price', document.getElementById('edit_cover_price').value || '');
    formData.append('currency', document.getElementById('edit_currency').value);
    formData.append('publisher_id', document.getElementById('edit_publisher_id').value || '');
    formData.append('original_publisher_id', document.getElementById('edit_original_publisher_id').value || '');
    formData.append('series_id', document.getElementById('edit_series_id').value || '');
    formData.append('year', document.getElementById('edit_year').value || '');
    formData.append('genre', document.getElementById('edit_genre').value || '');
    formData.append(
      'synopsis',
      editSynopsisEditor ? editSynopsisEditor.root.innerHTML : ''
    );

    const cover = document.getElementById('edit_cover').files[0];
    if (cover) {
      formData.append('cover', cover);
    }

    // 🔥 1️⃣ Atualizar quadrinho
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      alert('Erro ao atualizar quadrinho');
      return;
    }

    // 🔥 2️⃣ Atualizar histórias (mantido igual)
    const blocks = document.querySelectorAll('#editStoriesContainer .story-block');

    for (const block of blocks) {
      const titleInput = block.querySelector('.story-title');
      if (!titleInput) continue;

      const title = titleInput.value.trim();
      if (!title) continue;

      const storyId = block.dataset.storyId;

      let characters = [];
      let creators = [];

      if (storyId) {
        characters = getSelectedFromList(
          document.getElementById(`editCharList_${storyId}`)
        );

        creators = getSelectedFromList(
          document.getElementById(`editCreatorList_${storyId}`)
        );
      } else {
        const charList = block.querySelector('[id^="editCharList_"]');
        const creatorList = block.querySelector('[id^="editCreatorList_"]');

        if (charList) characters = getSelectedFromList(charList);
        if (creatorList) creators = getSelectedFromList(creatorList);
      }

      if (storyId) {
        await fetch(`${API_URL}/stories/${storyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title, characters, creators })
        });
      } else {
        await fetch(`${API_URL}/${id}/stories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title, characters, creators })
        });
      }
    }

    // ============================
    // 🛒 BUY LINKS (CORRIGIDO)
    // ============================

    // 1️⃣ apagar antigos
    await fetch(`${API_URL}/${id}/buy-links`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // 2️⃣ montar lista
    const buyLinks = [];

    document.querySelectorAll('#editBuyLinksContainer .buy-link-item').forEach(item => {
      const storeInput = item.querySelector('.store-name');
      const urlInput = item.querySelector('.store-url');

      const store_name = storeInput ? storeInput.value.trim() : '';
      const url = urlInput ? urlInput.value.trim() : '';

      // DEBUG
      console.log('LINK:', { store_name, url });

      if (!store_name || !url) return;

      buyLinks.push({ store_name, url });
    });

    // 3️⃣ recriar no banco
    for (const link of buyLinks) {
      await fetch(`${API_URL}/${id}/buy-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(link)
      });
    }

    alert('Quadrinho atualizado com sucesso!');

    bootstrap.Modal.getInstance(
      document.getElementById('editComicModal')
    ).hide();


    loadComics(currentPage);
    
  });




/**
 * ============================
 * REMOVER HISTÓRIA
 * ============================
 */
document.addEventListener('click', async e => {
  if (!e.target.classList.contains('remove-story')) return;

  const block = e.target.closest('.story-block');
  const storyId = block.dataset.storyId;
  const token = localStorage.getItem('token');

  if (storyId) {
    if (!confirm('Deseja realmente remover esta história?')) return;

    const res = await fetch(
      `${API_BASE}/comics/stories/${storyId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      alert('Erro ao remover história');
      return;
    }
  }

  // remove do DOM (nova ou existente)
  block.remove();
  
});

// ============================
// CONTROLE EDIÇÃO ÚNICA
// ============================

function toggleIssueNumber(selectId, inputId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);

  if (!select || !input) return;

  if (select.value === 'one_shot') {
    input.value = '';
    input.disabled = true;
  } else {
    input.disabled = false;
  }

  select.addEventListener('change', () => {
    if (select.value === 'one_shot') {
      input.value = '';
      input.disabled = true;
    } else {
      input.disabled = false;
    }
  });
}


function addBuyLinkField(data = null, isEdit = false) {
  const container = document.getElementById(
    isEdit ? 'editBuyLinksContainer' : 'buyLinksContainer'
  );

  const div = document.createElement('div');
  div.className = 'd-flex gap-2 mb-2 buy-link-item';

  div.innerHTML = `
    <input
      type="text"
      class="form-control store-name"
      placeholder="Nome da loja (Ex: Amazon)"
      value="${data?.store_name || ''}"
    >

    <input
      type="text"
      class="form-control store-url"
      placeholder="URL do produto"
      value="${data?.url || ''}"
    >

    <button
      type="button"
      class="btn btn-outline-danger"
      onclick="this.parentElement.remove()"
    >
      ✖
    </button>
  `;

  container.appendChild(div);
}


// cadastro
toggleIssueNumber('publication_type', 'issue_number');

// edição
toggleIssueNumber('edit_publication_type', 'edit_issue_number');


loadComics(currentPage);

window.editComic = editComic;
window.deleteComic = deleteComic;
window.addBuyLinkField = addBuyLinkField;
window.addStoryField = addStoryField;
window.addNewStoryEdit = addNewStoryEdit;
window.addItemToList = addItemToList;