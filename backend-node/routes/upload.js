// routes/upload.js
// Now every route here requires the user to be logged in.
// Scans are saved with the user's ID, and history only shows YOUR scans.

const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const db = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const upload = multer({ dest: "uploads/" });
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000/analyze";

// GET /api/upload -- returns only the logged-in user's past scans
router.get("/", requireAuth, (req, res) => {
  const scans = db
    .prepare("SELECT id, filename, results, created_at FROM scans WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);

  const parsed = scans.map((scan) => ({
    ...scan,
    results: JSON.parse(scan.results),
  }));

  res.json(parsed);
});

// POST /api/upload -- upload + analyze + save, tied to the logged-in user
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    const response = await axios.post(PYTHON_API_URL, formData, {
      headers: formData.getHeaders(),
    });

    const stmt = db.prepare("INSERT INTO scans (filename, results, user_id) VALUES (?, ?, ?)");
    stmt.run(req.file.originalname, JSON.stringify(response.data.recurring_charges), req.userId);

    res.json(response.data);
  } catch (error) {
    console.error("Error talking to Python service:", error.message);
    res.status(500).json({ error: "Something went wrong analyzing the file." });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

module.exports = router;