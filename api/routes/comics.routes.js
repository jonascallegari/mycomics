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
 * =====================================
 * UTIL
 * =====================================
 */

function formatIssue(comic) {
    if (comic.publication_type === 'one_shot') {
        return 'Edição Única';
    }

    return comic.issue_number ? `#${comic.issue_number}` : '';
}

/**
 * ============================
 * CRIAR LINK DE COMPRA
 * ============================
 */
// POST /api/comics/:id/buy-links
router.post('/:id/buy-links', auth, async (req, res) => {
  try {
    const db = await dbPromise;
    const comicId = req.params.id;

    const { store_name, url } = req.body;

    console.log('BODY RECEBIDO:', req.body);

    // 🔒 validação básica
    if (!store_name || !url) {
      return res.status(400).json({
        error: 'store_name e url são obrigatórios'
      });
    }

    // 🧠 VALIDAÇÃO DO QUADRINHO (AQUI 👇)
    const comicExists = await db.get(
      'SELECT id FROM comics WHERE id = ?',
      [comicId]
    );

    if (!comicExists) {
      return res.status(400).json({
        error: 'Quadrinho não existe'
      });
    }

    // 💾 INSERT
    await db.run(`
      INSERT INTO comic_links (comic_id, store_name, url)
      VALUES (?, ?, ?)
    `, [comicId, store_name, url]);

    res.json({ success: true });

  } catch (err) {
    console.error('ERRO AO INSERIR LINK:', err.message);
    res.status(500).json({ error: 'Erro ao criar link de compra' });
  }
});

/**
 * ============================
 * LISTAR LINKS DE COMPRA
 * ============================
 */
// GET /api/comics/:id/buy-links
router.get('/:id/buy-links', async (req, res) => {
  try {
    const db = await dbPromise;
    const comicId = req.params.id;

    const links = await db.all(`
      SELECT id, store_name, url
      FROM comic_links
      WHERE comic_id = ?
    `, [comicId]);

    res.json(Array.isArray(links) ? links : []);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar links' });
  }
});

/**
 * ============================
 * ATUALIZAR LINKS DE COMPRA
 * ============================
 */
// PUT /api/comics/buy-links/:id
router.put('/buy-links/:id', auth, async (req, res) => {
  try {
    const db = await dbPromise;
    const id = req.params.id;

    const { store_name, url } = req.body;

    await db.run(`
      UPDATE comic_links
      SET store_name = ?, url = ?
      WHERE id = ?
    `, [store_name, url, id]);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar link' });
  }
});

// DELETE /api/comics/buy-links/:id
router.delete('/buy-links/:id', auth, async (req, res) => {
  try {
    const db = await dbPromise;
    const id = req.params.id;

    await db.run(`
      DELETE FROM comic_links
      WHERE id = ?
    `, [id]);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover link' });
  }
});

/**
 * ============================
 * DELETAR TODOS OS LINKS DE UM QUADRINHO
 * ============================
 */
// DELETE /api/comics/:id/buy-links
router.delete('/:id/buy-links', auth, async (req, res) => {
  try {
    const db = await dbPromise;

    await db.run(`
      DELETE FROM comic_links
      WHERE comic_id = ?
    `, [req.params.id]);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover links' });
  }
});

/**
 * ============================
 * CRIAR QUADRINHO + HISTÓRIAS
 * ============================
 */
