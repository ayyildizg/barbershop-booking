import { useEffect, useState } from "react";

function App() {
  const API_URL = "http://localhost:3001";
  const token = localStorage.getItem("token");

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
  const [time, setTime] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [adminHistory, setAdminHistory] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const times = [
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  // ✅ USER APPOINTMENTS
  const getAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/appointments/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const allAppointments = Array.isArray(data) ? data : [];

      setAppointments(
        allAppointments.filter(
          (a) => a.deleted !== true && a.status !== "rejected",
        ),
      );

      setHistoryAppointments(
        allAppointments.filter(
          (a) => a.deleted === true || a.status === "rejected",
        ),
      );
    } catch (err) {
      console.error(err);
      setAppointments([]);
      setHistoryAppointments([]);
    }
  };

  // ✅ ADMIN APPOINTMENTS
  const getAdminAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const allAppointments = Array.isArray(data) ? data : [];

      setAdminAppointments(allAppointments.filter((a) => a.deleted !== true));
      setAdminHistory(allAppointments.filter((a) => a.deleted === true));
    } catch (err) {
      console.error(err);
      setAdminAppointments([]);
      setAdminHistory([]);
    }
  };

  // ✅ GET REVIEWS
  const getReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setReviews([]);
    }
  };

  // ✅ LOAD USER
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    try {
      if (savedUser && savedUser !== "undefined") {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  // ✅ LOAD SERVICES + BARBERS
  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((res) => res.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_URL}/barbers`)
      .then((res) => res.json())
      .then((data) => setBarbers(Array.isArray(data) ? data : []))
      .catch(console.error);

    getReviews();
  }, []);

  // ✅ LOAD USER DATA
  useEffect(() => {
    if (user?.id) {
      getAppointments();
      if (user.role === "admin") {
        getAdminAppointments();
      }
    }
  }, [user]);

  // ✅ LOAD BOOKED TIMES
  useEffect(() => {
    if (selectedBarber && date) {
      fetch(
        `${API_URL}/available-times?barber_id=${selectedBarber}&date=${date}`,
      )
        .then((res) => res.json())
        .then((data) => setBookedTimes(data))
        .catch(console.error);
    }
  }, [selectedBarber, date]);

  // ✅ UPDATE STATUS
  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/admin/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      getAppointments();
      if (user.role === "admin") {
        getAdminAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ LOGIN / REGISTER
  const handleAuth = async () => {
    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      const loggedUser = isLogin ? data.user : data;

      localStorage.setItem("user", JSON.stringify(loggedUser));

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setUser(loggedUser);
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  // ✅ DELETE APPOINTMENT
  const deleteAppointment = async (id) => {
    try {
      await fetch(`${API_URL}/appointments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      await getAppointments();
      if (user?.role === "admin") {
        await getAdminAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ CREATE BOOKING
  const createBooking = async () => {
    if (!selectedService || !selectedBarber || !date || !time) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          barber_id: Number(selectedBarber),
          service_id: Number(selectedService),
          date,
          time,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert("Appointment created");
      getAppointments();
      if (user.role === "admin") {
        getAdminAppointments();
      }

      fetch(
        `${API_URL}/available-times?barber_id=${selectedBarber}&date=${date}`,
      )
        .then((res) => res.json())
        .then((data) => setBookedTimes(data));
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ CREATE REVIEW
  const createReview = async () => {
    if (!reviewText || !selectedAppointment) return;

    try {
      await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          appointment_id: selectedAppointment,
          comment: reviewText,
          rating,
        }),
      });

      setReviewText("");
      setSelectedAppointment(null);
      getReviews();
      alert("Review added");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ LOGIN PAGE
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 flex items-center justify-center px-4 md:px-6">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-10 w-full max-w-md shadow-[0_0_60px_rgba(139,92,246,0.25)]">
          <div className="mb-8">
            <p className="text-yellow-400 tracking-[0.4em] text-sm mb-3">
              ÉLAN
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Beauty Lounge
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">
              Premium Beauty & Appointment Experience
            </p>
          </div>

          {!isLogin && (
            <input
              className="w-full mb-4 p-4 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-violet-500 transition"
              placeholder="Name"
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            className="w-full mb-4 p-4 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-violet-500 transition"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full mb-6 p-4 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-violet-500 transition"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleAuth}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition rounded-xl p-4 font-semibold text-white shadow-lg"
          >
            {isLogin ? "Login" : "Register"}
          </button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-slate-400 hover:text-white transition"
          >
            Switch to {isLogin ? "Register" : "Login"}
          </button>
        </div>
      </div>
    );
  }

  // ✅ DASHBOARD
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white p-4 md:p-8 overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-2xl font-bold shadow-[0_0_30px_rgba(139,92,246,0.6)]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold capitalize">
                {user?.name}
              </h1>
              <p className="text-slate-400 break-all">{user?.email}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-lg text-sm font-semibold uppercase ${
                  user?.role === "admin" ? "bg-red-600" : "bg-slate-700"
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90 transition px-5 py-3 rounded-xl w-full md:w-auto shadow-lg"
          >
            Logout
          </button>
        </div>

        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-900/40 via-fuchsia-900/30 to-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-12 mb-10 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/20 blur-3xl rounded-full" />
          <div className="relative z-10">
            <p className="text-yellow-400 tracking-[0.4em] text-sm mb-4">
              ÉLAN
            </p>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Beauty Lounge
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed">
              Elevating beauty and self-care through a premium appointment
              experience.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-slate-900/70 border border-slate-700 px-5 py-3 rounded-2xl">
                ✨ Luxury Service
              </div>
              <div className="bg-slate-900/70 border border-slate-700 px-5 py-3 rounded-2xl">
                💎 Premium Experience
              </div>
              <div className="bg-slate-900/70 border border-slate-700 px-5 py-3 rounded-2xl">
                ⭐ Top Rated Studio
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
            <p className="text-4xl mb-3">⭐</p>
            <h3 className="text-3xl font-black">{reviews.length}+</h3>
            <p className="text-slate-400 mt-2">Reviews</p>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
            <p className="text-4xl mb-3">💎</p>
            <h3 className="text-3xl font-black">{services.length}</h3>
            <p className="text-slate-400 mt-2">Services</p>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
            <p className="text-4xl mb-3">👥</p>
            <h3 className="text-3xl font-black">{barbers.length}</h3>
            <p className="text-slate-400 mt-2">Specialists</p>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
            <p className="text-4xl mb-3">✨</p>
            <h3 className="text-3xl font-black">24/7</h3>
            <p className="text-slate-400 mt-2">Booking</p>
          </div>
        </div>

        {/* GRID - CREATE ve USER APPOINTMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CREATE */}
          <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-800 shadow-[0_0_35px_rgba(139,92,246,0.12)] hover:shadow-[0_0_45px_rgba(139,92,246,0.2)] transition">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              ✨ Create Appointment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className={`p-5 rounded-2xl border transition duration-300 text-left ${
                    selectedService == s.id
                      ? "border-violet-500 bg-violet-600/20 shadow-[0_0_25px_rgba(139,92,246,0.35)]"
                      : "border-slate-700 bg-slate-800/70 hover:border-violet-400 hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">
                      {s.name === "Luxury Haircut" && "✂ Luxury Haircut"}
                      {s.name === "Premium Coloring" && "🎨 Premium Coloring"}
                      {s.name === "Skin Care Therapy" && "✨ Skin Care Therapy"}
                      {s.name === "VIP Styling Session" &&
                        "💎 VIP Styling Session"}
                      {s.name === "Bridal Makeup" && "💄 Bridal Makeup"}
                    </h3>
                    <span className="text-yellow-400 font-bold">
                      ${s.price}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Premium beauty experience
                  </p>

                  {/* ✅ SERVICE DESCRIPTION */}
                  <p className="text-slate-400 text-sm mt-2">
                    {s.name === "Luxury Haircut" &&
                      "Modern styling with premium care"}
                    {s.name === "Premium Coloring" &&
                      "Luxury coloring and hair treatment"}
                    {s.name === "Skin Care Therapy" &&
                      "Relaxing professional skin treatment"}
                    {s.name === "VIP Styling Session" &&
                      "Exclusive beauty styling experience"}
                    {s.name === "Bridal Makeup" &&
                      "Elegant makeup for special moments"}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBarber(b.id)}
                  className={`p-5 rounded-2xl border transition duration-300 text-left ${
                    selectedBarber == b.id
                      ? "border-fuchsia-500 bg-fuchsia-600/20 shadow-[0_0_25px_rgba(217,70,239,0.35)]"
                      : "border-slate-700 bg-slate-800/70 hover:border-fuchsia-400 hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{b.name}</h3>
                      <p className="text-slate-400 text-sm">
                        {b.name === "Sofia" && "Senior Stylist"}
                        {b.name === "Daniel" && "Color Expert"}
                        {b.name === "Emma" && "Makeup Artist"}
                        {b.name === "Olivia" && "Skin Care Specialist"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold shadow-lg">
                      {b.name.charAt(0)}
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">
                    Premium beauty experience
                  </p>
                </button>
              ))}
            </div>

            <input
              type="date"
              className="w-full mb-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-violet-500 outline-none transition"
              onChange={(e) => setDate(e.target.value)}
            />

            <select
              className="w-full mb-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-violet-500 outline-none transition"
              onChange={(e) => setTime(e.target.value)}
            >
              <option>Select time</option>
              {times
                .filter((t) => !bookedTimes.includes(t))
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>

            <button
              onClick={createBooking}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 hover:scale-[1.02] transition rounded-xl p-4 font-semibold shadow-lg"
            >
              Create Appointment
            </button>
          </div>

          {/* USER APPOINTMENTS */}
          <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-800 shadow-[0_0_35px_rgba(139,92,246,0.12)] hover:shadow-[0_0_45px_rgba(139,92,246,0.2)] transition">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              📅 My Appointments
            </h2>
            {appointments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-5xl mb-4">✨</p>
                <p className="text-slate-300 text-lg font-medium">
                  No appointments yet
                </p>
                <p className="text-slate-500 mt-2">
                  Book your first premium session
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 hover:border-violet-500 hover:-translate-y-1 transition duration-300 shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-lg">{a.date}</p>
                        <p className="text-slate-400">{a.time}</p>
                      </div>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <span
                          className={`px-4 py-2 rounded-xl font-semibold ${
                            a.status === "approved"
                              ? "bg-green-600"
                              : a.status === "rejected"
                                ? "bg-red-600"
                                : "bg-yellow-500 text-black"
                          }`}
                        >
                          {a.status === "approved"
                            ? "Approved"
                            : a.status === "rejected"
                              ? "Rejected"
                              : "Pending"}
                        </span>
                        {a.status === "pending" && (
                          <button
                            onClick={() => deleteAppointment(a.id)}
                            className="bg-red-600 hover:bg-red-700 hover:scale-105 transition px-4 py-2 rounded-xl"
                          >
                            Cancel
                          </button>
                        )}
                        {a.status === "approved" && (
                          <button
                            onClick={() => setSelectedAppointment(a.id)}
                            className="bg-violet-600 hover:bg-violet-700 hover:scale-105 transition px-4 py-2 rounded-xl"
                          >
                            Complete Service
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl mt-10 border border-slate-800 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            🕘 Appointment History
          </h2>
          {historyAppointments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-5xl mb-4">🕘</p>
              <p className="text-slate-300 text-lg font-medium">
                No history yet
              </p>
              <p className="text-slate-500 mt-2">
                Your completed appointments will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyAppointments.map((a) => (
                <div
                  key={a.id}
                  className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 hover:border-violet-500 hover:-translate-y-1 transition duration-300 shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-lg">{a.date}</p>
                      <p className="text-slate-400">{a.time}</p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-xl font-semibold ${
                        a.status === "approved"
                          ? "bg-green-600"
                          : a.status === "rejected"
                            ? "bg-red-600"
                            : "bg-gray-600"
                      }`}
                    >
                      {a.status === "rejected"
                        ? "Rejected"
                        : a.status === "approved"
                          ? "Completed"
                          : "Cancelled"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REVIEW FORM */}
        {selectedAppointment && (
          <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl mt-10 border border-slate-800 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Leave Review
            </h2>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl ${
                    rating >= star ? "text-yellow-400" : "text-slate-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your feedback..."
              className="w-full p-4 rounded-xl bg-slate-800/80 border border-slate-700 min-h-[120px] outline-none focus:border-violet-500 transition"
            />
            <button
              onClick={createReview}
              className="mt-4 bg-violet-600 hover:bg-violet-700 hover:scale-105 transition px-6 py-3 rounded-xl"
            >
              Submit Review
            </button>
          </div>
        )}

        {/* REVIEWS */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl mt-10 border border-slate-800 shadow-[0_0_40px_rgba(250,204,21,0.08)]">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            ⭐ Customer Reviews
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-5xl mb-4">⭐</p>
              <p className="text-slate-300 text-lg font-medium">
                No reviews yet
              </p>
              <p className="text-slate-500 mt-2">
                Customer feedback will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-slate-800/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700 hover:border-yellow-400 hover:-translate-y-1 transition duration-300 shadow-[0_0_25px_rgba(250,204,21,0.08)]"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(r.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">{r.user_name}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[15px]">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ADMIN PANEL */}
        {user?.role === "admin" && (
          <>
            <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl mt-10 border border-slate-800 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                🛠 Admin Panel
              </h2>
              <div className="space-y-4">
                {adminAppointments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-800/80 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-5 md:items-center border border-slate-700 hover:border-violet-500 hover:-translate-y-1 transition duration-300 shadow-lg"
                  >
                    <div>
                      <p className="font-bold text-lg md:text-xl">
                        User #{a.user_id}
                      </p>
                      <p>
                        {a.date} — {a.time}
                      </p>
                      <p>{a.status}</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      {a.status === "rejected" ? (
                        <button
                          onClick={() => deleteAppointment(a.id)}
                          className="bg-gray-700 hover:bg-gray-800 hover:scale-105 transition px-4 py-2 rounded-xl"
                        >
                          Delete
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => updateStatus(a.id, "approved")}
                            className="bg-green-600 hover:bg-green-700 hover:scale-105 transition px-4 py-2 rounded-xl"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(a.id, "rejected")}
                            className="bg-red-600 hover:bg-red-700 hover:scale-105 transition px-4 py-2 rounded-xl"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADMIN HISTORY */}
            <div className="bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl mt-10 border border-slate-800 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
              <h2 className="text-3xl font-bold mb-6">🗂 Admin History</h2>
              {adminHistory.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-5xl mb-4">🗂</p>
                  <p className="text-slate-300 text-lg font-medium">
                    No deleted appointments
                  </p>
                  <p className="text-slate-500 mt-2">
                    Deleted bookings will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {adminHistory.map((a) => (
                    <div
                      key={a.id}
                      className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 hover:border-violet-500 hover:-translate-y-1 transition duration-300 shadow-lg"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">User #{a.user_id}</p>
                          <p>
                            {a.date} — {a.time}
                          </p>
                        </div>
                        <span className="bg-gray-600 px-4 py-2 rounded-xl font-semibold">
                          Deleted
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* FOOTER */}
        <div className="mt-16 bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <p className="text-yellow-400 tracking-[0.3em] text-sm mb-3">
                ÉLAN
              </p>
              <h3 className="text-2xl font-black mb-4">Beauty Lounge</h3>
              <p className="text-slate-400 leading-relaxed">
                Premium beauty and self-care experience with modern booking
                technology.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">📍 Address</h4>
              <p className="text-slate-400">Yekaterinburg, Russia</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">📞 Contact</h4>
              <p className="text-slate-400 mb-2">+7 912 603 12 31</p>
              <p className="text-slate-400">hello@elanbeauty.com</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">✨ Working Hours</h4>
              <p className="text-slate-400 mb-2">Monday – Saturday</p>
              <p className="text-slate-400 mb-2">10:00 – 20:00</p>
              <p className="text-fuchsia-400">@elan.beauty</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-slate-500 text-sm">
            © 2026 ÉLAN Beauty Lounge. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
