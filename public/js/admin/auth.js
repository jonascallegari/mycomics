/**
 * Base da API (definida globalmente)
 */
const API = window.API_BASE;

function isTokenExpired(token) {

    try {

        const payload = JSON.parse(
            atob(token.split('.')[1])
        );

        return payload.exp * 1000 < Date.now();

    } catch {

        return true;

    }

}

/**
 * Retorna o token atual
 */
window.getToken = function () {
    return localStorage.getItem('token');
};

/**
 * Verifica se o usuário está logado
 */
window.isLoggedIn = () => {

    const token = getToken();

    if (!token) {
        return false;
    }

    if (isTokenExpired(token)) {

        logout(false);

        return false;

    }

    return true;

};

/**
 * LOGIN
 */
window.login = async function () {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Preencha email e senha');
        return;
    }

    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error || 'Login inválido');
        return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    window.location.href = '/';
};

/**
 * Retorna o usuário logado
 */
window.getUser = function () {

    try {
        return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
        return null;
    }

};

/**
 * Verifica se o usuário é administrador
 */
window.isAdmin = function () {

    const user = getUser();

    return !!user && user.role === 'admin';

};

/**
 * Protege páginas administrativas
 */
window.requireAdmin = function () {

    if (!isLoggedIn()) {

        window.location.href = '/login';
        return false;

    }

    if (!isAdmin()) {

        logout(false);

        window.location.href = '/login';
        return false;

    }

    return true;

};

/**
 * LOGOUT
 */
window.logout = function (redirect = true) {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (redirect) {
        window.location.href = '/';
    }

};

document.addEventListener('DOMContentLoaded', () => {

    // Protege automaticamente toda a área administrativa
    if (window.location.pathname.startsWith('/admin')) {

        requireAdmin();

    }

    const token = getToken();

    if (!token) {
        return;
    }

    if (isTokenExpired(token)) {

        logout(false);

        console.log('Sessão expirada.');

        // Se estiver na página de login, não faz nada.
        if (window.location.pathname.includes('login.html')) {
            return;
        }

        // Apenas atualiza a interface.
        if (typeof updateNavbar === 'function') {
            updateNavbar();
        }

    }

});

window.showLoginModal = function () {

    const modal =
        new bootstrap.Modal(
            document.getElementById('loginRequiredModal')
        );

    modal.show();

};

window.requireLogin = function () {

    if (isLoggedIn()) {
        return true;
    }

    showLoginModal();

    return false;

};
