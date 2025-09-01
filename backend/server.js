// backend/server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// SQLite DB stored in container (ephemeral)
const dbPath = path.resolve(__dirname, "reviews.db");
const db = new sqlite3.Database(dbPath);

// Create table if not exists
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, message TEXT)");
});

// API routes
app.get("/reviews", (req, res) => {
  db.all("SELECT * FROM reviews", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/reviews", (req, res) => {
  const { name, message } = req.body;
  db.run("INSERT INTO reviews (name, message) VALUES (?, ?)", [name, message], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, message });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
