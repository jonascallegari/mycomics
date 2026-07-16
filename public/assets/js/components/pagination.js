export function renderPagination({
    container,
    page,
    totalPages,
    total,
    onPageChange
}) {
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex justify-content-between align-items-center w-100';

    // 🔢 TOTAL
    const totalText = document.createElement('div');
    totalText.className = 'text-muted small';
    totalText.textContent = `${total} resultados`;
    wrapper.appendChild(totalText);

    const ul = document.createElement('ul');
    ul.className = 'pagination mb-0';

    function createPageItem(p, isActive = false) {
        const li = document.createElement('li');
        li.className = `page-item ${isActive ? 'active' : ''}`;

        li.innerHTML = `<button class="page-link">${p}</button>`;
        li.onclick = () => onPageChange(p);

        return li;
    }

    function createEllipsis() {
        const li = document.createElement('li');
        li.className = 'page-item disabled';
        li.innerHTML = `<span class="page-link">...</span>`;
        return li;
    }

    // ⬅️ anterior
    if (page > 1) {
        const prev = document.createElement('li');
        prev.className = 'page-item';
        prev.innerHTML = `<button class="page-link">&laquo;</button>`;
        prev.onclick = () => onPageChange(page - 1);
        ul.appendChild(prev);
    }

    const range = 1;
    const start = Math.max(2, page - range);
    const end = Math.min(totalPages - 1, page + range);

    // primeira
    ul.appendChild(createPageItem(1, page === 1));

    if (start > 2) ul.appendChild(createEllipsis());

    for (let i = start; i <= end; i++) {
        ul.appendChild(createPageItem(i, i === page));
    }

    if (end < totalPages - 1) ul.appendChild(createEllipsis());

    if (totalPages > 1) {
        ul.appendChild(createPageItem(totalPages, page === totalPages));
    }

    // ➡️ próxima
    if (page < totalPages) {
        const next = document.createElement('li');
        next.className = 'page-item';
        next.innerHTML = `<button class="page-link">&raquo;</button>`;
        next.onclick = () => onPageChange(page + 1);
        ul.appendChild(next);
    }

    wrapper.appendChild(ul);
    container.appendChild(wrapper);
}