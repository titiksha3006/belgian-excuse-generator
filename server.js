const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 8080;

const pool = new Pool({
  connectionString: process.env.POSTGRESQL_ADDON_URI,
  ssl: process.env.POSTGRESQL_ADDON_URI
    ? { rejectUnauthorized: false }
    : false
});

app.use(express.json());
app.use(express.static("public"));

const excuses = [
  "The tram was late. Again. 🇧🇪",
  "I had to wait for fries.",
  "My waffle needed emotional support.",
  "There was a very serious beer emergency.",
  "I got stuck behind someone ordering 14 sauces.",
  "The rain changed my plans. Belgium, you know.",
  "I was on Belgian time. That's different.",
  "The train was delayed, so naturally I blamed the SNCB.",
  "I couldn't leave before finishing my coffee.",
  "Someone mentioned chocolate and I lost track of time.",
  "My bike had strong opinions about today's weather.",
  "I was busy solving an extremely important Belgian problem."
];

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS excuses (
      id SERIAL PRIMARY KEY,
      excuse TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.get("/api/excuse", (req, res) => {
  const excuse = excuses[Math.floor(Math.random() * excuses.length)];
  res.json({ excuse });
});

app.post("/api/save", async (req, res) => {
  if (!req.body.excuse) {
    return res.status(400).json({ error: "Missing excuse" });
  }

  try {
    await pool.query(
      "INSERT INTO excuses (excuse) VALUES ($1)",
      [req.body.excuse]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/favorites", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT excuse, COUNT(*)::int AS likes
      FROM excuses
      GROUP BY excuse
      ORDER BY likes DESC, excuse
      LIMIT 5
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log("🇧🇪 Belgian Excuse Generator is running!");
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
