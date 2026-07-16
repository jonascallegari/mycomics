const API_URL = `${API_BASE}/series`;
const PUBLISHERS_URL = `${API_BASE}/publishers`;

const token = localStorage.getItem('token');

const form = document.getElementById('seriesForm');
const table = document.getElementById('seriesTable');

const imageInput = document.getElementById('cover');
const imagePreview = document.getElementById('coverPreview');

// 🔥 variável global da série atual
window.currentSeriesId = null;

/**
 * ============================
 * PREVIEW DE IMAGEM
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
 * CARREGAR EDITORAS
 * ============================
 */
async function loadPublishers(selectId, selected = null) {
    const res = await fetch(PUBLISHERS_URL);
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
 * CADASTRAR SÉRIE
 * ============================
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('name', document.getElementById('name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('publisher_id', document.getElementById('publisher_id').value);
    formData.append('original_publisher_id', document.getElementById('original_publisher_id').value);
    formData.append('start_year', document.getElementById('start_year').value);
    formData.append('end_year', document.getElementById('end_year').value);

    const cover = document.getElementById('cover').files[0];
    if (cover) {
        formData.append('cover', cover);
    }

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    if (!res.ok) {
        alert('Erro ao cadastrar série');
        return;
    }

    form.reset();
    imagePreview.src = '';
    imagePreview.classList.add('d-none');

    loadSeries();
});

/**
 * ============================
 * LISTAR SÉRIES
 * ============================
 */
async function loadSeries() {
    const res = await fetch(API_URL);
    const series = await res.json();

    table.innerHTML = '';

    series.forEach(s => {
        table.innerHTML += `
            <tr>
                <td>
                    ${s.cover
                ? `<img src="${BASE_URL}${s.cover}" width="60">`
                : ''
            }
                </td>

                <td>
                    <a href="../series.html?id=${s.id}" target="_blank">
                        ${s.name}
                    </a>
                </td>

                <td>${s.publisher_name || '—'}</td>
                <td>${s.original_publisher_name || '—'}</td>
                <td>${s.start_year || ''}</td>
                <td>${s.end_year || ''}</td>

                <td>
                    <button class="btn btn-sm btn-warning me-1"
                        onclick="editSeries(${s.id})">
                        Editar
                    </button>

                    <button class="btn btn-sm btn-danger"
                        onclick="deleteSeries(${s.id})">
                        Excluir
                    </button>
                </td>
            </tr>
        `;
    });
}

/**
 * ============================
 * EXCLUIR SÉRIE
 * ============================
 */
async function deleteSeries(id) {
    if (!confirm('Deseja realmente excluir esta série?')) return;

    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        alert('Erro ao excluir série');
        return;
    }

    loadSeries();
}

/**
 * ============================
 * EDITAR SÉRIE
 * ============================
 */
async function editSeries(id) {

    window.currentSeriesId = id; // 🔥 ESSENCIAL

    const res = await fetch(`${API_URL}/${id}`);

    if (!res.ok) {
        alert('Erro ao buscar série');
        return;
    }

    const data = await res.json();
    const series = data.series;

    document.getElementById('edit_id').value = series.id;
    document.getElementById('edit_name').value = series.name;
    document.getElementById('edit_description').value = series.description || '';

    await loadPublishers('edit_publisher_id', series.publisher_id);
    await loadPublishers('edit_original_publisher_id', series.original_publisher_id);

    document.getElementById('edit_start_year').value = series.start_year || '';
    document.getElementById('edit_end_year').value = series.end_year || '';

    const modal = new bootstrap.Modal(
        document.getElementById('editSeriesModal')
    );

    modal.show();
}

/**
 * ============================
 * ATUALIZAR SÉRIE
 * ============================
 */
document.getElementById('editSeriesForm')
    .addEventListener('submit', async e => {

        e.preventDefault();

        const id = document.getElementById('edit_id').value;

        const formData = new FormData();

        formData.append('name', document.getElementById('edit_name').value);
        formData.append('description', document.getElementById('edit_description').value);
        formData.append('publisher_id', document.getElementById('edit_publisher_id').value);
        formData.append('original_publisher_id', document.getElementById('edit_original_publisher_id').value);
        formData.append('start_year', document.getElementById('edit_start_year').value);
        formData.append('end_year', document.getElementById('edit_end_year').value);

        const cover = document.getElementById('edit_cover').files[0];
        if (cover) {
            formData.append('cover', cover);
        }

        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            alert('Erro ao atualizar série');
            return;
        }

        bootstrap.Modal.getInstance(
            document.getElementById('editSeriesModal')
        ).hide();

        loadSeries();
    });

/**
 * ============================
 * BULK CREATE (GERAR EDIÇÕES)
 * ============================
 */
function setupBulkButton() {

    const btn = document.getElementById('generateIssues');

    if (!btn) return;

    btn.addEventListener('click', async () => {

        if (!window.currentSeriesId) {
            alert('Abra uma série para gerar edições');
            return;
        }

        const start = parseInt(document.getElementById('startIssue').value);
        const end = parseInt(document.getElementById('endIssue').value);

        if (!start || !end) {
            alert('Informe o intervalo');
            return;
        }

        if (end < start) {
            alert('Intervalo inválido');
            return;
        }

        const total = end - start + 1;

        if (!confirm(`Criar ${total} edições?`)) return;

        btn.disabled = true;
        btn.innerText = 'Gerando...';

        try {
            const payload = {
                title: document.getElementById('edit_name').value,
                series_id: window.currentSeriesId,
                original_publisher_id: document.getElementById('edit_original_publisher_id').value,
                publisher_id: document.getElementById('edit_publisher_id').value,
                year: document.getElementById('edit_start_year').value,
                start,
                end
            };

            const res = await fetch(`${API_BASE}/comics/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Erro ao criar edições');
                return;
            }

            alert(`${data.total} edições criadas!`);

        } catch (err) {
            console.error(err);
            alert('Erro ao conectar com o servidor');
        }

        btn.disabled = false;
        btn.innerText = 'Gerar edições';
    });
}

/**
 * ============================
 * INICIALIZAÇÃO
 * ============================
 */
document.addEventListener('DOMContentLoaded', () => {
    loadPublishers('publisher_id');
    loadPublishers('original_publisher_id');
    loadSeries();

    setupBulkButton();
});