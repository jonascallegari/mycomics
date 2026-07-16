document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const profileUsername = params.get('user');

    if (!profileUsername) {
        alert('Usuário não informado');
        return;
    }

    fetch(`${API_BASE}/users/${profileUsername}`)
        .then(res => {
            if (!res.ok) throw new Error('Usuário não encontrado');
            return res.json();
        })
        .then(user => {
            renderProfile(user);
            detectOwner(profileUsername);
            loadUserStats(profileUsername);
            loadStats(profileUsername);
        })
        .catch(() => {
            alert('Perfil não encontrado');
        });
});

function renderProfile(user) {
    document.getElementById('username').textContent = user.username;

    document.getElementById('bio').textContent =
        user.bio || 'Este usuário ainda não escreveu uma bio.';

    document.getElementById('avatar').src =
        user.avatar
            ? `${BASE_URL}${user.avatar}`
            : '/assets/img/placeholder-character.png';

    if (user.created_at) {
        const date = new Date(user.created_at);
        document.getElementById('createdAt').textContent =
            `No ICDB desde ${date.toLocaleDateString('pt-BR')}`;
    }

    // ===== PERSONAGEM FAVORITO =====
    const favoriteBox = document.getElementById('favoriteCharacterBox');
    if (!favoriteBox) return;

    if (user.character_id) {
        favoriteBox.innerHTML = `
            <div class="col-md-4 text-center">
                <img class="img-fluid rounded-circle"
                    src="${BASE_URL}${user.character_image}"
                    alt="${user.character_name}"
                >
                <span>${user.character_name}</span>
            </div>
        `;
    } else {
        favoriteBox.innerHTML = `
            <span class="empty">
                Nenhum personagem favorito definido
            </span>
        `;
    }

    // ===== QUADRINHO FAVORITO =====
    const favoriteComicBox = document.getElementById('favoriteComicBox');

    if (favoriteComicBox) {
        if (user.comic_id) {
            favoriteComicBox.innerHTML = `
            <div class="col-md-3">
                <div class="comic-card shadow-sm">
                    <img
                        src="${BASE_URL}${user.comic_cover}"
                        alt="${user.comic_title}"
                    >                    
                </div>
            </div>    
        `;
        } else {
            favoriteComicBox.innerHTML = `
            <span class="empty">
                Nenhum quadrinho favorito definido
            </span>
        `;
        }
    }
}

