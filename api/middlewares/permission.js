const dbPromise = require('../database/db');

module.exports = function permission(required) {
    return async (req, res, next) => {
        try {
            const db = await dbPromise;
            const userId = req.user.id;

            const row = await db.get(
                `
                SELECT 1
                FROM users u
                JOIN roles r ON r.id = u.role_id
                JOIN role_permissions rp ON rp.role_id = r.id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE u.id = ? AND p.name = ?
                `,
                [userId, required]
            );

            if (!row) {
                return res.status(403).json({
                    error: 'Permissão negada'
                });
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                error: 'Erro ao verificar permissão'
            });
        }
    };
};