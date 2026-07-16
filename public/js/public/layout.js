document.addEventListener('DOMContentLoaded', () => {
    loadPartial('navbar-container', '/partials/header.html', setActiveMenu);
    loadPartial('footer', '/partials/footer.html');
    updateYear();
});

function loadPartial(id, url, callback) {
    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Erro ao carregar ${url}`);
            }
            return res.text();
        })
        .then(html => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = html;
            }
            initGlobalSearch();
            initNavbar(); 
            
            if (callback) callback();
        })
        .catch(err => {
            console.error(err.message);
        });
}

function setActiveMenu() {
    const currentPath = window.location.pathname;

    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');

        if (href && currentPath.startsWith(href)) {
            link.classList.add('active');
        }
    });
}

function updateYear() {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}
