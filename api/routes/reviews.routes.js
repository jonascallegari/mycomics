const express = require('express');
const dbPromise = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();

/**
 * ============================
 * CRIAR OU ATUALIZAR REVIEW (UPSERT COMPLETO)
 * ============================
 */
router.post('/', auth, async (req, res) => {
    const db = await dbPromise;

    try {
        const { comic_id, rating, comment } = req.body;
        const userId = req.user.id;

        if (!comic_id || !rating) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        await db.run(
            `
            INSERT INTO reviews (user_id, comic_id, rating, comment)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, comic_id) DO UPDATE SET
                rating = excluded.rating,
                comment = excluded.comment,
                updated_at = CURRENT_TIMESTAMP
            `,
            [userId, comic_id, rating, comment || null]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar avaliação' });
    }
});


/**
 * ============================
 * LISTAR REVIEWS DE UM QUADRINHO (PAGINADO)
 * ============================
 */
router.get('/comic/:comicId', async (req, res) => {
    const db = await dbPromise;

    try {
        const { comicId } = req.params;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const countResult = await db.get(
            `SELECT COUNT(*) as total FROM reviews WHERE comic_id = ?`,
            [comicId]
        );

        const rows = await db.all(
            `
            SELECT
              r.id,
              r.rating,
              r.comment,
              r.created_at,
              u.username,
              u.avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.comic_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
            `,
            [comicId, limit, offset]
        );

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reviews' });
    }
});


/**
 * ============================
 * MÉDIA DE AVALIAÇÕES DO QUADRINHO
 * ============================
 */
router.get('/comic/:comicId/average', async (req, res) => {
    const db = await dbPromise;

    try {
        const { comicId } = req.params;

        const row = await db.get(
            `
            SELECT
                ROUND(AVG(rating), 1) as average,
                COUNT(*) as total
            FROM reviews
            WHERE comic_id = ?
            `,
            [comicId]
        );

        res.json(row);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao calcular média' });
    }
});


/**
 * ============================
 * REVIEW DO USUÁRIO LOGADO PARA O QUADRINHO
 * ============================
 */
router.get('/comic/:comicId/me', auth, async (req, res) => {
    const db = await dbPromise;

    try {
        const { comicId } = req.params;
        const userId = req.user.id;

        const row = await db.get(
            `
            SELECT * FROM reviews
            WHERE comic_id = ? AND user_id = ?
            `,
            [comicId, userId]
        );

        res.json(row || null);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar review' });
    }
});


/**
 * ============================
 * LISTAR REVIEWS DO USUÁRIO LOGADO (PAGINADO)
 * ============================
 */
router.get('/me', auth, async (req, res) => {
    const db = await dbPromise;

    try {
        const userId = req.user.id;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const countResult = await db.get(
            `SELECT COUNT(*) as total FROM reviews WHERE user_id = ?`,
            [userId]
        );

        const rows = await db.all(
            `
            SELECT
              r.id,
              r.rating,
              r.comment,
              r.created_at,
              c.id as comic_id,
              c.title as comic_title,
              c.cover as comic_cover
            FROM reviews r
            JOIN comics c ON r.comic_id = c.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
            `,
            [userId, limit, offset]
        );

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reviews' });
    }
});


/**
 * ============================
 * UPSERT SIMPLIFICADO (SÓ RATING)
 * ============================
 */
router.post('/upsert', auth, async (req, res) => {
    const db = await dbPromise;

    try {
        const userId = req.user.id;
        const { comic_id, rating } = req.body;

        if (!comic_id || !rating) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const existing = await db.get(
            `SELECT id FROM reviews WHERE user_id = ? AND comic_id = ?`,
            [userId, comic_id]
        );

        if (existing) {
            await db.run(
                `UPDATE reviews SET rating = ? WHERE id = ?`,
                [rating, existing.id]
            );
            return res.json({ updated: true });
        }

        await db.run(
            `INSERT INTO reviews (user_id, comic_id, rating)
             VALUES (?, ?, ?)`,
            [userId, comic_id, rating]
        );

        res.json({ created: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar review' });
    }
});


/**
 * ============================
 * REMOVER REVIEW
 * ============================
 */
router.delete('/:id', auth, async (req, res) => {
    const db = await dbPromise;

    try {
        const userId = req.user.id;
        const reviewId = req.params.id;

        await db.run(
            `
            DELETE FROM reviews
            WHERE id = ? AND user_id = ?
            `,
            [reviewId, userId]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Erro ao remover avaliação'
        });
    }
});

module.exports = router;