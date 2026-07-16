const express = require('express');
const dbPromise = require('../database/db');
const auth = require('../middlewares/auth');
const permission = require('../middlewares/permission');
const upload = require('../middlewares/uploadPublisher');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * ============================
 * CRIAR EDITORA
 * ============================
 */
router.post(
    '/',
    auth,
    permission('publisher:create'),
    upload.single('logo'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { name, description, website } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nome obrigatório' });
            }

            const logoPath = req.file
                ? `/uploads/publishers/${req.file.filename}`
                : null;

            const result = await db.run(`
                INSERT INTO publishers
                (name, logo, description, website)
                VALUES (?, ?, ?, ?)
            `, [name, logoPath, description, website]);

            res.json({ id: result.lastID });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao criar editora' });
        }
    }
);

/**
 * ============================
 * LISTAR EDITORAS
 * ============================
 */
router.get('/', async (req, res) => {
    try {
        const db = await dbPromise;

        const publishers = await db.all(`
            SELECT id, name, logo, website
            FROM publishers
            ORDER BY name
        `);

        res.json(publishers);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar editoras' });
    }
});

/**
 * ============================
 * DETALHES
 * ============================
 */
router.get('/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;

        const publisher = await db.get(
            `SELECT * FROM publishers WHERE id = ?`,
            [id]
        );

        if (!publisher) {
            return res.status(404).json({
                error: 'Editora não encontrada'
            });
        }

        const comics = await db.all(`
            SELECT
                id,
                title,
                year,
                issue_number,
                cover
            FROM comics
            WHERE publisher_id = ?
            OR original_publisher_id = ?
            ORDER BY year DESC, title ASC
        `, [id, id]);

        res.json({
            publisher,
            comics
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar editora' });
    }
});

/**
 * ============================
 * ATUALIZAR
 * ============================
 */
router.put(
    '/:id',
    auth,
    permission('publisher:update'),
    upload.single('logo'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { name, description, website } = req.body;
            const { id } = req.params;

            const publisher = await db.get(
                `SELECT logo FROM publishers WHERE id = ?`,
                [id]
            );

            if (!publisher) {
                return res.status(404).json({
                    error: 'Editora não encontrada'
                });
            }

            let logoPath = publisher.logo;

            if (req.file) {
                if (publisher.logo) {
                    fs.unlink(
                        path.join(__dirname, '..', publisher.logo),
                        () => { }
                    );
                }

                logoPath = `/uploads/publishers/${req.file.filename}`;
            }

            const result = await db.run(`
                UPDATE publishers
                SET name = ?, logo = ?, description = ?, website = ?
                WHERE id = ?
            `, [name, logoPath, description, website, id]);

            res.json({ updated: result.changes });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao atualizar editora'
            });
        }
    }
);

/**
 * ============================
 * EXCLUIR
 * ============================
 */
router.delete(
    '/:id',
    auth,
    permission('publisher:delete'),
    async (req, res) => {
        try {
            const db = await dbPromise;
            const { id } = req.params;

            const publisher = await db.get(
                `SELECT logo FROM publishers WHERE id = ?`,
                [id]
            );

            if (!publisher) {
                return res.status(404).json({
                    error: 'Editora não encontrada'
                });
            }

            if (publisher.logo) {
                fs.unlink(
                    path.join(__dirname, '..', publisher.logo),
                    () => { }
                );
            }

            const result = await db.run(
                `DELETE FROM publishers WHERE id = ?`,
                [id]
            );

            res.json({ deleted: result.changes });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao excluir editora'
            });
        }
    }
);

module.exports = router;