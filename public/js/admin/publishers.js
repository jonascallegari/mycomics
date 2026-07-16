const API_URL = `${API_BASE}/publishers`;
const form = document.getElementById('publisherForm');
const list = document.getElementById('publishersList');
const table = document.getElementById('publishersTable');
const token = localStorage.getItem('token');

let descriptionEditor;
let editDescriptionEditor;

/**
 * ============================
 * INICIALIZAR EDITORES
 * ============================
 */
function initEditors() {
  if (document.getElementById('descriptionEditor')) {
    descriptionEditor = createSimpleEditor('#descriptionEditor');
  }

  if (document.getElementById('editDescriptionEditor')) {
    editDescriptionEditor = createSimpleEditor('#editDescriptionEditor');
  }
}

/**
 * ============================
 * CADASTRAR EDITORA
 * ============================
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('name', document.getElementById('name').value);    

    // 📝 Histórico
    formData.append(
      'description',
      descriptionEditor ? descriptionEditor.root.innerHTML : ''
    );

    formData.append('website', document.getElementById('website').value);

    const logo = document.getElementById('logo').files[0];
    if (logo) {
        formData.append('logo', logo);
    }

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!res.ok) {
        alert('Erro ao cadastrar editora');
        return;
    }

    form.reset();
    loadPublishers();
});

/**
 * ============================
 * LISTAR EDITORAS
 * ============================
 */
async function loadPublishers() {
    const res = await fetch(API_URL);
    const publishers = await res.json();

    list.innerHTML = '';

    if (!Array.isArray(publishers)) return;

    publishers.forEach(p => {
        list.innerHTML += `
      <div class="col-md-2 mb-4">
        <div class="card publisher-card h-100 text-center">
          ${p.logo
                ? `<img src="${BASE_URL}${p.logo}" class="card-img-top">`
                : ''
            }
          <div class="card-body">
            <h5 class="card-title">${p.name}</h5>

            <a href="publisher.html?id=${p.id}"
               class="btn btn-sm btn-primary w-100 mb-2">
              Ver detalhes
            </a>

            ${p.website
                ? `<a href="${p.website}" target="_blank"
                   class="btn btn-sm btn-outline-secondary w-100">
                   Site oficial
                 </a>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
    });
}

loadPublishers();
initEditors();


/**
 * ============================
 * LISTAR EDITORAS
 * ============================
 */
async function loadPublishers() {
  const res = await fetch(API_URL);
  const publishers = await res.json();

  table.innerHTML = '';

  if (!Array.isArray(publishers)) return;

  publishers.forEach(p => {
    table.innerHTML += `     

      <tr>
            <td>
                ${p.logo
        ? `<img src="${BASE_URL}${p.logo}" width="50">`
        : ''
      }
            </td>
            <td>
                <a href="publisher.html?id=${p.id}" class="fw-bold text-decoration-none">
                    ${p.name}
                </a>
            </td>
            <td>
                <a href="publisher.html?id=${p.id}" target="_blank" class="fw-bold text-decoration-none">
                    ${p.website}
                </a>
            </td>           
            
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editPublisher(${p.id})">
                    Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePublisher(${p.id})">
                    Excluir
                </button>
            </td>
        </tr>
    `;
  });
}

loadPublishers();


/**
 * ============================
 * EDITAR EDITORA 
 * ============================
 */

let editModal;

async function editPublisher(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const data = await res.json();

  document.getElementById('editId').value = id;
  document.getElementById('editName').value = data.publisher.name;

  if (editDescriptionEditor) {
    editDescriptionEditor.root.innerHTML = data.publisher.description || '';
  }

  document.getElementById('editWebsite').value = data.publisher.website || '';

  editModal = new bootstrap.Modal(
    document.getElementById('editPublisherModal')
  );
  editModal.show();
}

document
  .getElementById('editPublisherForm')
  .addEventListener('submit', async e => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const formData = new FormData();

    formData.append('name', document.getElementById('editName').value);    

    formData.append(
      'description',
      editDescriptionEditor ? editDescriptionEditor.root.innerHTML : ''
    );

    formData.append(
      'website',
      document.getElementById('editWebsite').value
    );

    const logo = document.getElementById('editLogo').files[0];
    if (logo) {
      formData.append('logo', logo);
    }

    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      alert('Erro ao atualizar editora');
      return;
    }

    editModal.hide();
    loadPublishers();
  });


/**
* ============================
* EXCLUIR EDITORA
* ============================
*/
async function deletePublisher(id) {
  if (!confirm('Deseja realmente excluir esta editora?')) return;

  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  alert('Editora excluída!');
  loadPublishers();
}