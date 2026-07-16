const API_URL = `${API_BASE}/admin/users`;
const token = localStorage.getItem('token');
const table = document.getElementById('usersTable');



async function loadUsers() {
    const res = await fetch(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.status === 403) {
        alert('Acesso negado');
        return;
    }

    const response = await res.json();
    const users = response.data;

    table.innerHTML = '';

    users.forEach(u => {
        table.innerHTML += `
        <tr>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>
                <select id="role-${u.id}">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>user</option>
                    <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>editor</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-warning"
                    onclick="updateRole(${u.id}, document.getElementById('role-${u.id}').value)">
                    Salvar
                </button>
            </td>
        </tr>
        `;
    });
}

async function updateRole(id, role) {
    await fetch(`${API_BASE}/admin/users/${id}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
    });
    loadUsers();
}

loadUsers();
