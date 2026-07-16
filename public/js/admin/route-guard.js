(function () {
    const protectedPages = [
        'comics.html',
        'characters.js',
        'creators.js',
        'wishlist.html',
        'my-collection.html'
    ];

    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'login.html';
    }
})();