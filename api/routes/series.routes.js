const express = require('express');
const dbPromise = require('../database/db');
const auth = require('../middlewares/auth');
const permission = require('../middlewares/permission');
const upload = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');
const processCover = require('../utils/imageProcessor');

const router = express.Router();

/**
 * ============================
 * CRIAR SÉRIE
 * ============================
 */
router.post(
    '/',
    auth,
    permission('series:create'),
    upload.single('cover'),
    async (req, res) => {

        const db = await dbPromise;

        try {
            const {
                name,
                description,
                publisher_id,
                original_publisher_id,
                start_year,
                end_year
            } = req.body;

            if (!name) {
                return res.status(400).json({
                    error: 'Nome da série é obrigatório'
                });
            }

            let coverPath = null;

            if (req.file) {
                coverPath = await processCover(req.file.buffer);
            }

            const result = await db.run(
                `
                INSERT INTO series
                (name, description, publisher_id, original_publisher_id, start_year, end_year, cover)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    name,
                    description || null,
                    publisher_id || null,
                    original_publisher_id || null,
                    start_year || null,
                    end_year || null,
                    coverPath
                ]
            );

            res.json({
                success: true,
                id: result.lastID,
                cover: coverPath
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao criar série' });
        }
    }
);


/**
 * ============================
 * LISTAR TODAS AS SÉRIES
 * ============================
 */
router.get('/', async (req, res) => {

    const db = await dbPromise;

    try {
        const rows = await db.all(
            `
            SELECT
                s.*,
                p.name  AS publisher_name,
                op.name AS original_publisher_name,
                COUNT(c.id) AS comics_count
            FROM series s
            LEFT JOIN publishers p  ON p.id = s.publisher_id
            LEFT JOIN publishers op ON op.id = s.original_publisher_id
            LEFT JOIN comics c ON c.series_id = s.id
            GROUP BY s.id
            ORDER BY s.name
            `
        );

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Erro ao listar séries'
        });
    }
});


/**
 * ============================
 * DETALHES DE UMA SÉRIE
 * ============================
 */
router.get('/:id', async (req, res) => {

    const db = await dbPromise;

    try {
        const { id } = req.params;

        const series = await db.get(
            `
            SELECT
                s.*,
                p.name  AS publisher_name,
                op.name AS original_publisher_name
            FROM series s
            LEFT JOIN publishers p  ON p.id = s.publisher_id
            LEFT JOIN publishers op ON op.id = s.original_publisher_id
            WHERE s.id = ?
            `,
            [id]
        );

        if (!series) {
            return res.status(404).json({
                error: 'Série não encontrada'
            });
        }

        const comics = await db.all(
            `
            SELECT
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number
            FROM comics c
            WHERE c.series_id = ?
            ORDER BY c.year, c.issue_number
            `,
            [id]
        );

        res.json({
            series,
            comics: comics || []
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Erro ao buscar série'
        });
    }
});


/**
 * ============================
 * ATUALIZAR SÉRIE
 * ============================
 */
router.put(
    '/:id',
    auth,
    permission('series:update'),
    upload.single('cover'),
    async (req, res) => {

        const db = await dbPromise;
        const { id } = req.params;

        try {
            const {
                name,
                description,
                publisher_id,
                original_publisher_id,
                start_year,
                end_year
            } = req.body;

            const current = await db.get(
                'SELECT cover FROM series WHERE id = ?',
                [id]
            );

            if (!current) {
                return res.status(404).json({
                    error: 'Série não encontrada'
                });
            }

            let coverPath = current.cover;

            if (req.file) {

                if (current.cover) {
                    const oldPath = path.join(__dirname, '..', current.cover);
                    fs.unlink(oldPath, err => {
                        if (err) {
                            console.warn(
                                'Erro ao remover capa antiga:',
                                err.message
                            );
                        }
                    });
                }

                coverPath = await processCover(req.file.buffer);
            }

            await db.run(
                `
                UPDATE series SET
                    name = ?,
                    description = ?,
                    publisher_id = ?,
                    original_publisher_id = ?,
                    start_year = ?,
                    end_year = ?,
                    cover = ?
                WHERE id = ?
                `,
                [
                    name,
                    description || null,
                    publisher_id || null,
                    original_publisher_id || null,
                    start_year || null,
                    end_year || null,
                    coverPath,
                    id
                ]
            );

            res.json({
                success: true,
                cover: coverPath
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao atualizar série'
            });
        }
    }
);


/**
 * ============================
 * REMOVER SÉRIE
 * ============================
 */
router.delete(
    '/:id',
    auth,
    permission('series:delete'),
    async (req, res) => {

        const db = await dbPromise;
        const { id } = req.params;

        try {
            const result = await db.run(
                'DELETE FROM series WHERE id = ?',
                [id]
            );

            res.json({
                deleted: result.changes
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao remover série'
            });
        }
    }
);

module.exports = router;