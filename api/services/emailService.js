const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendPasswordResetEmail(user, token) {

    const resetLink =
        `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

    await transporter.sendMail({
        from: `"My Comics" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Recuperação de Senha',
        html: `
            <h2>Recuperação de Senha</h2>

            <p>Olá, ${user.username}.</p>

            <p>Recebemos uma solicitação para redefinir sua senha.</p>

            <p>
                <a href="${resetLink}">
                    Clique aqui para redefinir sua senha
                </a>
            </p>

            <p>Este link expira em 1 hora.</p>

            <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
        `
    });

}

module.exports = {
    sendPasswordResetEmail
};