// db.js
// This sets up our database -- a single file called "data.db" that will
// store every scan a user runs, so results survive even after a refresh.

const Database = require("better-sqlite3");

// This creates (or opens, if it already exists) a file called data.db
const db = new Database("data.db");

// Create a table to store scans, but only if it doesn't already exist.
// Each row = one CSV upload's results.
db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    results TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
// Create a table for user accounts
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
try {
  db.exec(`ALTER TABLE scans ADD COLUMN user_id INTEGER REFERENCES users(id)`);
} catch (err) {
  // Expected after the first run -- column already exists
}

module.exports = db;