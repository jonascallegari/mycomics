const express = require('express');
const dbPromise = require('../database/db');
const auth = require('../middlewares/auth');
const uploadAvatar = require('../middlewares/uploadAvatar');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/* ================================
   Atualizar perfil
================================ */
router.put('/me', auth, async (req, res) => {
    const db = await dbPromise;

    try {
        const { bio, character_id, comic_id } = req.body;
        const userId = req.user.id;

        await db.run(
            `
            UPDATE users
            SET 
                bio = ?,
                favorite_character_id = ?,
                favorite_comic_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [bio || null, character_id || null, comic_id || null, userId]
        );

        const user = await db.get(
            `
            SELECT
                u.id,
                u.username,
                u.email,
                u.bio,
                u.avatar,
                u.created_at,

                c.id   AS character_id,
                c.name AS character_name,
                c.image AS character_image,

                cm.id    AS comic_id,
                cm.title AS comic_title,
                cm.cover AS comic_cover

            FROM users u
            LEFT JOIN characters c
                ON u.favorite_character_id = c.id
            LEFT JOIN comics cm
                ON u.favorite_comic_id = cm.id
            WHERE u.id = ?
            `,
            [userId]
        );

        if (!user) {
            return res
                .status(404)
                .json({ error: 'Usuário não encontrado' });
        }

        res.json(user);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});


/* ================================
   Upload de avatar (com limpeza)
================================ */
router.post(
    '/me/avatar',
    auth,
    uploadAvatar.single('avatar'),
    async (req, res) => {

        const db = await dbPromise;

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Arquivo não enviado' });
            }

            const userId = req.user.id;
            const newAvatarPath = `/uploads/avatars/${req.file.filename}`;

            // 1️⃣ Buscar avatar atual
            const user = await db.get(
                'SELECT avatar FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return res.status(404).json({
                    error: 'Usuário não encontrado'
                });
            }

            // 2️⃣ Apagar avatar antigo (se existir e não for placeholder)
            if (user.avatar && !user.avatar.includes('placeholder')) {
                const oldAvatarFullPath = path.join(
                    __dirname,
                    '..',
                    user.avatar.replace(/^\/+/, '')
                );

                fs.unlink(oldAvatarFullPath, (err) => {
                    if (err) {
                        console.warn(
                            'Erro ao apagar avatar antigo:',
                            err.message
                        );
                    }
                });
            }

            // 3️⃣ Atualizar banco
            await db.run(
                `
                UPDATE users
                SET avatar = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [newAvatarPath, userId]
            );

            res.json({
                success: true,
                avatar: newAvatarPath
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Erro ao salvar avatar'
            });
        }
    }
);

module.exports = router;