const express = require('express');
const db = require('../database/db');


const router = express.Router();


// Listar criadores de um quadrinho
router.get('/:comicId', (req, res) => {
    db.all(
        `SELECT creators.*, comic_creators.role FROM creators
JOIN comic_creators ON creators.id = comic_creators.creator_id
WHERE comic_creators.comic_id = ?`,
        [req.params.comicId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});


// Vincular criador ao quadrinho
router.post('/', (req, res) => {
    const { comic_id, creator_id, role } = req.body;


    db.run(
        'INSERT INTO comic_creators (comic_id, creator_id, role) VALUES (?, ?, ?)'
        , [comic_id, creator_id, role],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ id: this.lastID });
        }
    );
});


module.exports = router;