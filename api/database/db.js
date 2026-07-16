const sqlite3 = require('sqlite3');
const { open } = require('sqlite');



const path = require('path'); // Não esqueça de importar o path

async function initDB() {
    const db = await open({
        // Isso garante o caminho absoluto: api/database/icdb.db
        filename: path.join(__dirname, 'icdb.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS comics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            publisher TEXT,
            year INTEGER,
            genre TEXT
        );

        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            alias TEXT,
            publisher TEXT,
            first_appearance TEXT
        );

        CREATE TABLE IF NOT EXISTS creators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            nationality TEXT,
            birth_year INTEGER
        );

        CREATE TABLE IF NOT EXISTS comic_characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comic_id INTEGER,
            character_id INTEGER
        );

        CREATE TABLE IF NOT EXISTS comic_creators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comic_id INTEGER,
            creator_id INTEGER,
            role TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT
        );

        CREATE TABLE IF NOT EXISTS user_collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            comic_id INTEGER,
            status TEXT,
            rating INTEGER
        );

        CREATE TABLE IF NOT EXISTS user_comics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            comic_id INTEGER NOT NULL,
            status TEXT,
            rating INTEGER,
            notes TEXT,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, comic_id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(comic_id) REFERENCES comics(id)
        );
    `);

    return db;
}

module.exports = initDB();