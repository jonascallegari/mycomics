const express = require('express');
const path = require('path');

const router = express.Router();

const pages = path.join(__dirname, '..', 'pages');

// pages.routes.js
const fs = require('fs');
const ComicService = require('../services/comic.service');
const { renderComicPage } = require('../utils/render-page');

const CharacterService = require('../services/character.service');
const { renderCharacterPage } = require('../utils/render-page');

const ArcService = require('../services/arc.service');
const { renderArcPage } = require('../utils/render-page');

const { makeSlug } = require('../utils/slug');

router.get('/quadrinho/:slug', async (req, res) => {
    try {
        const comic = await ComicService.findBySlug(req.params.slug);

        if (!comic) return res.status(404).sendFile(path.join(pages, '404.html'));

        const correctSlug = makeSlug(comic.id, comic.title);
        if (req.params.slug !== correctSlug) {
            return res.redirect(301, `/quadrinho/${correctSlug}`);
        }

        const html = renderComicPage(pages, comic, correctSlug);
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).sendFile(path.join(pages, '500.html'));
    }
});

router.get('/personagem/:slug', async (req, res) => {
    try {
        const character = await CharacterService.findBySlug(req.params.slug);

        if (!character) return res.status(404).sendFile(path.join(pages, '404.html'));

        const correctSlug = makeSlug(character.id, character.alias || character.name);
        if (req.params.slug !== correctSlug) {
            return res.redirect(301, `/personagem/${correctSlug}`);
        }

        const html = renderCharacterPage(pages, character, correctSlug);
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).sendFile(path.join(pages, '500.html'));
    }
});

router.get('/arco/:slug', async (req, res) => {
    try {
        const arc = await ArcService.findBySlug(req.params.slug);

        if (!arc) return res.status(404).sendFile(path.join(pages, '404.html'));

        const correctSlug = makeSlug(arc.id, arc.name);
        if (req.params.slug !== correctSlug) {
            return res.redirect(301, `/arco/${correctSlug}`);
        }

        const html = renderArcPage(pages, arc, correctSlug);
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).sendFile(path.join(pages, '500.html'));
    }
});

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