function detectOwner(profileUsername) {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const loggedUser = JSON.parse(storedUser);

    if (
        loggedUser.username &&
        loggedUser.username === profileUsername
    ) {
        const btn = document.getElementById('editProfileBtn');
        if (btn) {
            btn.style.display = 'inline-block';
            btn.addEventListener('click', () => {
                window.location.href = '/editar-perfil';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.getElementById('avatar');
    const modal = document.getElementById('avatarModal');
    const modalImg = document.getElementById('avatarModalImg');
    const closeBtn = document.querySelector('.avatar-close');

    if (!avatar) return;

    avatar.addEventListener('click', () => {
        modal.style.display = 'flex';
        modalImg.src = avatar.src;
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });
});

function loadUserStats(username) {
    fetch(`${API_BASE}/users/${username}/stats`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(stats => {
            renderStats(stats);
        })
        .catch(() => {
            console.log('Estatísticas não disponíveis');
        });
}

function renderStats(stats) {

    if (!stats.collection) return;

    // ===== CARDS =====
    document.getElementById('statTotal').textContent =
        stats.collection.total || 0;

    document.getElementById('statCompletion').textContent =
        stats.collection.completion_percentage + '%';

    document.getElementById('statAverage').textContent =
        stats.collection.average_rating || 0;

    document.getElementById('statWishlist').textContent =
        stats.collection.wishlist || 0;


    // ===== TOP PUBLISHERS =====
    const publisherList = document.getElementById('topPublishers');
    publisherList.innerHTML = '';

    if (stats.top_publishers && stats.top_publishers.length > 0) {
        stats.top_publishers.forEach(pub => {
            publisherList.innerHTML += `
                <li class="list-group-item d-flex justify-content-between">
                    ${pub.name}
                    <span class="badge bg-dark">${pub.total}</span>
                </li>
            `;
        });
    } else {
        publisherList.innerHTML =
            '<li class="list-group-item">Nenhuma informação disponível</li>';
    }

    

    // ===== TOP GÊNEROS =====
    const genreList = document.getElementById('topGenres');
    genreList.innerHTML = '';

    if (stats.top_genres && stats.top_genres.length > 0) {
        stats.top_genres.forEach(gen => {
            genreList.innerHTML += `
                <li class="list-group-item d-flex justify-content-between">
                    ${gen.genre}
                    <span class="badge bg-dark">${gen.total}</span>
                </li>
            `;
        });
    } else {
        genreList.innerHTML =
            '<li class="list-group-item">Nenhuma informação disponível</li>';
    }

    createRankingChart(
        'charactersChart',
        stats.top_characters
    );

    createRankingChart(
        'creatorsChart',
        stats.top_creators
    );

    // ===== ATIVIDADE =====
    const activityList = document.getElementById('activityByYear');
    activityList.innerHTML = '';

    if (stats.activity_by_year && stats.activity_by_year.length > 0) {
        stats.activity_by_year.forEach(year => {
            activityList.innerHTML += `
                <li class="list-group-item d-flex justify-content-between">
                    ${year.year}
                    <span class="badge bg-primary">${year.total}</span>
                </li>
            `;
        });
    } else {
        activityList.innerHTML =
            '<li class="list-group-item">Nenhuma atividade registrada</li>';
    }
}

function renderSimpleList(elementId, data, labelField) {

    const list = document.getElementById(elementId);
    if (!list) return;

    list.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(item => {
            list.innerHTML += `
                <li class="list-group-item d-flex justify-content-between">
                    ${item[labelField]}
                    <span class="badge bg-dark">${item.total}</span>
                </li>
            `;
        });
    } else {
        list.innerHTML =
            '<li class="list-group-item">Nenhuma informação disponível</li>';
    }
}


async function loadStats(username) {

    const response = await fetch(`${API_BASE}/users/${username}/stats`);

    if (!response.ok) return;

    const stats = await response.json();

    createAvatarChart(
        'charactersChart',
        stats.top_characters
    );

    createAvatarChart(
        'creatorsChart',
        stats.top_creators
    );

    
}

function createAvatarChart(canvasId, data) {

    if (!data || data.length === 0) return;

    const labels = data.map(item => item.name);
    const values = data.map(item => item.total);

    const images = data.map(item => {
        const img = new Image();
        img.src = item.image
            ? `${BASE_URL}` + item.image
            : "/assets/img/placeholder-character.png";
        return img;
    });

    const ctx = document.getElementById(canvasId).getContext('2d');

    const avatarPlugin = {
        id: 'avatarPlugin',
        afterDatasetsDraw(chart) {

            const { ctx } = chart;
            const yAxis = chart.scales.y;

            images.forEach((img, i) => {

                if (!img.complete || img.naturalWidth === 0) return;

                const y = yAxis.getPixelForTick(i);

                ctx.save();

                const size = 38;

                ctx.beginPath();
                ctx.arc(20, y, size / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(img, -2, y - size / 2, size, size);

                ctx.restore();
            });
        }
    };

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            layout: {
                padding: {
                    left: 55
                }
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        },
        plugins: [avatarPlugin]
    });
}

function createRankingChart(containerId, data) {

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p>Nenhum dado disponível</p>';
        return;
    }

    const maxValue = Math.max(...data.map(item => item.total));

    data.forEach(item => {

        const percent = (item.total / maxValue) * 100;

        const avatar = item.image
            ? `${BASE_URL}` + item.image
            : "/assets/img/placeholder-character.png";

        const row = document.createElement('div');
        row.className = 'rank-item';

        row.innerHTML = `
            <img class="rank-avatar" src="${avatar}">
            <div class="rank-label">${item.name}</div>

            <div class="rank-bar-container">
                <div class="rank-bar"></div>
            </div>

            <div class="rank-value">${item.total}</div>
        `;

        container.appendChild(row);

        setTimeout(() => {
            row.querySelector('.rank-bar').style.width = percent + '%';
        }, 50);

    });

}

