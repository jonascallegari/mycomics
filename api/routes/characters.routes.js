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
 * CRIAR PERSONAGEM
 * ============================
 */
router.post(
    '/',
    auth,
    permission('character:create'),
    upload.single('image'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { name, alias, publisher_id, first_appearance, history } = req.body;

            let imagePath = null;

            if (req.file) {
                imagePath = await processImage(req.file.buffer, {
                    folder: 'characters',
                    width: 600,
                    height: 600
                });
            }

            const result = await db.run(`
                INSERT INTO characters
                (name, alias, publisher_id, first_appearance, history, image)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                name,
                alias,
                publisher_id || null,
                first_appearance,
                history,
                imagePath
            ]);

            res.json({ id: result.lastID });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao criar personagem' });
        }
    }
);


/**
 * ============================
 * LISTAR PERSONAGENS
 * ============================
 */
router.get('/', async (req, res) => {
    try {

        const db = await dbPromise;

        const search = req.query.search || '';

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const offset = (page - 1) * limit;

        const characters = await db.all(`
            SELECT
                c.id,
                c.name,
                c.alias,
                c.first_appearance,
                c.history,
                c.image,
                c.publisher_id,
                p.name AS publisher_name
            FROM characters c
            LEFT JOIN publishers p
                ON p.id = c.publisher_id
            WHERE
                c.name LIKE ?
                OR c.alias LIKE ?
            ORDER BY c.alias
            LIMIT ?
            OFFSET ?
        `, [
            `%${search}%`,
            `%${search}%`,
            limit,
            offset
        ]);

        const totalResult = await db.get(`
            SELECT COUNT(*) AS total
            FROM characters
            WHERE
                name LIKE ?
                OR alias LIKE ?
        `, [
            `%${search}%`,
            `%${search}%`
        ]);

        res.json({
            data: characters,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                totalPages: Math.ceil(
                    totalResult.total / limit
                )
            }
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Erro ao listar personagens'
        });

    }
});


/**
 * ============================
 * DETALHES DE UM PERSONAGEM
 * ============================
 */
router.get('/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;

        const character = await db.get(`
            SELECT 
                c.*,
                p.id   AS publisher_id,
                p.name AS publisher_name
            FROM characters c
            LEFT JOIN publishers p ON p.id = c.publisher_id
            WHERE c.id = ?
        `, [id]);

        if (!character) {
            return res.status(404).json({
                error: 'Personagem não encontrado'
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
            JOIN story_characters sc ON sc.story_id = s.id
            WHERE sc.character_id = ?
            ORDER BY c.year DESC
        `, [id]);

        res.json({
            character,
            comics
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar personagem' });
    }
});


/**
 * ============================
 * ATUALIZAR PERSONAGEM
 * ============================
 */
router.put(
    '/:id',
    auth,
    permission('character:update'),
    upload.single('image'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;
            const { name, alias, publisher_id, first_appearance, history } = req.body;

            const character = await db.get(
                `SELECT image FROM characters WHERE id = ?`,
                [id]
            );

            if (!character) {
                return res.status(404).json({
                    error: 'Personagem não encontrado'
                });
            }

            let imagePath = character.image;

            if (req.file) {
                if (character.image) {
                    const oldPath = path.join(__dirname, '..', character.image);
                    fs.unlink(oldPath, () => { });
                }

                imagePath = await processImage(req.file.buffer, {
                    folder: 'characters',
                    width: 600,
                    height: 600
                });
            }

            await db.run(`
                UPDATE characters
                SET name = ?, alias = ?, publisher_id = ?, first_appearance = ?, history = ?, image = ?
                WHERE id = ?
            `, [
                name,
                alias,
                publisher_id || null,
                first_appearance,
                history,
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
                error: 'Erro ao atualizar personagem'
            });
        }
    }
);


/**
 * ============================
 * REMOVER PERSONAGEM
 * ============================
 */
router.delete(
    '/:id',
    auth,
    permission('character:delete'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;

            const result = await db.run(
                `DELETE FROM characters WHERE id = ?`,
                [id]
            );

            res.json({
                deleted: result.changes
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao remover personagem'
            });
        }
    }
);


module.exports = router;