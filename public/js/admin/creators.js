import { renderPagination } from '../../assets/js/components/pagination.js';

const API_URL = `${API_BASE}/creators`;
const form = document.getElementById('creatorForm');
const table = document.getElementById('creatorsTable');
const token = localStorage.getItem('token');

const searchInput = document.getElementById('searchInput');

let currentPage = 1;
const limit = 10;

let bioEditor;
let editBioEditor;

let searchTimeout;

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadCreators();
    }, 400);
});

/**
 * ============================
 * INICIALIZAR EDITORES
 * ============================
 */
function initEditors() {
    if (document.getElementById('bioEditor')) {
        bioEditor = createSimpleEditor('#bioEditor');
    }

    if (document.getElementById('editBioEditor')) {
        editBioEditor = createSimpleEditor('#editBioEditor');
    }
}

/**
 * ============================
 * PREVIEW IMAGEM (CADASTRO)
 * ============================
 */
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');

if (imageInput) {
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];

        if (!file || !file.type.startsWith('image/')) {
            imagePreview.classList.add('d-none');
            imagePreview.src = '';
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
 * PREVIEW IMAGEM (EDIÇÃO)
 * ============================
 */
const editImageInput = document.getElementById('edit_image');
const editImagePreview = document.getElementById('editImagePreview');

if (editImageInput) {
    editImageInput.addEventListener('change', () => {
        const file = editImageInput.files[0];

        if (!file || !file.type.startsWith('image/')) {
            editImagePreview.classList.add('d-none');
            editImagePreview.src = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            editImagePreview.src = e.target.result;
            editImagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    });
}

/**
 * ============================
 * CADASTRAR CRIADOR
 * ============================
 */
form.addEventListener('submit', async e => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('name', document.getElementById('name').value);
    formData.append('role', document.getElementById('role').value);

    // 📝 Biografia do editor rico
    formData.append(
        'bio',
        bioEditor ? bioEditor.root.innerHTML : ''
    );

    formData.append(
        'nationality',
        document.getElementById('nationality').value
    );

    formData.append(
        'birth_year',
        document.getElementById('birth_year').value
    );

    const image = imageInput.files[0];
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

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Erro ao cadastrar');
            return;
        }

        alert('Criador cadastrado com sucesso!');

        form.reset();

        if (bioEditor) {
            bioEditor.root.innerHTML = '';
        }

        imagePreview.src = '';
        imagePreview.classList.add('d-none');

        // 🔄 Atualiza lista
        loadCreators(currentPage);

        // 🔽 Opcional: rolar até a tabela
        document
            .getElementById('creatorsTable')
            ?.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {

        console.error(error);
        alert('Erro ao cadastrar criador');

    }

});

/**
 * ============================
 * LISTAR CRIADORES
 * ============================
 */
async function loadCreators(page = currentPage) {

    let url = `${API_URL}?page=${page}&limit=${limit}`;

if (searchInput.value.trim()) {
    url += `&search=${encodeURIComponent(searchInput.value.trim())}`;
}

    const res = await fetch(url);
    const response = await res.json();

    const creators = response.data;
    const pageData = response.pagination;

    table.innerHTML = '';

    creators.forEach(c => {
        table.innerHTML += `
            <tr>
                <td>
                    ${c.image
                        ? `<img src="${BASE_URL}${c.image}" width="50">`
                        : ''
                    }
                </td>

                <td>
                    <a href="creator.html?id=${c.id}" class="fw-bold text-decoration-none">
                        ${c.name}
                    </a>
                </td>

                <td>${c.role || ''}</td>

                <td>
                    <button class="btn btn-sm btn-warning me-1"
                        onclick="editCreator(${c.id})">Editar</button>

                    <button class="btn btn-sm btn-danger"
                        onclick="deleteCreator(${c.id})">Excluir</button>
                </td>
            </tr>
        `;
    });

    renderPaginationWrapper(pageData);
}

loadCreators(currentPage);
initEditors();

/**
 * ============================
 * EXCLUIR CRIADOR
 * ============================
 */
async function deleteCreator(id) {
    if (!confirm('Excluir criador?')) return;

    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        alert('Erro ao excluir criador');
        return;
    }

    loadCreators(currentPage);
}

/**
 * ============================
 * EDITAR CRIADOR
 * ============================
 */
async function editCreator(id) {
    const res = await fetch(`${API_URL}/${id}`);

    if (!res.ok) {
        alert('Erro ao buscar criador');
        return;
    }

    const data = await res.json();
    const creator = data.creator;

    document.getElementById('edit_id').value = creator.id;
    document.getElementById('edit_name').value = creator.name;
    document.getElementById('edit_nationality').value = creator.nationality;
    document.getElementById('edit_birth_year').value = creator.birth_year;
    document.getElementById('edit_role').value = creator.role || '';    

    if (editBioEditor) {
        editBioEditor.root.innerHTML = creator.bio || '';
    }

    editImagePreview.src = '';
    editImagePreview.classList.add('d-none');
    editImageInput.value = '';

    const modal = new bootstrap.Modal(
        document.getElementById('editCreatorModal')
    );
    modal.show();
}

/**
 * ============================
 * SALVAR EDIÇÃO
 * ============================
 */
document.getElementById('editCreatorForm').addEventListener('submit', async e => {
    e.preventDefault();

    const id = document.getElementById('edit_id').value;

    const formData = new FormData();
    formData.append('name', document.getElementById('edit_name').value);
    formData.append('role', document.getElementById('edit_role').value);
    formData.append('nationality', document.getElementById('edit_nationality').value);
    formData.append('birth_year', document.getElementById('edit_birth_year').value);    

    formData.append(
        'bio',
        editBioEditor ? editBioEditor.root.innerHTML : ''
    );

    const image = editImageInput.files[0];
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
        alert('Erro ao atualizar criador');
        return;
    }

    alert('Criador atualizado com sucesso!');

    bootstrap.Modal.getInstance(
        document.getElementById('editCreatorModal')
    ).hide();

    loadCreators(currentPage);
});


function renderPaginationWrapper(pageData) {

    renderPagination({
        container: document.getElementById('pagination'),
        page: pageData.page,
        totalPages: pageData.totalPages,
        total: pageData.total,

        onPageChange: (newPage) => {
            currentPage = newPage;
            loadCreators(newPage);
        }
    });

}

window.editCreator = editCreator;
window.deleteCreator = deleteCreator;