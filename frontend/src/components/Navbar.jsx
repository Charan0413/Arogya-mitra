import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const fullName = localStorage.getItem("full_name") || "User";

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