// services/creator.service.js
const dbPromise = require('../database/db');
const { extractId } = require('../utils/slug');

async function findBySlug(slug) {
    const id = extractId(slug);
    if (!id) return null;

    const db = await dbPromise;

    const creator = await db.get(`SELECT * FROM creators WHERE id = ?`, [id]);
    if (!creator) return null;

    const comics = await db.all(`
        SELECT DISTINCT
            c.id, c.title, c.cover, c.year, c.issue_number
        FROM comics c
        JOIN stories s ON s.comic_id = c.id
        JOIN story_creators sc ON sc.story_id = s.id
        WHERE sc.creator_id = ?
        ORDER BY c.year DESC
    `, [id]);

    return { ...creator, comics };
}

module.exports = { findBySlug };