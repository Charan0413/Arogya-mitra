import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { FaUserPlus, FaDumbbell, FaBolt } from "react-icons/fa";
import "../pages/Login.css";
import "./Register.css";

function Register() {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // ── client-side password validation ──
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/register", {
        full_name,
        email,
        password,
      });

      // ── auto-login: backend now returns token ──
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("full_name", res.data.full_name);

      // ── new user → go straight to health form ──
      window.location.replace("/health");
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Registration failed. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* left panel — branding */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <FaDumbbell size={32} />
          </div>
          <h1>ArogyaMitra</h1>
          <p className="auth-tagline">Start your fitness journey</p>
          <div className="auth-features">
            <div className="auth-feature">
              <FaBolt size={14} />
              <span>Free AI-powered coaching</span>
            </div>
            <div className="auth-feature">
              <FaBolt size={14} />
              <span>Personalised diet & workout plans</span>
            </div>
            <div className="auth-feature">
              <FaBolt size={14} />
              <span>Weekly schedule with calendar sync</span>
            </div>
          </div>
        </div>
        <div className="auth-left-circle auth-lc1" />
        <div className="auth-left-circle auth-lc2" />
      </div>

      {/* right panel — form */}
      <div className="auth-right">
        <div className="auth-form-card">
          <span className="am-badge">
            <FaUserPlus size={11} /> CREATE ACCOUNT
          </span>
          <h2>Join ArogyaMitra</h2>
          <p className="auth-subtitle">Create your free account to get started</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
