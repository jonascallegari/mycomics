document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Email e senha são obrigatórios');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Erro ao cadastrar');
            return;
        }

        alert('Cadastro realizado com sucesso!');
        window.location.href = `/login`;

    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor');
    }
});
