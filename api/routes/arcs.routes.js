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
 * CRIAR ARCO
 * ============================
 */
router.post(
    '/',
    auth,
    permission('arcs:create'),
    upload.single('cover'),
    async (req, res) => {
        try {
            const db = await dbPromise;

            const { name, description, start_year, end_year } = req.body;

            if (!name) {
                return res.status(400).json({
                    error: 'Nome do arco é obrigatório'
                });
            }

            let coverPath = null;

            if (req.file) {
                coverPath = await processCover(req.file.buffer);
            }

            const result = await db.run(
                `
                INSERT INTO story_arcs
                (name, description, start_year, end_year, cover)
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    name,
                    description || null,
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
            res.status(500).json({ error: 'Erro ao criar arco' });
        }
    }
);


/**
 * ============================
 * LISTAR TODOS OS ARCOS
 * ============================
 */
router.get('/', async (req, res) => {
    try {
        const db = await dbPromise;

        const arcs = await db.all(`
            SELECT
                a.*,
                COUNT(ac.id) as comics_count
            FROM story_arcs a
            LEFT JOIN story_arc_comics ac ON ac.arc_id = a.id
            GROUP BY a.id
            ORDER BY a.name
        `);

        res.json(arcs || []);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar arcos' });
    }
});


/**
 * ============================
 * DETALHES DE UM ARCO
 * ============================
 */
router.get('/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;

        const arc = await db.get(
            `SELECT * FROM story_arcs WHERE id = ?`,
            [id]
        );

        if (!arc) {
            return res.status(404).json({ error: 'Arco não encontrado' });
        }

        const comics = await db.all(`
            SELECT
                sac.id as link_id,
                sac.reading_order,
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number,
                s.name as series_name
            FROM story_arc_comics sac
            JOIN comics c ON c.id = sac.comic_id
            LEFT JOIN series s ON s.id = c.series_id
            WHERE sac.arc_id = ?
            ORDER BY sac.reading_order
        `, [id]);

        res.json({
            arc,
            comics: comics || []
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar arco' });
    }
});


/**
 * ============================
 * ADICIONAR QUADRINHO AO ARCO
 * ============================
 */
router.post(
    '/:id/comics',
    auth,
    permission('arcs:update'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;
            const { comic_id, reading_order } = req.body;

            const result = await db.run(`
                INSERT INTO story_arc_comics
                (arc_id, comic_id, reading_order)
                VALUES (?, ?, ?)
            `, [id, comic_id, reading_order || 0]);

            res.json({
                success: true,
                id: result.lastID
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao adicionar quadrinho ao arco' });
        }
    }
);


/**
 * ============================
 * ATUALIZAR ORDEM
 * ============================
 */
router.put(
    '/:arcId/comics/:linkId',
    auth,
    permission('arcs:update'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { arcId, linkId } = req.params;
            const { reading_order } = req.body;

            const result = await db.run(`
                UPDATE story_arc_comics
                SET reading_order = ?
                WHERE id = ? AND arc_id = ?
            `, [reading_order, linkId, arcId]);

            res.json({
                updated: result.changes
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao atualizar ordem' });
        }
    }
);


/**
 * ============================
 * REMOVER QUADRINHO DO ARCO
 * ============================
 */
router.delete(
    '/:arcId/comics/:linkId',
    auth,
    permission('arcs:update'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { arcId, linkId } = req.params;

            const result = await db.run(`
                DELETE FROM story_arc_comics
                WHERE id = ? AND arc_id = ?
            `, [linkId, arcId]);

            res.json({
                deleted: result.changes
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao remover quadrinho do arco' });
        }
    }
);


/**
 * ============================
 * ATUALIZAR ARCO
 * ============================
 */
router.put(
    '/:id',
    auth,
    permission('arcs:update'),
    upload.single('cover'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;
            const { name, description, start_year, end_year } = req.body;

            const current = await db.get(
                `SELECT cover FROM story_arcs WHERE id = ?`,
                [id]
            );

            if (!current) {
                return res.status(404).json({
                    error: 'Arco não encontrado'
                });
            }

            let coverPath = current.cover;

            if (req.file) {
                if (current.cover) {
                    const oldPath = path.join(__dirname, '..', current.cover);
                    fs.unlink(oldPath, err => {
                        if (err) console.warn(err.message);
                    });
                }

                coverPath = await processCover(req.file.buffer);
            }

            await db.run(`
                UPDATE story_arcs SET
                    name = ?,
                    description = ?,
                    start_year = ?,
                    end_year = ?,
                    cover = ?
                WHERE id = ?
            `, [
                name,
                description || null,
                start_year || null,
                end_year || null,
                coverPath,
                id
            ]);

            res.json({
                success: true,
                cover: coverPath
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao atualizar arco' });
        }
    }
);


/**
 * ============================
 * REMOVER ARCO
 * ============================
 */
router.delete(
    '/:id',
    auth,
    permission('arcs:delete'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;

            const result = await db.run(
                `DELETE FROM story_arcs WHERE id = ?`,
                [id]
            );

            res.json({
                deleted: result.changes
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao remover arco' });
        }
    }
);

module.exports = router;