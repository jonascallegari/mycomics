// services/publisher.service.js
const dbPromise = require('../database/db');
const { extractId } = require('../utils/slug');

async function findBySlug(slug) {
    const id = extractId(slug);
    if (!id) return null;

    const db = await dbPromise;

    const publisher = await db.get(`SELECT * FROM publishers WHERE id = ?`, [id]);
    if (!publisher) return null;

    const comics = await db.all(`
        SELECT id, title, year, issue_number, cover
        FROM comics
        WHERE publisher_id = ? OR original_publisher_id = ?
        ORDER BY year DESC, title ASC
    `, [id, id]);

    return { ...publisher, comics };
}

module.exports = { findBySlug };