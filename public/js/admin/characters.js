import { renderPagination } from '../../assets/js/components/pagination.js';

const API_URL = `${API_BASE}/characters`;
const form = document.getElementById('characterForm');
const table = document.getElementById('charactersTable');
const token = localStorage.getItem('token');

const imageInput = document.getElementById('edit_image');
const imagePreview = document.getElementById('editImagePreview');

const searchInput = document.getElementById('searchInput');

let currentPage = 1;
const limit = 20;

let historyEditor;
let editHistoryEditor;

let searchTimeout;

searchInput.addEventListener('input', () => {

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadCharacters();
    }, 400);

});

/**
 * ============================
 * INICIALIZAR EDITORES
 * ============================
 */
function initEditors() {
    if (document.getElementById('historyEditor')) {
        historyEditor = createSimpleEditor('#historyEditor');
    }

    if (document.getElementById('editHistoryEditor')) {
        editHistoryEditor = createSimpleEditor('#editHistoryEditor');
    }
}

/**
 * ============================
 * PREVIEW DE IMAGEM NO EDIT
 * ============================
 */
if (imageInput) {
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];

        if (!file) {
            imagePreview.classList.add('d-none');
            imagePreview.src = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Selecione uma imagem válida');
            imageInput.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = e => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('d-none');
        };

        reader.readAsDataURL(file);
    });
}

/**
 * ============================
 * CADASTRAR PERSONAGEM
 * ============================
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('name', document.getElementById('name').value);
    formData.append('alias', document.getElementById('alias').value);
    formData.append(
        'publisher_id',
        document.getElementById('publisher_id').value
    );
    formData.append(
        'first_appearance',
        document.getElementById('first_appearance').value
    );

    formData.append(
        'history',
        historyEditor ? historyEditor.root.innerHTML : ''
    );

    const image = document.getElementById('image').files[0];
    if (image) {
        formData.append('image', image);
    }

    try {

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            alert('Erro ao cadastrar personagem');
            return;
        }

        alert('Personagem cadastrado com sucesso!');

        form.reset();

        if (historyEditor) {
            historyEditor.root.innerHTML = '';
        }

        imagePreview.src = '';
        imagePreview.classList.add('d-none');

        // 🔥 Atualiza a lista sem recarregar página
        loadCharacters();

        // 🔥 Opcional: rolar para a tabela
        table.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert('Erro ao cadastrar personagem');
    }
});
/**
 * ============================
 * LISTAR PERSONAGENS
 * ============================
 */
async function loadCharacters(page = currentPage) {

let url = `${API_URL}?page=${page}&limit=${limit}`;

if (searchInput.value.trim()) {
    url += `&search=${encodeURIComponent(
        searchInput.value.trim()
    )}`;
}

const res = await fetch(url);

const response = await res.json();

const characters = response.data;
const pageData = response.pagination;

table.innerHTML = '';

characters.forEach(c => {

    table.innerHTML += `
    <tr>
        <td>
            ${c.image
                ? `<img src="${BASE_URL}${c.image}" width="50">`
                : ''}
        </td>

        <td>${c.alias || ''}</td>

        <td>
            <a href="character.html?id=${c.id}"
               class="fw-bold text-decoration-none">
                ${c.name}
            </a>
        </td>

        <td>
            ${
                c.publisher_name
                ? `
                <a href="publisher.html?id=${c.publisher_id}"
                   class="text-decoration-none">
                    ${c.publisher_name}
                </a>
                `
                : '—'
            }
        </td>

        <td>${c.first_appearance || ''}</td>

        <td>
            <button
                class="btn btn-sm btn-warning me-1"
                onclick="editCharacter(${c.id})">
                Editar
            </button>

            <button
                class="btn btn-sm btn-danger"
                onclick="deleteCharacter(${c.id})">
                Excluir
            </button>
        </td>
    </tr>
    `;
});

renderPaginationWrapper(pageData);

}

loadCharacters(currentPage);

/**
 * ============================
 * CARREGAR EDITORAS
 * ============================
 */
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

/**
 * ============================
 * EXCLUIR PERSONAGEM
 * ============================
 */
async function deleteCharacter(id) {
    if (!confirm('Excluir personagem?')) return;

    await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    loadCharacters(currentPage);
}

/**
 * ============================
 * EDITAR PERSONAGEM
 * ============================
 */
async function editCharacter(id) {
    const res = await fetch(`${API_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        alert('Erro ao buscar personagem');
        return;
    }

    const data = await res.json();
    const character = data.character;

    document.getElementById('edit_id').value = character.id;
    document.getElementById('edit_name').value = character.name;
    document.getElementById('edit_alias').value = character.alias || '';

    await loadPublishers('edit_publisher_id', character.publisher_id);

    document.getElementById('edit_first_appearance').value =
        character.first_appearance || '';

    // 🔥 Popular editor rico na edição
    if (editHistoryEditor) {
        editHistoryEditor.root.innerHTML = character.history || '';
    }


    const modal = new bootstrap.Modal(
        document.getElementById('editCharacterModal')
    );
    modal.show();
}

/**
 * ============================
 * SALVAR EDIÇÃO
 * ============================
 */
document
    .getElementById('editCharacterForm')
    .addEventListener('submit', async e => {
        e.preventDefault();

        const id = document.getElementById('edit_id').value;
        const formData = new FormData();

        formData.append('name', document.getElementById('edit_name').value);
        formData.append('alias', document.getElementById('edit_alias').value);
        formData.append(
            'publisher_id',
            document.getElementById('edit_publisher_id').value
        );
        formData.append(
            'first_appearance',
            document.getElementById('edit_first_appearance').value
        );

        // 🔥 Salvar conteúdo do editor rico
        formData.append(
            'history',
            editHistoryEditor ? editHistoryEditor.root.innerHTML : ''
        );

        const image = document.getElementById('edit_image').files[0];
        if (image) {
            formData.append('image', image);
        }

        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            alert('Erro ao atualizar personagem');
            return;
        }

        alert('Personagem atualizado com sucesso!');

        bootstrap.Modal.getInstance(
            document.getElementById('editCharacterModal')
        ).hide();

        loadCharacters(currentPage);
    });

/**
 * ============================
 * INICIALIZAÇÃO
 * ============================
 */
document.addEventListener('DOMContentLoaded', () => {
    loadPublishers('publisher_id');
    initEditors();
});


function renderPaginationWrapper(pageData) {

    renderPagination({
        container: document.getElementById('pagination'),
        page: pageData.page,
        totalPages: pageData.totalPages,
        total: pageData.total,

        onPageChange: (newPage) => {
            currentPage = newPage;
            loadCharacters();
        }
    });

}

window.editCharacter = editCharacter;
window.deleteCharacter = deleteCharacter;