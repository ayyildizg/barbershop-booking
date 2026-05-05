const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ROOT
app.get("/", (req, res) => {
  res.send("Barbershop booking API is running");
});

// 🔥 FIX DB (EN ÖNEMLİ)
app.get("/fix-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT
      );
    `);

    res.send("Users table created");
  } catch (err) {
    console.error("FIX DB ERROR:", err);
    res.status(500).send(err.message);
  }
});

// SERVICES
app.get("/services", (req, res) => {
  res.json([
    { id: 1, name: "Haircut", price: 20 },
    { id: 2, name: "Beard Trim", price: 15 },
    { id: 3, name: "Haircut + Beard", price: 30 },
  ]);
});

// BARBERS
app.get("/barbers", (req, res) => {
  res.json([
    { id: 1, name: "Ahmet" },
    { id: 2, name: "Mehmet" },
    { id: 3, name: "Ali" },
  ]);
});

// APPOINTMENTS
app.get("/appointments/:user_id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM appointments WHERE user_id = $1 ORDER BY date DESC",
      [req.params.user_id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET APPOINTMENTS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/appointments", async (req, res) => {
  const { user_id, barber_id, service_id, date, time } = req.body;

  try {
    const existing = await pool.query(
      `SELECT * FROM appointments 
       WHERE barber_id = $1 AND date = $2 AND time = $3`,
      [barber_id, date, time],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "This time slot is already booked",
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments 
      (user_id, barber_id, service_id, date, time, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *`,
      [user_id, barber_id, service_id, date, time],
    );

    res.json({
      message: "Appointment created",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("CREATE APPOINTMENT ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// REGISTER
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, password],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (user.password !== password) {
      return res.status(401).json({ error: "Wrong password" });
    }

    res.json({ message: "Login successful", user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// TEST DB
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error("TEST DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// START
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
