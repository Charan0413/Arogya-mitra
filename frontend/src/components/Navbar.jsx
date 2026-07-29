import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const fullName = localStorage.getItem("full_name") || "User";
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;
        const res = await api.get(`/streak/current/${userId}`);
        setStreak(res.data.current_streak || 0);
      } catch {
        // silently ignore — streak is non-critical
      }
    };
    fetchStreak();
    // refresh every 30s as fallback
    const iv = setInterval(fetchStreak, 30000);
    // instant refresh when streak-updated event fires
    const onStreakUpdate = () => fetchStreak();
    window.addEventListener("streak-updated", onStreakUpdate);
    return () => {
      clearInterval(iv);
      window.removeEventListener("streak-updated", onStreakUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="sidebar">

      <div>

        <div className="sidebar-header">
          <h2>ArogyaMitra</h2>
          <p>AI Health Coach</p>
        </div>

        <div className="sidebar-links">

          <Link
            to="/dashboard"
            className={location.pathname === "/dashboard" ? "active" : ""}
          >
            🏠 Dashboard
          </Link>

          <Link
            to="/workout-plan"
            className={location.pathname === "/workout-plan" ? "active" : ""}
          >
            🏋 Workout Plan
          </Link>

          <Link
            to="/nutrition-plan"
            className={location.pathname === "/nutrition-plan" ? "active" : ""}
          >
            🥗 Nutrition Plan
          </Link>

          <Link
            to="/weekly-plan"
            className={location.pathname === "/weekly-plan" ? "active" : ""}
          >
            📋 Weekly Plan
          </Link>

          <Link
            to="/calendar"
            className={location.pathname === "/calendar" ? "active" : ""}
          >
            📅 Calendar
          </Link>

        </div>
      </div>

      <div className="sidebar-bottom">

        {/* ── streak badge (always visible) ── */}
        <div className={"sidebar-streak" + (streak === 0 ? " zero" : "")}>
          {streak > 0 ? (
            <>
              <span className="sidebar-streak-fire">🔥</span>
              <span className="sidebar-streak-count">{streak}</span>
            </>
          ) : (
            <>
              <span className="sidebar-streak-zero">🔥</span>
              <span className="sidebar-streak-count">0</span>
            </>
          )}
          <span className="sidebar-streak-label">day streak</span>
        </div>

        <p className="welcome">
          Welcome,
          <br />
          <strong>{fullName}</strong>
        </p>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </div>
  );
}

export default Navbar;
