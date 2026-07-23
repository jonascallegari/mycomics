// database/migrations/add-email-verification.js
const dbPromise = require('../db');

async function migrate() {
    const db = await dbPromise;

    const columns = await db.all(`PRAGMA table_info(users)`);
    const hasColumn = columns.some(c => c.name === 'email_verified');

    if (!hasColumn) {
        await db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`);
        console.log('Coluna email_verified adicionada.');
    }

    await db.exec(`
        CREATE TABLE IF NOT EXISTS email_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    console.log('Migration concluída.');
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});