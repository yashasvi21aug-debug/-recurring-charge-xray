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

module.exports = db;