const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "database.db");
const db = new Database(dbPath);

// Enable foreign keys immediately
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    photo TEXT DEFAULT '/user/profile/default.png',
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    product TEXT,
    price REAL,
    date TEXT,
    qty INTEGER,
    status TEXT DEFAULT 'pending',
    paidAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

console.log("Connected to SQLite DB and tables ensured.");

module.exports = db;
