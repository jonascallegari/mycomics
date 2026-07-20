// services/character.service.js
const dbPromise = require('../database/db');
const { extractId } = require('../utils/slug');

async function findBySlug(slug) {
    const id = extractId(slug);
    if (!id) return null;

    const db = await dbPromise;

    const character = await db.get(`
        SELECT 
            c.*,
            p.name AS publisher_name
        FROM characters c
        LEFT JOIN publishers p ON p.id = c.publisher_id
        WHERE c.id = ?
    `, [id]);

    if (!character) return null;

    const comics = await db.all(`
        SELECT DISTINCT
            c.id, c.title, c.cover, c.year, c.issue_number
        FROM comics c
        JOIN stories s ON s.comic_id = c.id
        JOIN story_characters sc ON sc.story_id = s.id
        WHERE sc.character_id = ?
        ORDER BY c.year DESC
    `, [id]);

    return { ...character, comics };
}

module.exports = { findBySlug };