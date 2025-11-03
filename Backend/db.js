const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to SQLite DB");
});

// Enable foreign keys immediately
db.run("PRAGMA foreign_keys = ON", (err) => {
  if (err) console.error("Failed to enable foreign keys:", err);
});

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    photo TEXT DEFAULT '/user/profile/default.png',
    createdAt TEXT
    )`);

  // Carts table
  db.run(`CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    product TEXT,
    price REAL,
    date TEXT,
    qty INTEGER,
    status TEXT DEFAULT 'pending',
    paidAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);
});

module.exports = db;
