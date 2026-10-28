import { renderPagination } from '../../assets/js/components/pagination.js';

const grid = document.getElementById('usersGrid');
const status = document.getElementById('usersStatus');
const pagination = document.getElementById('usersPagination');
const searchInput = document.getElementById('userSearch');
const sortSelect = document.getElementById('userSort');

const limit = 12;
let currentPage = 1;
let searchTimeout;

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadUsers();
    }, 300);
});

sortSelect.addEventListener('change', () => {
    currentPage = 1;
    loadUsers();
});

async function loadUsers() {
    status.textContent = 'Carregando usuários...';
    status.classList.remove('d-none');
    grid.innerHTML = '';
    pagination.innerHTML = '';

    const params = new URLSearchParams({
        page: currentPage,
        limit,
        sort: sortSelect.value
    });
    const search = searchInput.value.trim();
    if (search) params.set('search', search);

    try {
        const response = await fetch(`${API_BASE}/users?${params}`);
        if (!response.ok) throw new Error('Não foi possível carregar os usuários.');

        const result = await response.json();
        renderUsers(result.data, result.pagination);
    } catch (error) {
        console.error(error);
        status.textContent = 'Erro ao carregar usuários. Tente novamente mais tarde.';
    }
}

function renderUsers(users, pageData) {
    if (!users.length) {
        status.textContent = 'Nenhum usuário encontrado.';
        return;
    }

    status.classList.add('d-none');

    users.forEach((user, index) => {
        const isTopActive = sortSelect.value === 'active'
            && pageData.page === 1
            && index < 3
            && user.activity_count > 0;
        const profileUrl = `/perfil?user=${encodeURIComponent(user.username)}`;
        const avatarUrl = user.avatar
            ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`)
            : '/assets/img/placeholder-character.png';
        const memberSince = user.created_at
            ? new Date(user.created_at).toLocaleDateString('pt-BR')
            : null;
        const column = document.createElement('div');
        column.className = 'col-sm-6 col-lg-4';
        column.innerHTML = `
            <article class="card h-100 shadow-sm ${isTopActive ? 'border-warning' : ''}">
                <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <img
                            src="${escapeHtml(avatarUrl)}"
                            alt="Avatar de ${escapeHtml(user.username)}"
                            class="rounded-circle"
                            width="64"
                            height="64"
                            style="object-fit: cover"
                            onerror="this.onerror=null;this.src='/assets/img/placeholder-character.png'"
                        >
                        <div class="min-w-0">
                            <h2 class="h5 mb-1 text-break">
                                <a class="text-decoration-none" href="${profileUrl}">${escapeHtml(user.username)}</a>
                            </h2>
                            ${isTopActive ? `<span class="badge text-bg-warning">Mais ativo #${index + 1}</span>` : ''}
                        </div>
                    </div>
                    <p class="text-muted small mb-3">${escapeHtml(user.bio || 'Este usuário ainda não escreveu uma bio.')}</p>
                    <div class="d-flex flex-wrap gap-3 small text-muted">
                        <span><i class="fa-solid fa-book-open me-1" aria-hidden="true"></i>${user.collection_count} na coleção</span>
                        <span><i class="fa-solid fa-star me-1" aria-hidden="true"></i>${user.review_count} reviews</span>
                    </div>
                    ${memberSince ? `<p class="small text-muted mt-3 mb-0">Na comunidade desde ${escapeHtml(memberSince)}</p>` : ''}
                </div>
                <div class="card-footer bg-white border-0 pt-0">
                    <a href="${profileUrl}" class="btn btn-outline-primary btn-sm">Ver perfil</a>
                </div>
            </article>
        `;
        grid.appendChild(column);
    });

    renderPagination({
        container: pagination,
        page: pageData.page,
        totalPages: pageData.totalPages,
        total: pageData.total,
        onPageChange: page => {
            currentPage = page;
            loadUsers();
        }
    });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

loadUsers();