router.post(
    '/',
    auth,
    permission('comic:create'),
    upload.single('cover'),
    async (req, res) => {
        try {
            const db = await dbPromise;

            const {
                title,
                isbn,
                publisher_id,
                original_publisher_id,
                series_id,
                year,
                genre,
                pages,
                issue_number,
                publication_type = 'regular',
                cover_price,
                currency,
                synopsis
            } = req.body;

            let stories = JSON.parse(req.body.stories || '[]');

            if (!title || !publisher_id) {
                return res.status(400).json({
                    error: 'Título e editora são obrigatórios'
                });
            }

            let normalizedIssue = null;

            if (publication_type === 'regular') {
                if (!issue_number) {
                    return res.status(400).json({
                        error:
                            'Número da edição é obrigatório para publicações regulares'
                    });
                }
                normalizedIssue = issue_number;
            }

            let coverPath = null;
            if (req.file) {
                coverPath = await processCover(req.file.buffer);
            }

            if (isbn) {

            const existing = await db.get(`
                SELECT id
                FROM comics
                WHERE isbn = ?
            `, [isbn]);

            if (existing) {
                return res.status(400).json({
                    error: 'Já existe um quadrinho cadastrado com este ISBN'
                });
            }

        }

            const result = await db.run(
                `
        INSERT INTO comics
        (title, isbn, publisher_id, original_publisher_id, series_id,
         year, genre, issue_number, publication_type,
         cover, pages, cover_price, currency, synopsis, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
                [
                    title,
                    isbn || null,
                    publisher_id,
                    original_publisher_id,
                    series_id || null,
                    year,
                    genre,
                    normalizedIssue,
                    publication_type,
                    coverPath,
                    pages,
                    cover_price,
                    currency || 'BRL',
                    synopsis
                ]
            );

            const comicId = result.lastID;

            for (const story of stories) {
                if (!story.title) continue;

                const storyResult = await db.run(
                    'INSERT INTO stories (comic_id, title) VALUES (?, ?)',
                    [comicId, story.title]
                );

                const storyId = storyResult.lastID;

                if (Array.isArray(story.characters)) {
                    for (const charId of story.characters) {
                        await db.run(
                            'INSERT INTO story_characters (story_id, character_id) VALUES (?, ?)',
                            [storyId, charId]
                        );
                    }
                }

                if (Array.isArray(story.creators)) {
                    for (const creatorId of story.creators) {
                        await db.run(
                            'INSERT INTO story_creators (story_id, creator_id) VALUES (?, ?)',
                            [storyId, creatorId]
                        );
                    }
                }
            }

            res.json({ success: true, id: comicId, cover: coverPath });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao criar quadrinho' });
        }
    }
);


/**
 * ============================
 * LISTAR TODOS OS QUADRINHOS
 * ============================
 */
router.get('/', async (req, res) => {
    try {
        const db = await dbPromise;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const { publisher, year, sort } = req.query;

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

        let orderBy = 'c.created_at DESC'; // padrão agora = mais recentes

            switch (sort) {
                case 'title_desc': orderBy = 'c.title DESC'; break;
                case 'year_desc': orderBy = 'c.year DESC'; break;
                case 'year_asc': orderBy = 'c.year ASC'; break;
                case 'title_asc': orderBy = 'c.title ASC'; break;

                case 'recent': orderBy = 'c.created_at DESC'; break; // 👈 NOVO
                case 'oldest': orderBy = 'c.created_at ASC'; break; // 👈 NOVO

                case 'rating_desc': orderBy = 'average_rating DESC, rating_count DESC'; break;
                case 'rating_asc': orderBy = 'average_rating ASC'; break;
                case 'popular': orderBy = 'popularity_score DESC'; break;

                default: orderBy = 'c.created_at DESC'; // 👈 PADRÃO ALTERADO
            }

        const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

        // 🔢 TOTAL
        const countRow = await db.get(
            `
            SELECT COUNT(DISTINCT c.id) AS total
            FROM comics c
            LEFT JOIN reviews rv ON rv.comic_id = c.id
            ${whereClause}
            `,
            params
        );

        // 📚 DADOS PAGINADOS
        const rows = await db.all(
            `
            SELECT
                c.id,
                c.title,
                c.isbn,
                c.cover,
                c.year,
                c.issue_number,
                c.publisher_id,
                p.name AS publisher_name,
                op.id AS original_publisher_id,
                op.name AS original_publisher_name,
                CASE
                    WHEN c.issue_number IS NULL THEN 'Edição Única'
                    ELSE '#' || c.issue_number
                END AS display_issue,
                ROUND(AVG(rv.rating), 1) AS average_rating,
                COUNT(rv.id) AS rating_count,
                ROUND(
                  (
                    (COUNT(rv.id) * AVG(rv.rating)) +
                    (5 * (SELECT AVG(rating) FROM reviews WHERE rating IS NOT NULL))
                  ) / (COUNT(rv.id) + 5),
                2) AS popularity_score
            FROM comics c
            LEFT JOIN publishers p ON p.id = c.publisher_id
            LEFT JOIN publishers op ON op.id = c.original_publisher_id
            LEFT JOIN reviews rv ON rv.comic_id = c.id AND rv.rating IS NOT NULL
            ${whereClause}
            GROUP BY c.id
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
            `,
            [...params, limit, offset]
        );

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
        res.status(500).json(err);
    }
});


router.post(
    '/bulk',
    auth,
    permission('comic:create'),
    async (req, res) => {

        try {
            const db = await dbPromise;

            const {
                title,
                series_id,
                publisher_id,
                original_publisher_id,
                year,
                start,
                end
            } = req.body;

            if (!title || !series_id || !publisher_id || !start || !end) {
                return res.status(400).json({
                    error: 'Dados obrigatórios faltando'
                });
            }

            if (end < start) {
                return res.status(400).json({
                    error: 'Intervalo inválido'
                });
            }

            const comics = [];

            for (let i = start; i <= end; i++) {
                comics.push([
                    title,
                    publisher_id,
                    original_publisher_id || null,
                    series_id,
                    year || null,
                    i // issue_number
                ]);
            }

            const stmt = `
                INSERT INTO comics
                (title, publisher_id, original_publisher_id, series_id, year, issue_number, publication_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'regular', datetime('now'))
            `;

            await db.exec('BEGIN TRANSACTION');

            try {
                for (const comic of comics) {
                    await db.run(stmt, comic);
                }

                await db.exec('COMMIT');

            } catch (err) {
                await db.exec('ROLLBACK');
                throw err;
            }

            res.json({
                success: true,
                total: comics.length
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao criar em lote' });
        }
    }
);

/**
 * ============================
 * DETALHES DE UM QUADRINHO
 * ============================
 */
router.get('/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        const comicId = req.params.id;

        const comic = await db.get(
            `
      SELECT c.*,
             s.id AS series_id,
             s.name AS series_name,
             p.id AS publisher_id,
             p.name AS publisher_name,
             op.id AS original_publisher_id,
             op.name AS original_publisher_name
      FROM comics c
      LEFT JOIN series s ON s.id = c.series_id
      LEFT JOIN publishers p ON p.id = c.publisher_id
      LEFT JOIN publishers op ON op.id = c.original_publisher_id
      WHERE c.id = ?
      `,
            [comicId]
        );

        if (!comic) {
            return res.status(404).json({ error: 'Quadrinho não encontrado' });
        }

        comic.display_issue = formatIssue(comic);

        const stories = await db.all(
            `SELECT id, title FROM stories WHERE comic_id = ?`,
            [comicId]
        );

        for (const story of stories) {
            story.characters = await db.all(
                `
        SELECT c.id, c.name, c.image, c.alias
        FROM characters c
        JOIN story_characters sc ON sc.character_id = c.id
        WHERE sc.story_id = ?
        `,
                [story.id]
            );

            story.creators = await db.all(
                `
        SELECT c.id, c.name, c.image, c.role
        FROM creators c
        JOIN story_creators sc ON sc.creator_id = c.id
        WHERE sc.story_id = ?
        `,
                [story.id]
            );
        }

        let moreFromSeries = [];

        if (comic.series_id) {
            moreFromSeries = await db.all(
                `
        SELECT id, title, issue_number, publication_type, cover
        FROM comics
        WHERE series_id = ? AND id != ?
        ORDER BY issue_number IS NULL, issue_number ASC
        `,
                [comic.series_id, comic.id]
            );
        }

        const arcs = await db.all(
            `
      SELECT a.id, a.name
      FROM story_arcs a
      JOIN story_arc_comics sac ON sac.arc_id = a.id
      WHERE sac.comic_id = ?
      ORDER BY a.name
      `,
            [comicId]
        );

        moreFromSeries = moreFromSeries.map(c => ({
            ...c,
            display_issue: formatIssue(c)
        }));

        res.json({
            comic,
            stories,
            moreFromSeries,
            arcs: arcs || []
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar quadrinho' });
    }
});

/**
 * ============================
 * HISTÓRIAS DO QUADRINHO
 * ============================
 */
router.get('/:id/stories', async (req, res) => {
    try {
        const db = await dbPromise;

        const rows = await db.all(
            'SELECT * FROM stories WHERE comic_id = ?',
            [req.params.id]
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json(err);
    }
});

router.post(
    '/:id/stories',
    auth,
    permission('comic:update'),
    async (req, res) => {
        try {
            const db = await dbPromise;

            const { title, characters = [], creators = [] } = req.body;

            if (!title || !title.trim()) {
                return res.status(400).json({ error: 'Título obrigatório' });
            }

            const result = await db.run(
                'INSERT INTO stories (comic_id, title) VALUES (?, ?)',
                [req.params.id, title.trim()]
            );

            const storyId = result.lastID;

            for (const charId of characters) {
                await db.run(
                    'INSERT INTO story_characters (story_id, character_id) VALUES (?, ?)',
                    [storyId, charId]
                );
            }

            for (const creatorId of creators) {
                await db.run(
                    'INSERT INTO story_creators (story_id, creator_id) VALUES (?, ?)',
                    [storyId, creatorId]
                );
            }

            res.json({ id: storyId });

        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar história' });
        }
    }
);

/**
 * ============================
 * ATUALIZAR QUADRINHO
 * ============================
 */
router.put(
    '/:id',
    auth,
    permission('comic:update'),
    upload.single('cover'),
    async (req, res) => {

        const db = await dbPromise;

        const {
            title,
            isbn,
            publisher_id,
            original_publisher_id,
            series_id,
            year,
            genre,
            issue_number,
            publication_type = 'regular',
            pages,
            cover_price,
            currency,
            synopsis
        } = req.body;

        const { id } = req.params;

        let normalizedIssue = null;

        if (isbn) {

            const existing = await db.get(`
                SELECT id
                FROM comics
                WHERE isbn = ?
                AND id != ?
            `, [isbn, id]);

            if (existing) {
                return res.status(400).json({
                    error: 'Este ISBN já pertence a outro quadrinho'
                });
            }

        }

        if (publication_type === 'regular') {
            if (!issue_number) {
                return res.status(400).json({
                    error: 'Número da edição é obrigatório para publicações regulares'
                });
            }
            normalizedIssue = issue_number;
        }

        try {
            // 1️⃣ Buscar quadrinho atual
            const comic = await db.get(
                'SELECT cover FROM comics WHERE id = ?',
                [id]
            );

            if (!comic) {
                return res.status(404).json({ error: 'Quadrinho não encontrado' });
            }

            let coverPath = comic.cover;

            // 2️⃣ Se nova capa foi enviada
            if (req.file) {

                if (comic.cover) {
                    const oldPath = path.join(__dirname, '..', comic.cover);
                    fs.unlink(oldPath, err => {
                        if (err) console.warn('Erro ao remover capa antiga:', err.message);
                    });
                }

                coverPath = await processCover(req.file.buffer);
            }

            // 3️⃣ Atualizar banco
            await db.run(
                `UPDATE comics SET
          title = ?,
          isbn = ?,
          publisher_id = ?,
          original_publisher_id = ?,
          series_id = ?,
          year = ?,
          genre = ?,
          issue_number = ?,
          publication_type = ?,
          pages = ?,
          cover_price = ?,
          currency = ?,
          synopsis = ?,
          cover = ?
         WHERE id = ?`,
                [
                    title,
                    isbn || null,
                    publisher_id || null,
                    original_publisher_id || null,
                    series_id || null,
                    year,
                    genre,
                    normalizedIssue,
                    publication_type,
                    pages,
                    cover_price,
                    currency || 'BRL',
                    synopsis,
                    coverPath,
                    id
                ]
            );

            res.json({ success: true, cover: coverPath });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao atualizar quadrinho' });
        }
    }
);

/**
 * ============================
 * EDITAR HISTÓRIA + PERSONAGENS + CRIADORES
 * ============================
 */
router.put(
    '/stories/:id',
    auth,
    permission('comic:update'),
    async (req, res) => {

        const db = await dbPromise;

        try {
            const { title, characters = [], creators = [] } = req.body;
            const { id } = req.params;

            if (!title || !title.trim()) {
                return res.status(400).json({ error: 'Título obrigatório' });
            }

            // 1️⃣ Atualizar título
            await db.run(
                'UPDATE stories SET title = ? WHERE id = ?',
                [title.trim(), id]
            );

            // 2️⃣ Limpar vínculos
            await db.run(
                'DELETE FROM story_characters WHERE story_id = ?',
                [id]
            );

            await db.run(
                'DELETE FROM story_creators WHERE story_id = ?',
                [id]
            );

            // 3️⃣ Inserir personagens
            for (const charId of characters) {
                await db.run(
                    'INSERT INTO story_characters (story_id, character_id) VALUES (?, ?)',
                    [id, charId]
                );
            }

            // 4️⃣ Inserir criadores
            for (const creatorId of creators) {
                await db.run(
                    'INSERT INTO story_creators (story_id, creator_id) VALUES (?, ?)',
                    [id, creatorId]
                );
            }

            res.json({ success: true });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao editar história' });
        }
    }
);


/**
 * ============================
 * REMOVER HISTÓRIA
 * ============================
 */
router.delete(
    '/stories/:id',
    auth,
    permission('comic:update'),
    async (req, res) => {

        const db = await dbPromise;
        const { id } = req.params;

        try {
            // 1️⃣ remover vínculos
            await db.run(
                'DELETE FROM story_characters WHERE story_id = ?',
                [id]
            );

            await db.run(
                'DELETE FROM story_creators WHERE story_id = ?',
                [id]
            );

            // 2️⃣ remover história
            await db.run(
                'DELETE FROM stories WHERE id = ?',
                [id]
            );

            res.json({ success: true });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao remover história' });
        }
    }
);


/**
 * ============================
 * REMOVER QUADRINHO
 * ============================
 */
router.delete(
    '/:id',
    auth,
    permission('comic:delete'),
    async (req, res) => {
        try {
            const db = await dbPromise;

            const result = await db.run(
                'DELETE FROM comics WHERE id = ?',
                [req.params.id]
            );

            res.json({ deleted: result.changes });

        } catch (err) {
            res.status(500).json(err);
        }
    }
);

module.exports = router;
