// services/arc.service.js
const dbPromise = require('../database/db');
const { extractId } = require('../utils/slug');

async function findBySlug(slug) {
    const id = extractId(slug);
    if (!id) return null;

    const db = await dbPromise;

    const arc = await db.get(`SELECT * FROM story_arcs WHERE id = ?`, [id]);
    if (!arc) return null;

    const comics = await db.all(`
        SELECT
            sac.reading_order,
            c.id, c.title, c.cover, c.year, c.issue_number,
            s.name as series_name
        FROM story_arc_comics sac
        JOIN comics c ON c.id = sac.comic_id
        LEFT JOIN series s ON s.id = c.series_id
        WHERE sac.arc_id = ?
        ORDER BY sac.reading_order
    `, [id]);

    return { ...arc, comics };
}

module.exports = { findBySlug };