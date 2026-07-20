const dbPromise = require('../database/db');

async function getHomeData() {

    const db = await dbPromise;

    // ===============================
    // DESTAQUES
    // ===============================
    const featured = await db.all(`
        SELECT
            c.id,
            c.title,
            c.slug,
            c.cover,
            c.year,
            c.issue_number,
            c.synopsis,
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
            c.slug,
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
            c.slug,
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
            c.slug,
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
            c.slug,
            c.image,
            p.name AS publisher_name

        FROM characters c

        LEFT JOIN publishers p
            ON p.id = c.publisher_id

        ORDER BY c.alias

        LIMIT 12
    `);

    return {

        featured,

        popular,

        top,

        recent,

        characters

    };

}

module.exports = {

    getHomeData

};