import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { FaBolt, FaDumbbell } from "react-icons/fa";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("full_name", res.data.full_name);

      // Check if health profile already exists
      try {
        const healthCheck = await api.get(`/health/check/${res.data.user_id}`);
        if (healthCheck.data.exists) {
          window.location.replace("/dashboard");
        } else {
          window.location.replace("/health");
        }
      } catch {
        window.location.replace("/health");
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Invalid email or password. Please try again.";
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
          <p className="auth-tagline">AI Health & Fitness Coach</p>
          <div className="auth-features">
            <div className="auth-feature">
              <FaBolt size={14} />
              <span>AI-powered workout plans</span>
            </div>
            <div className="auth-feature">
              <FaBolt size={14} />
              <span>Personalised nutrition guidance</span>
            </div>
            <div className="auth-feature">
              <FaBolt size={14} />
              <span>Track your weekly schedule</span>
            </div>
          </div>
        </div>
        <div className="auth-left-circle auth-lc1" />
        <div className="auth-left-circle auth-lc2" />
      </div>

      {/* right panel — form */}
      <div className="auth-right">
        <div className="auth-form-card">
          <span className="am-badge">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="auth-subtitle">Enter your credentials to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin}>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            New User? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
