// utils/paths.js
const path = require('path');

// Mesma lógica do db.js: em produção, usa a pasta persistente fora do repo;
// localmente, cai dentro do próprio projeto (api/uploads).
const DATA_DIR = process.env.APP_DATA_DIR
    ? path.join(process.env.APP_DATA_DIR, 'uploads')
    : path.join(__dirname, '..', 'uploads');

module.exports = { DATA_DIR };