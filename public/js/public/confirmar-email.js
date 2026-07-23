// js/public/confirmar-email.js
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const statusEl = document.getElementById('verifyStatus');
const resendBox = document.getElementById('resendBox');

async function verify() {
    if (!token) {
        statusEl.innerHTML = '<p class="text-danger">Link inválido.</p>';
        resendBox.classList.remove('d-none');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (!res.ok) {
            statusEl.innerHTML = `<p class="text-danger">${data.error}</p>`;
            resendBox.classList.remove('d-none');
            return;
        }

        statusEl.innerHTML = `
            <p class="text-success">${data.message}</p>
            <a href="/login" class="btn btn-primary mt-2">Fazer login</a>
        `;

    } catch (err) {
        console.error(err);
        statusEl.innerHTML = '<p class="text-danger">Erro de conexão com o servidor.</p>';
    }
}

document.getElementById('resendBtn').addEventListener('click', async () => {
    const email = document.getElementById('resendEmail').value.trim();
    if (!email) return;

    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    const data = await res.json();
    alert(data.message);
});

verify();