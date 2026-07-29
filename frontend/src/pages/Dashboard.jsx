import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import FloatingChat from "../components/FloatingChat";
import api from "../services/api";
import {
  FaCalendarAlt,
  FaDumbbell,
  FaUtensils,
  FaClipboardList,
  FaBolt,
  FaArrowRight,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaFire,
} from "react-icons/fa";
import "./Dashboard.css";

const WEEKDAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* ── parse total calories from nutrition text ── */
function parseDailyCalories(text) {
  if (!text) return 0;
  const re = /(\d{2,4})\s*(kcal|calories?|cal)\b/gi;
  let total = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    total += parseInt(m[1], 10);
  }
  return total;
}

/* ── format date as short weekday (Mon-first) ── */
function formatWeekday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  // d.getDay(): 0=Sun, 1=Mon ... 6=Sat → rotate so Mon=0
  return WEEKDAY_SHORT[(d.getDay() + 6) % 7];
}

function Dashboard() {
  const rawName = localStorage.getItem("full_name");
  const name = rawName && rawName !== "undefined" ? rawName : "User";
  const userId = localStorage.getItem("user_id");

  const [streakData, setStreakData] = useState(null);
  const [history, setHistory] = useState([]);
  const [calorieDays, setCalorieDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      try {
        const [streakRes, histRes, plansRes] = await Promise.all([
          api.get(`/streak/current/${userId}`),
          api.get(`/streak/history/${userId}`),
          api.get(`/weekly-plan/${userId}`, { params: { t: Date.now() } }),
        ]);

        setStreakData(streakRes.data);

        setHistory(histRes.data.days || []);

        const plans = plansRes.data || [];
        const calByDate = {};
        for (const p of plans) {
          const total = parseDailyCalories(p.nutrition_data || "");
          if (total > 0) {
            calByDate[p.plan_date] = total;
          }
        }
        const days = histRes.data.days || [];
        const calDays = days.map((d) => ({
          date: d.log_date,
          calories: calByDate[d.log_date] || 0,
        }));
        setCalorieDays(calDays);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [userId]);

  const maxCalories = Math.max(...calorieDays.map((d) => d.calories), 1);

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

        {/* ── today's progress ── */}
        {!loading && streakData && (
          <div className="dash-section">
            <h2 className="dash-section-title">Today's Progress</h2>
            <div className="dash-progress-row">
              <div className="dash-prog-card dash-streak-card">
                <FaFire className="dash-prog-icon" />
                <div>
                  <span className="dash-prog-num">{streakData.current_streak}</span>
                  <span className="dash-prog-label">day streak</span>
                </div>
              </div>
              <div className="dash-prog-card">
                <FaDumbbell className="dash-prog-icon dash-ic-blue" />
                <div>
                  <span className="dash-prog-status">
                    {streakData.workout_today ? (
                      <><FaCheckCircle className="dash-check" /> Done</>
                    ) : (
                      <><FaTimesCircle className="dash-cross" /> Not done</>
                    )}
                  </span>
                  <span className="dash-prog-label">Workout</span>
                </div>
              </div>
              <div className="dash-prog-card">
                <FaUtensils className="dash-prog-icon dash-ic-green" />
                <div>
                  <span className="dash-prog-status">
                    {streakData.nutrition_today ? (
                      <><FaCheckCircle className="dash-check" /> Done</>
                    ) : (
                      <><FaTimesCircle className="dash-cross" /> Not done</>
                    )}
                  </span>
                  <span className="dash-prog-label">Nutrition</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── quick actions ── */}
        <div className="dash-section">
          <h2 className="dash-section-title">Quick Actions</h2>
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
        </div>

        {/* ── weekly heatmap ── */}
        {!loading && history.length > 0 && (
          <div className="dash-section">
            <h2 className="dash-section-title">This Week</h2>
            <div className="dash-heatmap">
              {history.map((day) => (
                <div key={day.log_date} className="dash-heat-day">
                  <span className="dash-heat-label">{formatWeekday(day.log_date)}</span>
                  <div className="dash-heat-dots">
                    <span
                      className={"dash-dot dash-dot-workout" + (day.workout_done ? " done" : "")}
                      title={day.workout_done ? "Workout done" : "Workout not done"}
                    />
                    <span
                      className={"dash-dot dash-dot-nutrition" + (day.nutrition_done ? " done" : "")}
                      title={day.nutrition_done ? "Nutrition done" : "Nutrition not done"}
                    />
                  </div>
                  <span className="dash-heat-date">
                    {day.log_date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── calorie trend chart ── */}
        {!loading && calorieDays.some((d) => d.calories > 0) && (
          <div className="dash-section">
            <h2 className="dash-section-title">Calorie Trend (7 days)</h2>
            <div className="dash-chart-wrap">
              <div className="dash-chart">
                {calorieDays.map((day) => {
                  const pct = day.calories > 0 ? (day.calories / maxCalories) * 100 : 0;
                  return (
                    <div key={day.date} className="dash-bar-col">
                      <span className="dash-bar-val">{day.calories || ""}</span>
                      <div className="dash-bar-track">
                        <div
                          className="dash-bar-fill"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <span className="dash-bar-label">{formatWeekday(day.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── floating chat ── */}
        <FloatingChat />
      </div>
    </>
  );
}

export default Dashboard;
