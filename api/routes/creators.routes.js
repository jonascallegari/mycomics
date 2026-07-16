const express = require('express');
const dbPromise = require('../database/db');
const auth = require('../middlewares/auth');
const permission = require('../middlewares/permission');
const upload = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');
const processImage = require('../utils/imageProcessor');

const router = express.Router();

/**
 * ============================
 * CRIAR CRIADOR
 * ============================
 */
router.post(
    '/',
    auth,
    permission('creator:create'),
    upload.single('image'),
    async (req, res) => {

        try {

            const db = await dbPromise;

            const {
                name,
                role,
                nationality,
                birth_year,
                bio
            } = req.body;

            let imagePath = null;

            if (req.file) {
                imagePath = await processImage(req.file.buffer, {
                    folder: 'creators',
                    width: 500,
                    height: 500
                });
            }

            const result = await db.run(
                `
                INSERT INTO creators
                (name, role, bio, nationality, birth_year, image)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    name,
                    role,
                    bio,
                    nationality,
                    birth_year,
                    imagePath
                ]
            );

            res.json({
                id: result.lastID
            });

        } catch (err) {

            console.error(err);

            // 🚫 Criador já existente
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({
                    error: 'Já existe um criador com esse nome'
                });
            }

            res.status(500).json({
                error: 'Erro ao criar criador'
            });

        }
    }
);

/**
 * ============================
 * LISTAR CRIADORES (COM PAGINAÇÃO)
 * ============================
 */
router.get('/', async (req, res) => {
    try {
        const db = await dbPromise;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';

        // QUERY PRINCIPAL
        const creators = await db.all(`
            SELECT *
            FROM creators
            WHERE
                name LIKE ?
                OR role LIKE ?
            ORDER BY name
            LIMIT ? OFFSET ?
        `, [
            `%${search}%`,
            `%${search}%`,
            limit,
            offset
        ]);

        // TOTAL PARA PAGINAÇÃO
        const totalResult = await db.get(`
            SELECT COUNT(*) AS total
            FROM creators
            WHERE
                name LIKE ?
                OR role LIKE ?
        `, [
            `%${search}%`,
            `%${search}%`
        ]);

        res.json({
            data: creators,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                totalPages: Math.ceil(totalResult.total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Erro ao listar criadores'
        });
    }
});

/**
 * ============================
 * DETALHES DE UM CRIADOR
 * ============================
 */
router.get('/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;

        const creator = await db.get(
            `SELECT * FROM creators WHERE id = ?`,
            [id]
        );

        if (!creator) {
            return res.status(404).json({
                error: 'Criador não encontrado'
            });
        }

        const comics = await db.all(`
            SELECT DISTINCT
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number
            FROM comics c
            JOIN stories s ON s.comic_id = c.id
            JOIN story_creators sc ON sc.story_id = s.id
            WHERE sc.creator_id = ?
            ORDER BY c.year DESC
        `, [id]);

        res.json({
            creator,
            comics
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar criador' });
    }
});

/**
 * ============================
 * ATUALIZAR CRIADOR
 * ============================
 */
router.put(
    '/:id',
    auth,
    permission('creator:update'),
    upload.single('image'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;
            const { name, role, nationality, birth_year, bio } = req.body;

            const creator = await db.get(
                `SELECT image FROM creators WHERE id = ?`,
                [id]
            );

            if (!creator) {
                return res.status(404).json({
                    error: 'Criador não encontrado'
                });
            }

            let imagePath = creator.image;

            if (req.file) {
                if (creator.image) {
                    const oldPath = path.join(__dirname, '..', creator.image);
                    fs.unlink(oldPath, () => { });
                }

                imagePath = await processImage(req.file.buffer, {
                    folder: 'creators',
                    width: 500,
                    height: 500
                });
            }

            await db.run(`
                UPDATE creators
                SET name = ?, role = ?, bio = ?, nationality = ?, birth_year = ?, image = ?
                WHERE id = ?
            `, [
                name,
                role,
                bio,
                nationality,
                birth_year,
                imagePath,
                id
            ]);

            res.json({
                success: true,
                image: imagePath
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao atualizar criador'
            });
        }
    }
);

/**
 * ============================
 * REMOVER CRIADOR
 * ============================
 */
router.delete(
    '/:id',
    auth,
    permission('creator:delete'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;

            const result = await db.run(
                `DELETE FROM creators WHERE id = ?`,
                [id]
            );

            res.json({
                deleted: result.changes
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao remover criador'
            });
        }
    }
);

module.exports = router;