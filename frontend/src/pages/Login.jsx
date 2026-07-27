import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.access_token);
    localStorage.setItem("user_id", res.data.user_id);
    localStorage.setItem("full_name", res.data.full_name);

    window.location.replace("/health");

  } catch (err) {
    alert("Invalid Email or Password");
    console.error(err);
  }
};

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>ArogyaMitra</h1>
        <p>Your AI Health & Fitness Coach</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        <p>
          New User? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;