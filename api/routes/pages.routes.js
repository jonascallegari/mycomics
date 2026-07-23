const express = require('express');
const path = require('path');

const router = express.Router();

const pages = path.join(__dirname, '..', 'pages');

// pages.routes.js
const fs = require('fs');

const HomeService = require('../services/home.service');
const { renderHomePage } = require('../utils/render-page');

const ComicService = require('../services/comic.service');
const { renderComicPage } = require('../utils/render-page');

const CharacterService = require('../services/character.service');
const { renderCharacterPage } = require('../utils/render-page');

const ArcService = require('../services/arc.service');
const { renderArcPage } = require('../utils/render-page');

const SerieService = require('../services/serie.service');
const { renderSeriePage } = require('../utils/render-page');

const CreatorService = require('../services/creator.service');
const { renderCreatorPage } = require('../utils/render-page');

const PublisherService = require('../services/publisher.service');
const { renderPublisherPage } = require('../utils/render-page');

const { makeSlug } = require('../utils/slug');

router.get('/', async (req, res) => {
    try {
        const homeData = await HomeService.getHomeData();
        const html = renderHomePage(pages, homeData);
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).sendFile(path.join(pages, '500.html'));
    }
});

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

router.get('/serie/:slug', async (req, res) => {
    try {
        const serie = await SerieService.findBySlug(req.params.slug);

        if (!serie) return res.status(404).sendFile(path.join(pages, '404.html'));

        const correctSlug = makeSlug(serie.id, serie.name);
        if (req.params.slug !== correctSlug) {
            return res.redirect(301, `/serie/${correctSlug}`);
        }

        const html = renderSeriePage(pages, serie, correctSlug);
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).sendFile(path.join(pages, '500.html'));
    }
});

router.get('/criador/:slug', async (req, res) => {
    try {
        const creator = await CreatorService.findBySlug(req.params.slug);

        if (!creator) return res.status(404).sendFile(path.join(pages, '404.html'));

        const correctSlug = makeSlug(creator.id, creator.name);
        if (req.params.slug !== correctSlug) {
            return res.redirect(301, `/criador/${correctSlug}`);
        }

        const html = renderCreatorPage(pages, creator, correctSlug);
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).sendFile(path.join(pages, '500.html'));
    }
});

router.get('/editora/:slug', async (req, res) => {
    try {
        const publisher = await PublisherService.findBySlug(req.params.slug);

        if (!publisher) return res.status(404).sendFile(path.join(pages, '404.html'));

        const correctSlug = makeSlug(publisher.id, publisher.name);
        if (req.params.slug !== correctSlug) {
            return res.redirect(301, `/editora/${correctSlug}`);
        }

        const html = renderPublisherPage(pages, publisher, correctSlug);
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

router.get('/forgot-password', page('forgot-password'));

router.get('/reset-password', page('reset-password'));

router.get('/confirmar-email', page('confirmar-email'));

module.exports = router;