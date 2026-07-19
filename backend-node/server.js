// server.js
// This is the "front door" of our backend.
// It starts the server and connects our routes (URLs) to logic.

const express = require("express");
const cors = require("cors");

const app = express();

// Lets the frontend (running on a different port) talk to this backend
app.use(cors());

// Lets us read JSON data sent from the frontend
app.use(express.json());

// A simple test route — visit http://localhost:5000/ to check the server works
app.get("/", (req, res) => {
  res.send("Recurring Charge X-Ray backend is running!");
});

// We'll plug in the real upload route here once it's built
const uploadRoutes = require("./routes/upload");
app.use("/api/upload", uploadRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
