const express = require('express');
const dbPromise = require('../database/db');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const router = express.Router();


// ===============================
// LISTAR USUÁRIOS
// ===============================
router.get('/users', auth, admin, async (req, res) => {
    try {
        const db = await dbPromise;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const users = await db.all(
            `
            SELECT id, username, email, role
            FROM users
            LIMIT ? OFFSET ?
            `,
            [limit, offset]
        );

        const totalResult = await db.get(
            `SELECT COUNT(*) as total FROM users`
        );

        res.json({
            data: users,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});


// ===============================
// ATUALIZAR ROLE
// ===============================
router.put('/users/:id/role', auth, admin, async (req, res) => {
    try {
        const db = await dbPromise;
        const { role } = req.body;
        const { id } = req.params;

        const result = await db.run(
            `UPDATE users SET role = ? WHERE id = ?`,
            [role, id]
        );

        res.json({
            updated: result.changes
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar role' });
    }
});


// ===============================
// DASHBOARD ADMIN
// ===============================
router.get('/dashboard', auth, admin, async (req, res) => {
    try {
        const db = await dbPromise;

        const comics = await db.get(
            `SELECT COUNT(*) AS total FROM comics`
        );

        const characters = await db.get(
            `SELECT COUNT(*) AS total FROM characters`
        );

        const creators = await db.get(
            `SELECT COUNT(*) AS total FROM creators`
        );

        const growth = await db.all(`
            SELECT 
                strftime('%m/%Y', created_at) AS month,
                COUNT(*) AS total
            FROM comics
            GROUP BY month
            ORDER BY MIN(created_at)
        `);

        res.json({
            totals: {
                comics: comics.total,
                characters: characters.total,
                creators: creators.total
            },
            growth
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no dashboard' });
    }
});


module.exports = router;