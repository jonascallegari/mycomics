window.initNavbar = function () {
  const authMenu = document.getElementById('authMenu');
  if (!authMenu) return;

  const user = JSON.parse(localStorage.getItem('user'));

  if (isLoggedIn()) {

    const avatarUrl = user?.avatar
      ? `${BASE_URL}${user.avatar}`
      : '/assets/img/placeholder-character.png';

    authMenu.innerHTML = `
      <li class="nav-item dropdown">
        <a class="nav-link text-warning btn btn-dark dropdown-toggle d-flex align-items-center"
           data-bs-toggle="dropdown"
           href="perfil.html?user=${user.username}">

          <img src="${avatarUrl}"
               onerror="this.src='/assets/img/placeholder-character.png'"
               class="navbar-avatar">

          <span class="ms-2">${user.username}</span>
        </a>

        <ul class="dropdown-menu dropdown-menu-dark">
          <li><a class="dropdown-item" href="/perfil?user=${user.username}">Meu Perfil</a></li>
          <li><a class="dropdown-item" href="/my-reviews">Meus Reviews</a></li>
          <li><a class="dropdown-item" href="/my-collection">Minha Coleção</a></li>
          <li><a class="dropdown-item" href="/wishlist">Wishlist</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" onclick="logout()">Sair</a></li>
        </ul>
      </li>
    `;
  } else {
    authMenu.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/login">Login</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/register">Registrar</a>
      </li>
    `;
  }
};