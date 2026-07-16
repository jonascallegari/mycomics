const express = require('express');
const dbPromise = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();

// 🔐 Todas as rotas exigem login
router.use(auth);


/**
 * ============================
 * VERIFICAR SE QUADRINHO ESTÁ NA COLEÇÃO
 * ============================
 */
router.get('/check/:comicId', async (req, res) => {
    const db = await dbPromise;

    try {
        const user_id = req.user.id;
        const comic_id = req.params.comicId;

        const row = await db.get(
            `SELECT status FROM user_comics
             WHERE user_id = ? AND comic_id = ?`,
            [user_id, comic_id]
        );

        res.json({
            exists: !!row,
            status: row?.status || null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao verificar coleção' });
    }
});


/**
 * ============================
 * ADICIONAR À COLEÇÃO
 * ============================
 */
router.post('/', async (req, res) => {
    const db = await dbPromise;

    try {
        const { comic_id, status, rating, notes } = req.body;
        const user_id = req.user.id;

        const result = await db.run(
            `INSERT INTO user_comics (user_id, comic_id, status, rating, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, comic_id, status, rating, notes]
        );

        res.json({ id: result.lastID });

    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({
                error: 'Este quadrinho já está na sua coleção'
            });
        }

        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar à coleção' });
    }
});


/**
 * ============================
 * LISTAR MINHA COLEÇÃO
 * ============================
 */
router.get('/', async (req, res) => {
    const db = await dbPromise;

    try {
        const user_id = req.user.id;

        const rows = await db.all(
            `
            SELECT 
              uc.*,
              c.title, 
              c.issue_number,
              c.cover,
              p.name AS publisher_name,
              r.rating AS review_rating
            FROM user_comics uc
            JOIN comics c ON c.id = uc.comic_id
            JOIN publishers p ON p.id = c.publisher_id

            LEFT JOIN (
              SELECT comic_id, user_id, rating
              FROM reviews
              WHERE id IN (
                SELECT MAX(id)
                FROM reviews
                GROUP BY comic_id, user_id
              )
            ) r 
              ON r.comic_id = uc.comic_id 
              AND r.user_id = uc.user_id

            WHERE uc.user_id = ?
            `,
            [user_id]
        );

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar coleção' });
    }
});


/**
 * ============================
 * ATUALIZAR ITEM DA COLEÇÃO
 * ============================
 */
router.put('/:id', async (req, res) => {
    const db = await dbPromise;

    try {
        const { status, rating, notes } = req.body;
        const user_id = req.user.id;
        const id = req.params.id;

        const result = await db.run(
            `UPDATE user_comics
             SET status = ?, rating = ?, notes = ?
             WHERE id = ? AND user_id = ?`,
            [status, rating, notes, id, user_id]
        );

        res.json({ updated: result.changes });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
});


/**
 * ============================
 * REMOVER DA COLEÇÃO
 * ============================
 */
router.delete('/:id', async (req, res) => {
    const db = await dbPromise;

    try {
        const user_id = req.user.id;
        const id = req.params.id;

        const result = await db.run(
            `DELETE FROM user_comics
             WHERE id = ? AND user_id = ?`,
            [id, user_id]
        );

        res.json({ deleted: result.changes });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover da coleção' });
    }
});


/**
 * ============================
 * LISTAR WISHLIST (QUERO LER)
 * ============================
 */
router.get('/wishlist', async (req, res) => {
    const db = await dbPromise;

    try {
        const user_id = req.user.id;

        const rows = await db.all(
            `
            SELECT 
              uc.*, 
              c.title,
              c.issue_number,
              p.name AS publisher_name
            FROM user_comics uc
            JOIN comics c ON c.id = uc.comic_id
            JOIN publishers p ON p.id = c.publisher_id
            WHERE uc.user_id = ? AND uc.status = 'Quero ler'
            `,
            [user_id]
        );

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar wishlist' });
    }
});


module.exports = router;