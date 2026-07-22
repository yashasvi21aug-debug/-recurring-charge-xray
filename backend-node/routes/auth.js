// routes/auth.js
// Handles: creating new accounts (signup) and logging in (login)

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// A secret key used to sign login tokens -- in a real production app this
// would be a long random string stored securely, not hardcoded. We'll fix
// this properly when we deploy.
const JWT_SECRET = "temporary-dev-secret-change-this-later";

// POST /api/auth/signup -- create a new account
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Scramble the password before ever storing it -- "10" is how many times
    // it scrambles it; higher = more secure but slower. 10 is a good default.
    const passwordHash = await bcrypt.hash(password, 10);

    const stmt = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    const result = stmt.run(email, passwordHash);

    // Create a login token right away so the user is signed in immediately after signup
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, email });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong creating your account." });
  }
});

// POST /api/auth/login -- log into an existing account
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // Compare the entered password against the stored scrambled version
  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "temporary-dev-secret-change-this-later";

  res.json({ token, email: user.email });
});

module.exports = router;