const express = require('express');
const dbPromise = require('../database/db');

const router = express.Router();


// 🔓 LISTA PÚBLICA DE QUADRINHOS
router.get('/comics', async (req, res) => {
    try {
        const db = await dbPromise;
        

        const { publisher, year, sort, order, limit } = req.query;

        let where = [];
        let params = [];

        if (publisher) {
            where.push('(c.publisher_id = ? OR c.original_publisher_id = ?)');
            params.push(publisher, publisher);
        }

        if (year) {
            where.push('c.year = ?');
            params.push(year);
        }

        const whereClause = where.length
            ? 'WHERE ' + where.join(' AND ')
            : '';

        let orderBy = 'c.title ASC';

        if (sort) {
            switch (sort) {
                case 'title_desc': orderBy = 'c.title DESC'; break;
                case 'year_desc': orderBy = 'c.year DESC'; break;
                case 'year_asc': orderBy = 'c.year ASC'; break;
                case 'title_asc': orderBy = 'c.title ASC'; break;
            }
        }

        if (order === 'recent') orderBy = 'c.id DESC';
        if (order === 'oldest') orderBy = 'c.id ASC';
        if (order === 'rating') orderBy = 'average_rating DESC';
        if (order === 'popular') orderBy = 'rating_count DESC';

        let limitClause = '';
        if (limit) {
            limitClause = 'LIMIT ?';
            params.push(parseInt(limit));
        }
        

        const sql = `
            SELECT
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number,
                c.publisher_id,
                p.name AS publisher_name,
                op.id   AS original_publisher_id,
                op.name AS original_publisher_name,
                CASE
                    WHEN c.issue_number IS NULL
                    THEN 'Edição Única'
                    ELSE '#' || c.issue_number
                END AS display_issue,
                ROUND(AVG(rv.rating), 1) AS average_rating,
                COUNT(rv.id) AS rating_count
            FROM comics c
            LEFT JOIN publishers p ON p.id = c.publisher_id
            LEFT JOIN publishers op ON op.id = c.original_publisher_id
            LEFT JOIN reviews rv ON rv.comic_id = c.id
                AND rv.rating IS NOT NULL
            ${whereClause}
            GROUP BY c.id
            ORDER BY ${orderBy}
            ${limitClause}
        `;

        const rows = await db.all(sql, params);

        res.json({ data: rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar quadrinhos' });
    }
});


// 🔓 LISTA PÚBLICA DE EDITORAS
router.get('/publishers', async (req, res) => {
    try {
        const db = await dbPromise;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        const params = [];
        let where = 'WHERE 1 = 1';

        if (search) {
            where += ' AND p.name LIKE ?';
            params.push(`%${search}%`);
        }

        const countRow = await db.get(`
            SELECT COUNT(*) AS total
            FROM publishers p
            ${where}
        `, params);

        const rows = await db.all(`
            SELECT 
                p.id,
                p.name,
                p.logo,
                COUNT(c.id) AS total_comics
            FROM publishers p
            LEFT JOIN comics c ON c.publisher_id = p.id
            ${where}
            GROUP BY p.id
            ORDER BY p.name ASC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total: countRow.total,
                totalPages: Math.ceil(countRow.total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar editoras' });
    }
});


// 🔓 LISTA PÚBLICA DE PERSONAGENS
router.get('/characters', async (req, res) => {
    try {
        const db = await dbPromise;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const publisher = req.query.publisher || null;
        const letter = req.query.letter || null;

        const offset = (page - 1) * limit;

        let where = 'WHERE 1 = 1';
        const params = [];

        // 🔍 busca
        if (search) {
            where += ' AND (c.name LIKE ? OR c.alias LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // 🏢 editora
        if (publisher) {
            where += ' AND c.publisher_id = ?';
            params.push(publisher);
        }

        // 🔤 filtro por letra (USANDO APENAS ALIAS)
        if (letter) {
            where += ' AND c.alias IS NOT NULL AND LOWER(c.alias) LIKE LOWER(?)';
            params.push(`${letter}%`);
        }

        const countRow = await db.get(`
            SELECT COUNT(*) AS total
            FROM characters c
            ${where}
        `, params);

        const rows = await db.all(`
            SELECT 
                c.id,
                c.name,
                c.alias,
                c.image,
                p.name AS publisher_name
            FROM characters c
            LEFT JOIN publishers p ON p.id = c.publisher_id
            ${where}
            ORDER BY c.alias ASC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total: countRow.total,
                totalPages: Math.ceil(countRow.total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar personagens' });
    }
});


// 🔓 LISTA PÚBLICA DE CRIADORES
router.get('/creators', async (req, res) => {
    try {
        const db = await dbPromise;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const offset = (page - 1) * limit;

        let where = 'WHERE 1 = 1';
        const params = [];

        if (search) {
            where += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        if (role) {
            where += ' AND role = ?';
            params.push(role);
        }

        const countRow = await db.get(`
            SELECT COUNT(*) AS total
            FROM creators
            ${where}
        `, params);

        const rows = await db.all(`
            SELECT id, name, role, image
            FROM creators
            ${where}
            ORDER BY name ASC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total: countRow.total,
                totalPages: Math.ceil(countRow.total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar criadores' });
    }
});


// 🔎 BUSCA GLOBAL
router.get('/search', async (req, res) => {
    try {
        const db = await dbPromise;
        const q = req.query.q;

        if (!q) {
            return res.json({
                comics: [],
                characters: [],
                creators: []
            });
        }

        const search = `%${q}%`;

        const comics = await db.all(`
            SELECT id, title, year, cover
            FROM comics
            WHERE title LIKE ?
            LIMIT 5
        `, [search]);

        const characters = await db.all(`
            SELECT id, alias
            FROM characters
            WHERE alias LIKE ?
            LIMIT 5
        `, [search]);

        const creators = await db.all(`
            SELECT id, name
            FROM creators
            WHERE name LIKE ?
            LIMIT 5
        `, [search]);

        res.json({ comics, characters, creators });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro na busca global' });
    }
});

// ======================================
// HOME
// ======================================
router.get('/home', async (req, res) => {

    try {

        const db = await dbPromise;

        // ===============================
        // DESTAQUES
        // ===============================
        const featured = await db.all(`
            SELECT
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number,
                c.description,
                p.name AS publisher_name,

                ROUND(AVG(r.rating),1) AS average_rating,
                COUNT(r.id) AS rating_count

            FROM comics c

            LEFT JOIN publishers p
                ON p.id = c.publisher_id

            LEFT JOIN reviews r
                ON r.comic_id = c.id
                AND r.rating IS NOT NULL

            GROUP BY c.id

            ORDER BY c.id DESC

            LIMIT 8
        `);

        // ===============================
        // POPULARES
        // ===============================
        const popular = await db.all(`
            SELECT
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number,

                ROUND(AVG(r.rating),1) AS average_rating,
                COUNT(r.id) AS rating_count

            FROM comics c

            LEFT JOIN reviews r
                ON r.comic_id = c.id
                AND r.rating IS NOT NULL

            GROUP BY c.id

            ORDER BY rating_count DESC

            LIMIT 12
        `);

        // ===============================
        // MAIS BEM AVALIADOS
        // ===============================
        const top = await db.all(`
            SELECT
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number,

                ROUND(AVG(r.rating),1) AS average_rating,
                COUNT(r.id) AS rating_count

            FROM comics c

            LEFT JOIN reviews r
                ON r.comic_id = c.id
                AND r.rating IS NOT NULL

            GROUP BY c.id

            ORDER BY average_rating DESC,
                     rating_count DESC

            LIMIT 12
        `);

        // ===============================
        // RECENTES
        // ===============================
        const recent = await db.all(`
            SELECT
                c.id,
                c.title,
                c.cover,
                c.year,
                c.issue_number,

                ROUND(AVG(r.rating),1) AS average_rating,
                COUNT(r.id) AS rating_count

            FROM comics c

            LEFT JOIN reviews r
                ON r.comic_id = c.id
                AND r.rating IS NOT NULL

            GROUP BY c.id

            ORDER BY c.id DESC

            LIMIT 12
        `);

        // ===============================
        // PERSONAGENS
        // ===============================
        const characters = await db.all(`
            SELECT
                c.id,
                c.alias,
                c.name,
                c.image,
                p.name AS publisher_name

            FROM characters c

            LEFT JOIN publishers p
                ON p.id = c.publisher_id

            ORDER BY c.alias

            LIMIT 12
        `);

        res.json({

            featured,

            popular,

            top,

            recent,

            characters

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: 'Erro ao carregar Home'

        });

    }

});

module.exports = router;