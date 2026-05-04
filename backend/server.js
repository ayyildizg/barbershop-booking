const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  res.send("Barbershop booking API is running");
});

// SERVICES API
app.get("/services", (req, res) => {
  res.json([
    { id: 1, name: "Haircut", price: 20 },
    { id: 2, name: "Beard Trim", price: 15 },
    { id: 3, name: "Haircut + Beard", price: 30 },
  ]);
});

// BARBERS API
app.get("/barbers", (req, res) => {
  res.json([
    { id: 1, name: "Ahmet" },
    { id: 2, name: "Mehmet" },
    { id: 3, name: "Ali" },
  ]);
});

// ✅ GET USER APPOINTMENTS (KULLANICIYA ÖZEL)
app.get("/appointments/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM appointments WHERE user_id = $1 ORDER BY date DESC",
      [user_id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ CREATE APPOINTMENT (GERÇEK + DOUBLE BOOKING)
app.post("/appointments", async (req, res) => {
  const { user_id, barber_id, service_id, date, time } = req.body;

  try {
    // ❗ DOUBLE BOOKING KONTROLÜ
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

    // ✅ INSERT
    const result = await pool.query(
      `INSERT INTO appointments (user_id, barber_id, service_id, date, time, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [user_id, barber_id, service_id, date, time],
    );

    res.json({
      message: "Appointment created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
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
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
