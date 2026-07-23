const express = require('express');
const dbPromise = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();

const {
    sendPasswordResetEmail,
    sendVerificationEmail
} = require('../services/emailService');

async function createAndSendVerification(db, user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await db.run(`
        INSERT INTO email_verifications (user_id, token, expires_at)
        VALUES (?, ?, ?)
    `, [user.id, token, expiresAt.toISOString()]);

    await sendVerificationEmail(user, token);
}

// ===============================
// REGISTRO
// ===============================
router.post('/register', async (req, res) => {
    try {
        const db = await dbPromise;
        const { username, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const hash = await bcrypt.hash(password, 10);

        const result = await db.run(`
            INSERT INTO users
            (username, email, password, role, is_active, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, 'user', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [username || 'Usuário', email, hash]);

        const newUser = {
            id: result.lastID,
            username: username || 'Usuário',
            email
        };

        await createAndSendVerification(db, newUser);

        res.status(201).json({
            success: true,
            message: 'Cadastro realizado. Verifique seu e-mail para ativar sua conta.'
        });

    } catch (err) {
        console.error(err);

        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});


// ===============================
// LOGIN
// ===============================
router.post('/login', async (req, res) => {
    try {
        const db = await dbPromise;
        const { email, password } = req.body;

        const user = await db.get(`
            SELECT id, username, email, password, role, avatar, email_verified
            FROM users
            WHERE email = ?
        `, [email]);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const senhaValida = await bcrypt.compare(password, user.password);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.email_verified) {
            return res.status(403).json({
                error: 'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'icdb_secret',
            { expiresIn: '1d' }
        );

        delete user.password;
        delete user.email_verified;

        res.json({ token, user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});


// ===============================
// CONFIRMAR E-MAIL
// ===============================
router.post('/verify-email', async (req, res) => {
    try {
        const db = await dbPromise;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token inválido' });
        }

        const verification = await db.get(`
            SELECT * FROM email_verifications
            WHERE token = ? AND used = 0
        `, [token]);

        if (!verification) {
            return res.status(400).json({ error: 'Token inválido ou já utilizado' });
        }

        if (new Date(verification.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Token expirado. Solicite um novo e-mail de confirmação.' });
        }

        await db.run(`UPDATE users SET email_verified = 1 WHERE id = ?`, [verification.user_id]);
        await db.run(`UPDATE email_verifications SET used = 1 WHERE id = ?`, [verification.id]);

        res.json({ success: true, message: 'E-mail confirmado com sucesso!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao confirmar e-mail' });
    }
});


// ===============================
// REENVIAR CONFIRMAÇÃO
// ===============================
router.post('/resend-verification', async (req, res) => {
    try {
        const db = await dbPromise;
        const { email } = req.body;

        const user = await db.get(`SELECT id, username, email, email_verified FROM users WHERE email = ?`, [email]);

        // Resposta genérica sempre, pra não vazar quais e-mails existem no banco
        if (!user || user.email_verified) {
            return res.json({ message: 'Se o e-mail existir e ainda não tiver sido confirmado, enviaremos um novo link.' });
        }

        await createAndSendVerification(db, user);

        res.json({ message: 'Se o e-mail existir e ainda não tiver sido confirmado, enviaremos um novo link.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao reenviar confirmação' });
    }
});


// ===============================
// FORGOT PASSWORD (sem mudanças)
// ===============================
router.post('/forgot-password', async (req, res) => {
    try {
        const db = await dbPromise;
        const { email } = req.body;

        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.json({ message: 'Se o e-mail existir, enviaremos instruções.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

        await db.run(`
            INSERT INTO password_resets (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `, [user.id, token, expiresAt.toISOString()]);

        await sendPasswordResetEmail(user, token);

        res.json({ message: 'Verifique sua caixa de entrada.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar recuperação de senha' });
    }
});

// ===============================
// RESET PASSWORD (sem mudanças)
// ===============================
router.post('/reset-password', async (req, res) => {
    try {
        const db = await dbPromise;
        const { token, password } = req.body;

        if (!token) return res.status(400).json({ error: 'Token inválido' });
        if (!password) return res.status(400).json({ error: 'Senha obrigatória' });

        const reset = await db.get(`
            SELECT * FROM password_resets WHERE token = ? AND used = 0
        `, [token]);

        if (!reset) return res.status(400).json({ error: 'Token inválido ou já utilizado' });
        if (new Date(reset.expires_at) < new Date()) return res.status(400).json({ error: 'Token expirado' });

        const hash = await bcrypt.hash(password, 10);

        await db.run(`
            UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [hash, reset.user_id]);

        await db.run(`UPDATE password_resets SET used = 1 WHERE id = ?`, [reset.id]);

        res.json({ success: true, message: 'Senha redefinida com sucesso' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
});

module.exports = router;