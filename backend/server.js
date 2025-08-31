const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database path inside container
const dbPath = path.resolve("/app/data", "db.sqlite");


// If file doesn't exist, create it
if (!fs.existsSync(dbPath)) {
  console.log("Database not found, creating new db.sqlite...");
  fs.writeFileSync(dbPath, "");
}

// Connect to SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");

    // Create table if not exists
    db.run(
      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
  }
});

// Routes
app.get("/", (req, res) => {
  res.send("Backend running with SQLite DB!");
});

app.post("/reviews", (req, res) => {
  const { name, message } = req.body;
  db.run(
    "INSERT INTO reviews (name, message) VALUES (?, ?)",
    [name, message],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, name, message });
    }
  );
});

app.get("/reviews", (req, res) => {
  db.all("SELECT * FROM reviews", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
