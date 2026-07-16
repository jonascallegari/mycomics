document
    .getElementById('forgotPasswordForm')
    .addEventListener('submit', async (e) => {

        e.preventDefault();

        const email =
            document.getElementById('email').value.trim();

        const res = await fetch(
            `${API_BASE}/auth/forgot-password`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            }
        );

        const data = await res.json();

        alert(
            data.message ||
            'Se o e-mail existir, um link foi enviado.'
        );
    });