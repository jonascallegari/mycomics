const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DATA_DIR } = require('../utils/paths');

const uploadDir = path.join(DATA_DIR, 'publishers');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
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