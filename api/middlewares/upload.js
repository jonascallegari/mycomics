const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(), // 👈 fica em memória
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter(req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Arquivo não é uma imagem'));
        }
        cb(null, true);
    }
});

module.exports = upload;
