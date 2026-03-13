const express = require("express");
const cors = require("cors");

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

// APPOINTMENTS API
let appointments = [];

app.post("/appointments", (req, res) => {
  const appointment = req.body;

  appointments.push(appointment);

  res.json({
    message: "Appointment created successfully",
    data: appointment,
  });
});

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
