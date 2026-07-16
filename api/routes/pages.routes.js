const express = require('express');
const path = require('path');

const router = express.Router();

const pages = path.join(__dirname, '..', 'pages');

function page(file) {
    return (req, res) => {
        res.sendFile(path.join(pages, `${file}.html`));
    };
}

router.get('/', page('index'));

router.get('/login', page('login'));

router.get('/register', page('register'));

router.get('/perfil', page('perfil'));

router.get('/editar-perfil', page('editar-perfil'));

router.get('/comics', page('comics'));

router.get('/quadrinho/:slug', page('comic'));

router.get('/characters', page('characters'));

router.get('/personagem/:slug', page('character'));

router.get('/creators', page('creators'));

router.get('/criador/:slug', page('creator'));

router.get('/publishers', page('publishers'));

router.get('/editora/:slug', page('publisher'));

router.get('/series', page('series'));

router.get('/serie/:slug', page('serie'));

router.get('/arcos', page('arcos'));

router.get('/arco/:slug', page('arco'));

router.get('/wishlist', page('wishlist'));

router.get('/my-collection', page('my-collection'));

router.get('/my-reviews', page('my-reviews'));

router.get('/search', page('search'));

module.exports = router;