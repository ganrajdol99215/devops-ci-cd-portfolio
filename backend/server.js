const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./db.sqlite');

app.use(cors());
app.use(bodyParser.json());

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, review TEXT)");
});

app.post('/api/review', (req, res) => {
  const { name, review } = req.body;
  db.run("INSERT INTO reviews (name, review) VALUES (?, ?)", [name, review], (err) => {
    if (err) return res.status(500).json({ message: "DB Error" });
    res.json({ message: "Review submitted successfully" });
  });
});

app.get('/api/review', (req, res) => {
  db.all("SELECT * FROM reviews", (err, rows) => {
    if (err) return res.status(500).json({ message: "Fetch error" });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

