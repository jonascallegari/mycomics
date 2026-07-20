// utils/slug.js (backend) — mesma lógica do frontend, pra gerar e validar
function slugify(text) {
    return text
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function makeSlug(id, title) {
    return `${id}-${slugify(title)}`;
}

function extractId(slug) {
    const match = String(slug).match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

module.exports = { slugify, makeSlug, extractId };