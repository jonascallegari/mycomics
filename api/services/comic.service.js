// services/comic.service.js
const dbPromise = require('../database/db');
const { extractId } = require('../utils/slug');

async function findBySlug(slug) {
    const id = extractId(slug);
    if (!id) return null;

    const db = await dbPromise;

    const comic = await db.get(`
        SELECT
            c.id,
            c.title,
            c.cover,
            c.year,
            c.issue_number,
            c.synopsis,
            c.pages,
            c.isbn,
            c.publication_type,
            p.name AS publisher_name,
            s.name AS series_name,
            CASE
                WHEN c.issue_number IS NULL
                THEN 'Edição Única'
                ELSE '#' || c.issue_number
            END AS display_issue,
            ROUND(AVG(r.rating), 1) AS average_rating,
            COUNT(r.id) AS rating_count
        FROM comics c
        LEFT JOIN publishers p ON p.id = c.publisher_id
        LEFT JOIN series s ON s.id = c.series_id
        LEFT JOIN reviews r ON r.comic_id = c.id AND r.rating IS NOT NULL
        WHERE c.id = ?
        GROUP BY c.id
    `, [id]);

    return comic || null;
}

module.exports = { findBySlug };