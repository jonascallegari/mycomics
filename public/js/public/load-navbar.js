// load-navbar.js
fetch('navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container').innerHTML = html;
        // 🔥 inicializa a busca SOMENTE depois da navbar existir
        initGlobalSearch();
        initNavbar();  
    });
