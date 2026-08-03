// services/comic.service.js
const dbPromise = require('../database/db');
const { extractId } = require('../utils/slug');

function formatIssue(comic) {
    if (comic.publication_type === 'one_shot') return 'Edição Única';
    return comic.issue_number ? `#${comic.issue_number}` : '';
}

async function findBySlug(slug) {
    const id = extractId(slug);
    if (!id) return null;

    const db = await dbPromise;

    const comic = await db.get(`
        SELECT c.*,
               s.id AS series_id, s.name AS series_name,
               p.id AS publisher_id, p.name AS publisher_name,
               op.id AS original_publisher_id, op.name AS original_publisher_name,
               ROUND(AVG(rv.rating), 1) AS average_rating,
               COUNT(rv.id) AS rating_count
        FROM comics c
        LEFT JOIN series s ON s.id = c.series_id
        LEFT JOIN publishers p ON p.id = c.publisher_id
        LEFT JOIN publishers op ON op.id = c.original_publisher_id
        LEFT JOIN reviews rv ON rv.comic_id = c.id AND rv.rating IS NOT NULL
        WHERE c.id = ?
        GROUP BY c.id
    `, [id]);

    if (!comic) return null;

    comic.display_issue = formatIssue(comic);

    const stories = await db.all(`SELECT id, title FROM stories WHERE comic_id = ?`, [id]);

    for (const story of stories) {
        story.characters = await db.all(`
            SELECT c.id, c.name, c.image, c.alias
            FROM characters c
            JOIN story_characters sc ON sc.character_id = c.id
            WHERE sc.story_id = ?
        `, [story.id]);

        story.creators = await db.all(`
            SELECT c.id, c.name, c.image, c.role
            FROM creators c
            JOIN story_creators sc ON sc.creator_id = c.id
            WHERE sc.story_id = ?
        `, [story.id]);
    }

    const arcs = await db.all(`
        SELECT a.id, a.name
        FROM story_arcs a
        JOIN story_arc_comics sac ON sac.arc_id = a.id
        WHERE sac.comic_id = ?
        ORDER BY a.name
    `, [id]);

    // Dedup — mesmo critério do comicDetail.js (Map por id, através de todas as histórias)
    const charactersMap = new Map();
    const creatorsMap = new Map();

    stories.forEach(story => {
        story.characters.forEach(c => { if (!charactersMap.has(c.id)) charactersMap.set(c.id, c); });
        story.creators.forEach(c => { if (!creatorsMap.has(c.id)) creatorsMap.set(c.id, c); });
    });

    return {
        ...comic,
        stories,
        arcs: arcs || [],
        characters: [...charactersMap.values()],
        creators: [...creatorsMap.values()]
    };
}

module.exports = { findBySlug };