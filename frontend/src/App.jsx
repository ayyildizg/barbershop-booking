import { useEffect, useState } from "react";

function App() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    fetch("https://barbershop-api-j6w4.onrender.com/services")
      .then((res) => res.json())
      .then((data) => setServices(data));

    fetch("https://barbershop-api-j6w4.onrender.com/barbers")
      .then((res) => res.json())
      .then((data) => setBarbers(data));
  }, []);

  const createBooking = () => {
    alert(
      `Appointment created:
Service: ${selectedService}
Barber: ${selectedBarber}
Date: ${date}`,
    );
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Barbershop Booking System</h1>

      <h2>Available Services</h2>
      <ul>
        {services.map((service) => (
          <li key={service.id}>
            {service.name} — ${service.price}
          </li>
        ))}
      </ul>

      <h2>Our Barbers</h2>
      <ul>
        {barbers.map((barber) => (
          <li key={barber.id}>{barber.name}</li>
        ))}
      </ul>

      <h2>Create Appointment</h2>

      <div>
        <label>Service:</label>
        <select onChange={(e) => setSelectedService(e.target.value)}>
          <option>Select service</option>
          {services.map((service) => (
            <option key={service.id}>{service.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Barber:</label>
        <select onChange={(e) => setSelectedBarber(e.target.value)}>
          <option>Select barber</option>
          {barbers.map((barber) => (
            <option key={barber.id}>{barber.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Date:</label>
        <input type="date" onChange={(e) => setDate(e.target.value)} />
      </div>

      <br />

      <button onClick={createBooking}>Create Appointment</button>
    </div>
  );
}

export default App;
