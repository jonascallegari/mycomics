const table = document.getElementById('wishlistTable');
const token = localStorage.getItem('token');

if (!token) {
    alert('Faça login para acessar sua wishlist');
    window.location.href = '/login';
}

async function loadWishlist() {
    const res = await fetch(`${API}/collection/wishlist`, {
        headers: {
        Authorization: `Bearer ${token}`
        }
    });

    const items = await res.json();
    table.innerHTML = '';

    if (!items || items.length === 0) {
        table.innerHTML = `
      <tr>
        <td colspan="3" class="text-muted text-center">
          Nenhum quadrinho na wishlist
        </td>
      </tr>
    `;
        return;
    }

    items.forEach(item => {
        table.innerHTML += `
      <tr>
        <td>
          <a href="comic/${item.comic_id}" class="text-decoration-none">${item.title}</a>
          ${item.issue_number ? `• #${item.issue_number}` : ''}
        </td>
        <td>${item.publisher_name}</td>
        <td>
          <button class="btn btn-success btn-sm me-1"
            onclick="updateStatus(${item.id}, 'Lendo')">
            📖 Começar a ler
          </button>

          <button class="btn btn-danger btn-sm"
            onclick="removeItem(${item.id})">
            ❌ Remover
          </button>
        </td>
      </tr>
    `;
    });
}

async function updateStatus(id, status) {
    await fetch(`${API}/collection/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });

    loadWishlist();
}

async function removeItem(id) {
    if (!confirm('Remover da wishlist?')) return;

    await fetch(`${API}/collection/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
    });

    loadWishlist();
}

loadWishlist();
