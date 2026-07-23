// services/emailService.js
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
    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

    await transporter.sendMail({
        from: `"My Comics" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Recuperação de Senha',
        html: `
            <h2>Recuperação de Senha</h2>
            <p>Olá, ${user.username}.</p>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p><a href="${resetLink}">Clique aqui para redefinir sua senha</a></p>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
        `
    });
}

async function sendVerificationEmail(user, token) {
    const confirmLink = `${process.env.FRONTEND_URL}/confirmar-email?token=${token}`;

    await transporter.sendMail({
        from: `"My Comics" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Confirme seu e-mail - My Comics',
        html: `
            <h2>Bem-vindo ao My Comics!</h2>
            <p>Olá, ${user.username}.</p>
            <p>Para ativar sua conta, confirme seu e-mail clicando no link abaixo:</p>
            <p><a href="${confirmLink}">Confirmar meu e-mail</a></p>
            <p>Este link expira em 24 horas.</p>
            <p>Se você não criou esta conta, ignore este e-mail.</p>
        `
    });
}

module.exports = {
    sendPasswordResetEmail,
    sendVerificationEmail
};