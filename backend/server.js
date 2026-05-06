require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const app = express();

const JWT_SECRET = "barbershop_secret_key";

// ✅ EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gulinayyildiz@gmail.com",
    pass: "uory ybym djip omvh",
  },
});

// ✅ VERIFY TOKEN
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Access denied",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, JWT_SECRET);

    req.user = verified;

    next();
  } catch (err) {
    res.status(401).json({
      error: "Invalid token",
    });
  }
};

app.use(cors());
app.use(express.json());

// ✅ DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
});

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("Barbershop booking API is running");
});

// ✅ FIX USERS TABLE
app.get("/fix-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
      );
    `);

    res.send("Users table created");
  } catch (err) {
    console.error("FIX DB ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ FIX APPOINTMENTS TABLE
app.get("/fix-appointments", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        barber_id INTEGER,
        service_id INTEGER,
        date TEXT,
        time TEXT,
        status TEXT
      );
    `);

    res.send("Appointments table created");
  } catch (err) {
    console.error("FIX APPOINTMENTS ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ SERVICES
app.get("/services", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Classic Haircut",
      price: 20,
    },
    {
      id: 2,
      name: "Skin Fade",
      price: 25,
    },
    {
      id: 3,
      name: "Buzz Cut",
      price: 15,
    },
    {
      id: 4,
      name: "Beard Trim",
      price: 15,
    },
    {
      id: 5,
      name: "Hot Towel Shave",
      price: 18,
    },
    {
      id: 6,
      name: "Hair Wash",
      price: 10,
    },
    {
      id: 7,
      name: "Hair Styling",
      price: 12,
    },
    {
      id: 8,
      name: "Kids Haircut",
      price: 14,
    },
    {
      id: 9,
      name: "Haircut + Beard",
      price: 30,
    },
    {
      id: 10,
      name: "VIP Package",
      price: 50,
    },
  ]);
});

// ✅ BARBERS
app.get("/barbers", (req, res) => {
  res.json([
    {
      id: 1,
      name: "James Carter",
    },
    {
      id: 2,
      name: "Michael Reed",
    },
    {
      id: 3,
      name: "Daniel Brooks",
    },
    {
      id: 4,
      name: "Ethan Walker",
    },
    {
      id: 5,
      name: "Noah Bennett",
    },
  ]);
});

// ✅ GET APPOINTMENTS
app.get("/appointments/:user_id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
FROM appointments
WHERE user_id = $1
ORDER BY id DESC
    `,
      [req.params.user_id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET APPOINTMENTS ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ CREATE APPOINTMENT
app.post("/appointments", verifyToken, async (req, res) => {
  const { user_id, barber_id, service_id, date, time } = req.body;

  try {
    // DOUBLE BOOKING CHECK
    const existing = await pool.query(
      `
      SELECT *
      FROM appointments
      WHERE barber_id = $1
      AND date = $2
      AND time = $3
    `,
      [barber_id, date, time],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "This time slot is already booked",
      });
    }

    // INSERT
    const result = await pool.query(
      `
      INSERT INTO appointments
      (
        user_id,
        barber_id,
        service_id,
        date,
        time,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [user_id, barber_id, service_id, date, time, "pending"],
    );

    // ✅ GET USER EMAIL
    const userResult = await pool.query(
      `
      SELECT email, name
      FROM users
      WHERE id = $1
    `,
      [user_id],
    );

    const userEmail = userResult.rows[0]?.email;

    const userName = userResult.rows[0]?.name;

    // ✅ SEND EMAIL
    if (userEmail) {
      await transporter.sendMail({
        from: "gulinayyildiz@gmail.com",

        to: userEmail,

        subject: "Appointment Confirmation",

        html: `
          <h2>Hello ${userName}</h2>

          <p>
            Your appointment was created successfully.
          </p>

          <p>
            <strong>Date:</strong> ${date}
          </p>

          <p>
            <strong>Time:</strong> ${time}
          </p>

          <p>
            Status: pending
          </p>
        `,
      });
    }

    res.json({
      message: "Appointment created",

      data: result.rows[0],
    });
  } catch (err) {
    console.error("FULL APPOINTMENT ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ REGISTER
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password,
        role
      )
      VALUES ($1, $2, $3, 'user')
      RETURNING *
    `,
      [name, email, hashedPassword],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "Email already exists",
      });
    }

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
    `,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    const user = result.rows[0];

    // ✅ CHECK PASSWORD
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: "Wrong password",
      });
    }

    // ✅ CREATE TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Login successful",

      user,
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ TEST DB
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json(result.rows);
  } catch (err) {
    console.error("TEST DB ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ SOFT DELETE APPOINTMENT
app.delete("/appointments/:id", verifyToken, async (req, res) => {
  try {
    await pool.query(
      `
      UPDATE appointments
      SET deleted = true
      WHERE id = $1
    `,
      [req.params.id],
    );

    res.json({
      message: "Appointment moved to trash",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Delete failed",
    });
  }
});

// ✅ ADMIN APPOINTMENTS
app.get("/admin/appointments", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
FROM appointments
ORDER BY date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ UPDATE STATUS
app.put("/admin/appointments/:id", verifyToken, async (req, res) => {
  const { status } = req.body;

  try {
    await pool.query(
      `
      UPDATE appointments
      SET status = $1
      WHERE id = $2
    `,
      [status, req.params.id],
    );

    res.json({
      message: "Status updated",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Update failed",
    });
  }
});

// ✅ ADD ROLE COLUMN
app.get("/add-role-column", async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
    `);

    res.send("Role column added");
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ MAKE ADMIN
app.get("/make-admin/:email", async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE users
      SET role = 'admin'
      WHERE LOWER(email) = LOWER($1)
      RETURNING *
      `,
      [req.params.email],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// DELETE USER
app.get("/delete-user/:email", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE email = $1", [req.params.email]);

    res.send("User deleted");
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// AVAILABLE TIMES
app.get("/available-times", async (req, res) => {
  const { barber_id, date } = req.query;

  try {
    const result = await pool.query(
      `
        SELECT time
        FROM appointments
        WHERE barber_id = $1
        AND date = $2
      `,
      [barber_id, date],
    );

    const bookedTimes = result.rows.map((r) => r.time);

    res.json(bookedTimes);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// LIST USERS
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role
      FROM users
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ ADD DELETED COLUMN
app.get("/add-deleted-column", async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false
    `);

    res.send("Deleted column added");
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ CREATE REVIEWS TABLE
app.get("/fix-reviews", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        appointment_id INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    res.send("Reviews table created");
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ CREATE REVIEW
app.post("/reviews", verifyToken, async (req, res) => {
  const { user_id, appointment_id, comment, rating } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO reviews
      (
        user_id,
        appointment_id,
        comment,
        rating
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [user_id, appointment_id, comment, rating],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ GET REVIEWS
app.get("/reviews", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
  reviews.*,
  users.name AS user_name
FROM reviews
JOIN users
ON reviews.user_id = users.id
ORDER BY reviews.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ FIX REVIEWS TABLE
app.get("/fix-reviews-stars", async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE reviews
      ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;
    `);

    res.send("Reviews updated");
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ START SERVER
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
