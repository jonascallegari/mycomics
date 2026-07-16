const token = localStorage.getItem('token');

const form = document.getElementById('arcForm');
const table = document.getElementById('arcsTable');

const imageInput = document.getElementById('cover');
const imagePreview = document.getElementById('coverPreview');

// Preview da imagem ao selecionar arquivo
imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];

    if (file) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.classList.remove('d-none');
    }
});

// ============================
// CARREGAR ARCOS
// ============================

async function loadArcs() {
    const res = await fetch(`${API_BASE}/arcs`);

    const data = await res.json();

    // Se o backend retornou erro
    if (!res.ok) {
        console.error("Erro ao carregar arcos:", data);
        alert(data.error || "Erro ao carregar arcos");
        return;
    }

    // O backend pode retornar:
    // - um array direto
    // - { arcs: [...] }

    let arcs = [];

    if (Array.isArray(data)) {
        arcs = data;
    } else if (Array.isArray(data.arcs)) {
        arcs = data.arcs;
    } else {
        console.error("Formato inesperado:", data);
        return;
    }

    table.innerHTML = '';

    arcs.forEach(arc => {
        table.innerHTML += `
            <tr>
                <td>
                    ${arc.cover
                ? `<img src="${BASE_URL}${arc.cover}" width="60">`
                : '-'
            }
                </td>

                <td>${arc.name}</td>

                <td>
                    ${arc.comics_count || 0}
                </td>

                <td>${arc.start_year || '-'}</td>

                <td>${arc.end_year || '-'}</td>

                <td>
                    <button class="btn btn-sm btn-warning"
                        onclick="openEditModal(${arc.id})">
                        Editar
                    </button>

                    <button class="btn btn-sm btn-danger"
                        onclick="deleteArc(${arc.id})">
                        Excluir
                    </button>
                </td>
            </tr>
        `;
    });
}

// ============================
// CADASTRAR ARCO
// ============================

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('name', document.getElementById('name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('start_year', document.getElementById('start_year').value);
    formData.append('end_year', document.getElementById('end_year').value);

    if (imageInput.files[0]) {
        formData.append('cover', imageInput.files[0]);
    }

    await fetch(`${API_BASE}/arcs`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    form.reset();
    imagePreview.classList.add('d-none');

    loadArcs();
});

// ============================
// EXCLUIR ARCO
// ============================

async function deleteArc(id) {
    if (!confirm('Tem certeza que deseja excluir este arco?')) return;

    await fetch(`${API_BASE}/arcs/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    loadArcs();
}

// ============================
// ABRIR MODAL DE EDIÇÃO
// ============================

async function openEditModal(id) {
    const res = await fetch(`${API_BASE}/arcs/${id}`);
    const data = await res.json();

    const arc = data.arc;

    document.getElementById('edit_id').value = arc.id;
    document.getElementById('edit_name').value = arc.name;
    document.getElementById('edit_description').value = arc.description || '';
    document.getElementById('edit_start_year').value = arc.start_year || '';
    document.getElementById('edit_end_year').value = arc.end_year || '';

    const modal = new bootstrap.Modal(
        document.getElementById('editArcModal')
    );

    modal.show();
}

// ============================
// SALVAR EDIÇÃO
// ============================

document.getElementById('editArcForm')
    .addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit_id').value;

        const formData = new FormData();

        formData.append(
            'name',
            document.getElementById('edit_name').value
        );

        formData.append(
            'description',
            document.getElementById('edit_description').value
        );

        formData.append(
            'start_year',
            document.getElementById('edit_start_year').value
        );

        formData.append(
            'end_year',
            document.getElementById('edit_end_year').value
        );

        const editCover =
            document.getElementById('edit_cover').files[0];

        if (editCover) {
            formData.append('cover', editCover);
        }

        await fetch(`${API_BASE}/arcs/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const modal = bootstrap.Modal.getInstance(
            document.getElementById('editArcModal')
        );

        modal.hide();

        loadArcs();
    });

// ============================
// INICIAR
// ============================

loadArcs();
