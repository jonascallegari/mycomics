const express = require('express');
const dbPromise = require('../database/db');

const router = express.Router();


// ============================
// 📊 ESTATÍSTICAS PÚBLICAS
// ============================
router.get('/:username/stats', async (req, res) => {
    const { username } = req.params;

    try {
        const db = await dbPromise;

        // 1️⃣ Buscar usuário
        const user = await db.get(
            `
            SELECT id, username
            FROM users
            WHERE username = ?
            `,
            [username]
        );

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const userId = user.id;
        const stats = {};

        // =========================
        // 📚 Coleção
        // =========================
        const collection = await db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Lido' THEN 1 ELSE 0 END) as total_read,
                SUM(CASE WHEN status = 'Quero ler' THEN 1 ELSE 0 END) as total_wishlist,
                AVG(rating) as average_rating
            FROM user_comics
            WHERE user_id = ?
        `, [userId]);

        const total = collection.total || 0;
        const totalRead = collection.total_read || 0;

        stats.collection = {
            total,
            read: totalRead,
            wishlist: collection.total_wishlist || 0,
            average_rating: collection.average_rating
                ? Number(collection.average_rating.toFixed(2))
                : 0,
            completion_percentage: total
                ? Math.round((totalRead / total) * 100)
                : 0
        };

        // =========================
        // 🏢 Top Publishers
        // =========================
        stats.top_publishers = await db.all(`
            SELECT p.name, COUNT(*) as total
            FROM user_comics uc
            JOIN comics c ON uc.comic_id = c.id
            JOIN publishers p ON c.publisher_id = p.id
            WHERE uc.user_id = ?
            GROUP BY p.id
            ORDER BY total DESC
            LIMIT 5
        `, [userId]);

        // =========================
        // 📆 Atividade por ano
        // =========================
        stats.activity_by_year = await db.all(`
            SELECT strftime('%Y', added_at) as year,
                   COUNT(*) as total
            FROM user_comics
            WHERE user_id = ?
            GROUP BY year
            ORDER BY year
        `, [userId]);

        // =========================
        // 🦸 Personagens mais presentes
        // =========================
        stats.top_characters = await db.all(`
    SELECT 
        ch.id,
        ch.name,
        ch.image,
        COUNT(DISTINCT uc.comic_id) as total
    FROM user_comics uc
    INNER JOIN stories s 
        ON s.comic_id = uc.comic_id
    INNER JOIN story_characters sc 
        ON sc.story_id = s.id
    INNER JOIN characters ch 
        ON ch.id = sc.character_id
    WHERE uc.user_id = ?
    GROUP BY ch.id
    ORDER BY total DESC
    LIMIT 5
`, [userId]);

        // =========================
        // 🎭 Gêneros favoritos
        // =========================
        stats.top_genres = await db.all(`
            SELECT c.genre, COUNT(*) as total
            FROM user_comics uc
            JOIN comics c ON c.id = uc.comic_id
            WHERE uc.user_id = ?
            AND c.genre IS NOT NULL
            GROUP BY c.genre
            ORDER BY total DESC
            LIMIT 5
        `, [userId]);

        // =========================
        // ✍️ Criadores mais lidos
        // =========================
        stats.top_creators = await db.all(`
    SELECT 
        cr.id,
        cr.name,
        cr.image,
        cr.role,
        COUNT(DISTINCT uc.comic_id) as total
    FROM user_comics uc
    INNER JOIN stories s 
        ON s.comic_id = uc.comic_id
    INNER JOIN story_creators sc 
        ON sc.story_id = s.id
    INNER JOIN creators cr 
        ON cr.id = sc.creator_id
    WHERE uc.user_id = ?
    GROUP BY cr.id
    ORDER BY total DESC
    LIMIT 5
`, [userId]);

        // =========================
        // 📊 Distribuição por status
        // =========================
        stats.status_distribution = await db.all(`
            SELECT status, COUNT(*) as total
            FROM user_comics
            WHERE user_id = ?
            GROUP BY status
        `, [userId]);

        res.json(stats);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar estatísticas' });
    }
});

// ============================
// 👤 PERFIL PÚBLICO (USERNAME)
// ============================
router.get('/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const db = await dbPromise;

        const user = await db.get(
            `
            SELECT
                u.id,
                u.username,
                u.bio,
                u.avatar,
                u.created_at,

                c.id    AS character_id,
                c.name  AS character_name,
                c.image AS character_image,

                cm.id    AS comic_id,
                cm.title AS comic_title,
                cm.cover AS comic_cover
                
            FROM users u
            LEFT JOIN characters c
                ON u.favorite_character_id = c.id
            LEFT JOIN comics cm
                ON u.favorite_comic_id = cm.id
            WHERE u.username = ?
            `,
            [username]
        );

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(user);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar perfil' });
    }
});

module.exports = router;
