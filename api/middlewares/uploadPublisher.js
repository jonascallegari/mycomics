const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: 'uploads/publishers',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

module.exports = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Somente imagens'));
        }
        cb(null, true);
    }
});