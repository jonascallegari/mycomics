// utils/sitemap.js
const { makeSlug } = require('./slug');

const BASE_URL = 'https://mycomics.com.br';

function escapeXml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function urlEntry(loc, { lastmod, changefreq = 'weekly', priority = '0.6' } = {}) {
    return `
    <url>
        <loc>${escapeXml(loc)}</loc>
        ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
}

function wrapUrlset(entries) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}
</urlset>`;
}

function wrapIndex(sitemaps) {
    const entries = sitemaps.map(s => `
    <sitemap>
        <loc>${BASE_URL}/${s}</loc>
    </sitemap>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</sitemapindex>`;
}

module.exports = { escapeXml, urlEntry, wrapUrlset, wrapIndex, makeSlug, BASE_URL };