const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Processa imagens (capa, personagem, editora, etc)
 * @param {Buffer} buffer
 * @param {Object} options
 * @param {string} options.folder  pasta dentro de /uploads
 * @param {number} options.width
 * @param {number} options.height
 */
module.exports = async function processImage(
    buffer,
    {
        folder = 'covers',
        width = 650,
        height = 1000
    } = {}
) {
    const filename = `${Date.now()}.jpg`;

    const uploadDir = path.join('uploads', folder);
    const outputPath = path.join(uploadDir, filename);

    // garante que a pasta existe
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    await sharp(buffer)
        .resize(width, height, {
            fit: 'cover'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

    return `/uploads/${folder}/${filename}`;
};
