window.initNavbar = function () {
  const authMenu = document.getElementById('authMenu');
  if (!authMenu) return;

  if (isLoggedIn()) {
    authMenu.innerHTML = `
      <li class="nav-item">
        <a class="nav-link text-warning" href="/my-collection">
          👤 Minha Conta
        </a>
      </li>
      <li class="nav-item">
        <button class="btn btn-sm btn-outline-light ms-2" onclick="logout()">
          Sair
        </button>
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
