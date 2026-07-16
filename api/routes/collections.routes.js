const express = require('express');
const db = require('../database/db');


const router = express.Router();


// Adicionar quadrinho à coleção
router.post('/', (req, res) => {
    const { user_id, comic_id, status, rating } = req.body;


    db.run(
        'INSERT INTO user_collections (user_id, comic_id, status, rating) VALUES (?, ?, ?, ?)'
        , [user_id, comic_id, status, rating],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ id: this.lastID });
        }
    );
});


// Listar coleção do usuário
router.get('/:userId', (req, res) => {
    db.all(
        `SELECT comics.*, user_collections.status, user_collections.rating
FROM comics
JOIN user_collections ON comics.id = user_collections.comic_id
WHERE user_collections.user_id = ?`,
        [req.params.userId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});


module.exports = router;