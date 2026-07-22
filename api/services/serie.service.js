// services/serie.service.js
const dbPromise = require('../database/db');
const { extractId } = require('../utils/slug');

async function findBySlug(slug) {
    const id = extractId(slug);
    if (!id) return null;

    const db = await dbPromise;

    const serie = await db.get(`
        SELECT
            s.*,
            p.name  AS publisher_name,
            op.name AS original_publisher_name
        FROM series s
        LEFT JOIN publishers p  ON p.id = s.publisher_id
        LEFT JOIN publishers op ON op.id = s.original_publisher_id
        WHERE s.id = ?
    `, [id]);

    if (!serie) return null;

    const comics = await db.all(`
        SELECT c.id, c.title, c.cover, c.year, c.issue_number
        FROM comics c
        WHERE c.series_id = ?
        ORDER BY c.year, c.issue_number
    `, [id]);

    return { ...serie, comics };
}

module.exports = { findBySlug };