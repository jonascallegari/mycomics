document.addEventListener('DOMContentLoaded', () => {
    fetch('./footer.html')
        .then(res => res.text())
        .then(html => {
            const footerContainer = document.getElementById('footer');
            if (footerContainer) {
                footerContainer.innerHTML = html;
            }
        })
        .catch(err => {
            console.error('Erro ao carregar footer:', err);
        });
});
