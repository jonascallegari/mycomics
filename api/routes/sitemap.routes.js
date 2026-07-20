// routes/sitemap.routes.js
const express = require('express');
const dbPromise = require('../database/db');
const { urlEntry, wrapUrlset, wrapIndex, makeSlug, BASE_URL } = require('../utils/sitemap');

const router = express.Router();

// ÍNDICE
router.get('/sitemap.xml', (req, res) => {
    res.type('application/xml').send(wrapIndex([
        'sitemap-static.xml',
        'sitemap-comics.xml',
        'sitemap-characters.xml',
        'sitemap-creators.xml',
        'sitemap-publishers.xml',
        'sitemap-series.xml',
        'sitemap-arcos.xml'
    ]));
});

// PÁGINAS ESTÁTICAS / LISTAGENS
router.get('/sitemap-static.xml', (req, res) => {
    const pages = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/comics', priority: '0.8', changefreq: 'daily' },
        { path: '/characters', priority: '0.8', changefreq: 'weekly' },
        { path: '/creators', priority: '0.7', changefreq: 'weekly' },
        { path: '/publishers', priority: '0.7', changefreq: 'weekly' },
        { path: '/series', priority: '0.7', changefreq: 'weekly' },
        { path: '/arcos', priority: '0.7', changefreq: 'weekly' }
    ];

    const entries = pages.map(p =>
        urlEntry(`${BASE_URL}${p.path}`, { priority: p.priority, changefreq: p.changefreq })
    );

    res.type('application/xml').send(wrapUrlset(entries));
});

// COMICS
router.get('/sitemap-comics.xml', async (req, res) => {
    try {
        const db = await dbPromise;

        const comics = await db.all(`
            SELECT id, title, created_at
            FROM comics
        `);

        const entries = comics.map(c => {
            const slug = makeSlug(c.id, c.title);
            return urlEntry(`${BASE_URL}/quadrinho/${slug}`, {
                lastmod: c.created_at ? c.created_at.split(' ')[0] : undefined,
                priority: '0.7'
            });
        });

        res.type('application/xml').send(wrapUrlset(entries));

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar sitemap de comics');
    }
});

// CHARACTERS
router.get('/sitemap-characters.xml', async (req, res) => {
    try {
        const db = await dbPromise;

        const characters = await db.all(`SELECT id, name, alias FROM characters`);

        const entries = characters.map(c => {
            const slug = makeSlug(c.id, c.alias || c.name);
            return urlEntry(`${BASE_URL}/personagem/${slug}`, { priority: '0.6' });
        });

        res.type('application/xml').send(wrapUrlset(entries));

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar sitemap de personagens');
    }
});

// CREATORS
router.get('/sitemap-creators.xml', async (req, res) => {
    try {
        const db = await dbPromise;

        const creators = await db.all(`SELECT id, name FROM creators`);

        const entries = creators.map(c => {
            const slug = makeSlug(c.id, c.name);
            return urlEntry(`${BASE_URL}/criador/${slug}`, { priority: '0.5' });
        });

        res.type('application/xml').send(wrapUrlset(entries));

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar sitemap de criadores');
    }
});

// PUBLISHERS
router.get('/sitemap-publishers.xml', async (req, res) => {
    try {
        const db = await dbPromise;

        const publishers = await db.all(`SELECT id, name FROM publishers`);

        const entries = publishers.map(p => {
            const slug = makeSlug(p.id, p.name);
            return urlEntry(`${BASE_URL}/editora/${slug}`, { priority: '0.5' });
        });

        res.type('application/xml').send(wrapUrlset(entries));

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar sitemap de editoras');
    }
});

// SERIES
router.get('/sitemap-series.xml', async (req, res) => {
    try {
        const db = await dbPromise;

        const series = await db.all(`SELECT id, name FROM series`);

        const entries = series.map(s => {
            const slug = makeSlug(s.id, s.name);
            return urlEntry(`${BASE_URL}/serie/${slug}`, { priority: '0.6' });
        });

        res.type('application/xml').send(wrapUrlset(entries));

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar sitemap de séries');
    }
});

// ARCOS
router.get('/sitemap-arcos.xml', async (req, res) => {
    try {
        const db = await dbPromise;

        const arcos = await db.all(`SELECT id, name FROM arcs`);

        const entries = arcos.map(a => {
            const slug = makeSlug(a.id, a.name);
            return urlEntry(`${BASE_URL}/arco/${slug}`, { priority: '0.5' });
        });

        res.type('application/xml').send(wrapUrlset(entries));

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar sitemap de arcos');
    }
});

module.exports = router;