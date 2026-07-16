const API_URL = `${API_BASE}/admin/dashboard`;
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

fetch(API_URL, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
    .then(res => res.json())
    .then(data => {
        document.getElementById('totalComics').textContent = data.totals.comics;
        document.getElementById('totalCharacters').textContent = data.totals.characters;
        document.getElementById('totalCreators').textContent = data.totals.creators;

        renderChart(data.growth);
    })
    .catch(err => {
        console.error(err);
        alert('Erro ao carregar dashboard');
    });

function renderChart(growth) {
    const ctx = document.getElementById('growthChart');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: growth.map(g => g.month),
            datasets: [{
                label: 'Quadrinhos cadastrados',
                data: growth.map(g => g.total),
                tension: 0.3,
                fill: true
            }]
        }
    });
}
