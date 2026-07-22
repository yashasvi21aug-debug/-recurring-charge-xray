// middleware/requireAuth.js
// This checks every protected request for a valid login token before
// letting it continue. If there's no token, or it's invalid/expired,
// the request gets rejected here -- it never reaches the actual route.

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "temporary-dev-secret-change-this-later";

function requireAuth(req, res, next) {
  // Tokens are sent in a header like: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "You must be logged in to do that." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // attach the logged-in user's ID for the route to use
    next(); // token is valid -- let the request continue
  } catch (err) {
    return res.status(401).json({ error: "Your session is invalid or expired. Please log in again." });
  }
}

module.exports = requireAuth;