const token = localStorage.getItem('token');

function resolveImagePath(image) {
    if (!image) return null;

    // já vem no formato correto do backend
    if (image.startsWith('/uploads')) {
        return `${BASE_URL}${image}`;
    }

    // veio só o nome do arquivo
    if (!image.includes('/')) {
        return `${BASE_URL}/uploads/${type}/${image}`;
    }

    // fallback genérico
    return `${BASE_URL}/${image}`;
}



function renderStars(rating) {
    let html = '<div class="stars-display">';

    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<span class="star filled">★</span>';
        } else {
            html += '<span class="star">★</span>';
        }
    }

    html += '</div>';
    return html;
}



let myPage = 1;

async function loadMyReviews(page = 1) {
    myPage = page;
    if (!token) {
        alert('Você precisa estar logado');
        window.location.href = 'login.html';
        return;
    }

    const res = await fetch(`${API_BASE}/reviews/me?page=${page}&limit=5`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const result = await res.json();

    const reviews = result.data;
    const pagination = result.pagination;

    const container = document.getElementById('reviewsContainer');

    if (!reviews.length) {
        container.innerHTML = `
      <p class="text-muted">Você ainda não avaliou nenhum quadrinho.</p>
    `;
        return;
    }

    container.innerHTML = reviews.map(r => `
    <div class="card mb-3">
      <div class="card-body">
        <div class="row">

          <div class="col-2">
            <img
              src="${resolveImagePath(r.comic_cover)}"
              class="img-fluid"
            >
          </div>

          <div class="col-10">
            <h5>
              <a href="comic.html?id=${r.comic_id}" class="text-decoration-none">
                ${r.comic_title}
              </a>
            </h5>

            <div class="mb-2">
              ${renderStars(r.rating)}
            </div>

            <p>${r.comment || ''}</p>

            <button class="btn btn-sm btn-primary"
                onclick="openEditModal(${r.comic_id}, ${r.rating}, '${(r.comment || '').replace(/'/g, "\\'")}')">
                Editar
            </button>

            <button
              class="btn btn-sm btn-danger"
              onclick="deleteReview(${r.id})"
            >
              Remover avaliação
            </button>
          </div>

        </div>
      </div>
    </div>
  `).join('');
    renderPagination({
        containerId: 'myReviewsPagination',
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        onPageChange: (page) => loadMyReviews(page)
    });
}

async function saveEditedReview() {
    const comicId = document.getElementById('editComicId').value;
    const rating = document.getElementById('editRating').value;
    const comment = document.getElementById('editComment').value;

    const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            comic_id: comicId,
            rating,
            comment
        })
    });

    if (res.ok) {
        alert('Avaliação atualizada!');

        const modalEl = document.getElementById('editReviewModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        loadMyReviews();
    } else {
        alert('Erro ao atualizar avaliação');
    }
}

function openEditModal(comicId, rating, comment) {
    document.getElementById('editComicId').value = comicId;
    document.getElementById('editRating').value = rating;
    document.getElementById('editComment').value = comment;

    renderEditableStars(rating);

    const modal = new bootstrap.Modal(
        document.getElementById('editReviewModal')
    );

    modal.show();
}

function renderEditableStars(selected) {
    const container = document.getElementById('starContainer');
    container.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');

        star.innerHTML = i <= selected ? '★' : '☆';

        star.style.cursor = 'pointer';
        star.style.fontSize = '24px';
        star.style.color = '#ffc107';

        star.onclick = () => {
            document.getElementById('editRating').value = i;
            renderEditableStars(i);
        };

        container.appendChild(star);
    }
}

async function deleteReview(id) {
    if (!confirm('Deseja realmente excluir esta avaliação?'))
        return;

    await fetch(`${API_BASE}/reviews/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    loadMyReviews();
}

loadMyReviews();
