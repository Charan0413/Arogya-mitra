import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";
import {
  FaCalendarAlt,
  FaDumbbell,
  FaUtensils,
  FaClipboardList,
  FaBolt,
  FaArrowRight,
  FaChartLine,
} from "react-icons/fa";
import "./Dashboard.css";

function Dashboard() {
  const name = localStorage.getItem("full_name") || "User";

  return (
    <>
      <Navbar />
      <div className="dash-page">
        {/* ── hero ── */}
        <header className="dash-hero">
          <div className="dash-hero-content">
            <span className="am-badge">
              <FaBolt /> AI-POWERED
            </span>
            <h1>Welcome back, {name.split(" ")[0]}</h1>
            <p>
              Your personalised health dashboard powered by <strong>AROMI</strong>.
              Track workouts, nutrition, and your weekly schedule.
            </p>
          </div>
          <div className="dash-hero-deco">
            <div className="dash-circle dash-c1" />
            <div className="dash-circle dash-c2" />
            <div className="dash-hero-icon">
              <FaChartLine size={48} />
            </div>
          </div>
        </header>

        {/* ── quick actions ── */}
        <div className="dash-actions">
          <Link to="/workout-plan" className="dash-action-card">
            <div className="dash-action-icon dash-ic-blue">
              <FaDumbbell size={22} />
            </div>
            <div className="dash-action-text">
              <h3>Workout Plan</h3>
              <p>View your AI workout</p>
            </div>
            <FaArrowRight className="dash-action-arrow" />
          </Link>

          <Link to="/nutrition-plan" className="dash-action-card">
            <div className="dash-action-icon dash-ic-green">
              <FaUtensils size={22} />
            </div>
            <div className="dash-action-text">
              <h3>Nutrition Plan</h3>
              <p>View your meal plan</p>
            </div>
            <FaArrowRight className="dash-action-arrow" />
          </Link>

          <Link to="/weekly-plan" className="dash-action-card">
            <div className="dash-action-icon dash-ic-purple">
              <FaClipboardList size={22} />
            </div>
            <div className="dash-action-text">
              <h3>Weekly Plan</h3>
              <p>See your 7-day schedule</p>
            </div>
            <FaArrowRight className="dash-action-arrow" />
          </Link>

          <Link to="/calendar" className="dash-action-card">
            <div className="dash-action-icon dash-ic-coral">
              <FaCalendarAlt size={22} />
            </div>
            <div className="dash-action-text">
              <h3>Calendar</h3>
              <p>Saved plans on dates</p>
            </div>
            <FaArrowRight className="dash-action-arrow" />
          </Link>
        </div>

        {/* ── chat ── */}
        <ChatBox />
      </div>
    </>
  );
}

export default Dashboard;
