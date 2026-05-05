import { useEffect, useState } from "react";

function App() {
  const API_URL = "https://barbershop-booking-gauq.onrender.com";

  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [date, setDate] = useState("");

  const [appointments, setAppointments] = useState([]);

  // SERVICES + BARBERS
  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((res) => res.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_URL}/barbers`)
      .then((res) => res.json())
      .then((data) => setBarbers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // USER APPOINTMENTS
  useEffect(() => {
    if (user?.id) {
      getAppointments();
    }
  }, [user]);

  const getAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/appointments/${user.id}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("APPOINTMENTS ERROR:", data);
        setAppointments([]);
        return;
      }

      setAppointments(data);
    } catch (err) {
      console.error(err);
      setAppointments([]);
    }
  };

  // AUTH
  const handleAuth = async () => {
    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;

    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      const loggedUser = isLogin ? data.user : data;
      setUser(loggedUser);

      alert(isLogin ? "Login successful" : "Register successful");
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  // CREATE APPOINTMENT
  const createBooking = async () => {
    if (!selectedService || !selectedBarber || !date) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          barber_id: Number(selectedBarber),
          service_id: Number(selectedService),
          date,
          time: "10:00",
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert("Appointment created!");
      getAppointments();
    } catch (error) {
      console.error(error);
      alert("Error!");
    }
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Barbershop System</h1>
        <h2>{isLogin ? "Login" : "Register"}</h2>

        {!isLogin && (
          <>
            <input
              placeholder="Name"
              onChange={(e) => setName(e.target.value)}
            />
            <br />
            <br />
          </>
        )}

        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />

        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button onClick={handleAuth}>{isLogin ? "Login" : "Register"}</button>

        <br />
        <br />

        <button onClick={() => setIsLogin(!isLogin)}>
          Switch to {isLogin ? "Register" : "Login"}
        </button>
      </div>
    );
  }

  // SAFE ARRAY
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  // MAIN SCREEN
  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome, {user?.name}</h1>

      <button onClick={() => setUser(null)}>Logout</button>

      <h2>Services</h2>
      <ul>
        {services.map((s) => (
          <li key={s.id}>
            {s.name} — ${s.price}
          </li>
        ))}
      </ul>

      <h2>Barbers</h2>
      <ul>
        {barbers.map((b) => (
          <li key={b.id}>{b.name}</li>
        ))}
      </ul>

      <h2>Create Appointment</h2>

      <select onChange={(e) => setSelectedService(e.target.value)}>
        <option>Select service</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <br />
      <br />

      <select onChange={(e) => setSelectedBarber(e.target.value)}>
        <option>Select barber</option>
        {barbers.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <br />
      <br />

      <input type="date" onChange={(e) => setDate(e.target.value)} />

      <br />
      <br />

      <button onClick={createBooking}>Create Appointment</button>

      <h2>My Appointments</h2>

      {safeAppointments.length === 0 ? (
        <p>No appointments yet</p>
      ) : (
        <ul>
          {safeAppointments.map((a) => (
            <li key={a.id}>
              {a.date} — {a.time} — {a.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
