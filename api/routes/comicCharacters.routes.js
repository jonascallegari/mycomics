const express = require('express');
const db = require('../database/db');


const router = express.Router();


// Listar personagens de um quadrinho
router.get('/:comicId', (req, res) => {
    db.all(
        `SELECT characters.* FROM characters
JOIN comic_characters ON characters.id = comic_characters.character_id
WHERE comic_characters.comic_id = ?`,
        [req.params.comicId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});


// Vincular personagem ao quadrinho
router.post('/', (req, res) => {
    const { comic_id, character_id } = req.body;


    db.run(
        'INSERT INTO comic_characters (comic_id, character_id) VALUES (?, ?)'
        , [comic_id, character_id],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ id: this.lastID });
        }
    );
});


module.exports = router;