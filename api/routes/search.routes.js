const express = require('express');
const db = require('../database/db');

const router = express.Router();

// 🔎 Busca global
router.get('/', (req, res) => {
    const q = req.query.q?.trim();

    if (!q) {
        return res.json({
            comics: [],
            characters: [],
            creators: []
        });
    }

    const like = `%${q}%`;

    const comicsSql = `
        SELECT 
            c.id,
            c.title,
            c.cover,
            c.year,
            p.name AS publisher_name
        FROM comics c
        LEFT JOIN publishers p ON p.id = c.publisher_id
        WHERE c.title LIKE ?
        LIMIT 10
    `;

    const charactersSql = `
        SELECT 
            id,
            name,
            alias,
            image
        FROM characters
        WHERE name LIKE ? OR alias LIKE ?
        LIMIT 10
    `;

    const creatorsSql = `
        SELECT 
            id,
            name,
            role,
            image
        FROM creators
        WHERE name LIKE ?
        LIMIT 10
    `;

    db.all(comicsSql, [like], (err, comics) => {
        if (err) return res.status(500).json(err);

        db.all(charactersSql, [like, like], (err, characters) => {
            if (err) return res.status(500).json(err);

            db.all(creatorsSql, [like], (err, creators) => {
                if (err) return res.status(500).json(err);

                res.json({
                    comics,
                    characters,
                    creators
                });
            });
        });
    });
});

module.exports = router;
