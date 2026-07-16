// load-navbar.js
fetch('navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container').innerHTML = html;
        initNavbar(); // chama lógica após carregar
    });
