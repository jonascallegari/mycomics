const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

require('dotenv').config();

// ===============================
// MIDDLEWARES
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos da pasta site/public
// O express vai procurar o index.html automaticamente nessa pasta
app.use(express.static(path.join(__dirname, 'public')));

// ===============================
// DESABILITAR CACHE PARA UPLOADS
// ===============================
app.use(
    '/uploads',
    express.static(path.join(__dirname, 'api/uploads'), {
        etag: false,
        lastModified: false,
        maxAge: 0,
        setHeaders: (res) => {
            res.setHeader(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, proxy-revalidate'
            );
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    })
);

// ===============================
// ROTAS
// ===============================
app.use(require('./api/routes/pages.routes'));
app.use('/api/comics', require('./api/routes/comics.routes'));
app.use('/api/characters', require('./api/routes/characters.routes'));
app.use('/api/creators', require('./api/routes/creators.routes'));
app.use('/api/comic-characters', require('./api/routes/comicCharacters.routes'));
app.use('/api/comic-creators', require('./api/routes/comicCreators.routes'));
app.use('/api/publishers', require('./api/routes/publishers.routes'));
app.use('/api/auth', require('./api/routes/auth.routes'));
app.use('/api/collections', require('./api/routes/collections.routes'));
app.use('/api/collection', require('./api/routes/collection.routes'));
app.use('/api/admin', require('./api/routes/admin.routes'));
app.use('/api/public', require('./api/routes/public.routes'));
app.use('/api/users', require('./api/routes/users.routes'));
app.use('/api/users', require('./api/routes/users.private.routes'));
app.use('/api/reviews', require('./api/routes/reviews.routes'));
app.use('/api/series', require('./api/routes/series.routes'));
app.use('/api/arcs', require('./api/routes/arcs.routes'));

// ===============================
// ERRO GLOBAL
// ===============================
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// ===============================
// START
// ===============================
app.listen(3000, () => {
    console.log('ICDB API rodando em http://localhost:3000');
});
