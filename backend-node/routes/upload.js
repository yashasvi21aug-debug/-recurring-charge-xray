// routes/upload.js
// Now this route does three things:
// 1. Receives a CSV file from the frontend
// 2. Forwards it to the Python detection API and gets results back
// 3. Saves those results into our database, then sends them to the frontend
//
// It also has a GET route to fetch past scan history.

const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const db = require("../db");

const router = express.Router();

const upload = multer({ dest: "uploads/" });
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000/analyze";

// GET /api/upload -- returns all past scans, most recent first
router.get("/", (req, res) => {
  const scans = db
    .prepare("SELECT id, filename, results, created_at FROM scans ORDER BY created_at DESC")
    .all();

  const parsed = scans.map((scan) => ({
    ...scan,
    results: JSON.parse(scan.results), // stored as text, convert back to real JSON
  }));

  res.json(parsed);
});

// POST /api/upload -- the main upload + analyze + save route
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    const response = await axios.post(PYTHON_API_URL, formData, {
      headers: formData.getHeaders(),
    });

    // Save this scan into the database
    const stmt = db.prepare("INSERT INTO scans (filename, results) VALUES (?, ?)");
    stmt.run(req.file.originalname, JSON.stringify(response.data.recurring_charges));

    res.json(response.data);
  } catch (error) {
    console.error("Error talking to Python service:", error.message);
    res.status(500).json({ error: "Something went wrong analyzing the file." });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

module.exports = router;