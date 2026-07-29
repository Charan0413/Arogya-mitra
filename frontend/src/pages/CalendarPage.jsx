import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import FloatingChat from "../components/FloatingChat";
import api from "../services/api";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaTimes,
  FaBolt,
  FaCheckCircle,
  FaDumbbell,
  FaAppleAlt,
} from "react-icons/fa";
import "./CalendarPage.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ── strip markdown artifacts ── */
function stripMd(s) {
  return s
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/(?<!\w)\*(?!\*)/g, "")
    .trim();
}

function CalendarPage() {
  const [plans, setPlans] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [streakDates, setStreakDates] = useState(new Set());

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const res = await api.get(`/weekly-plan/${userId}`, { params: { t: Date.now() } });
        setPlans(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlans();
  }, []);

  /* ── fetch streak data for current month ── */
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;
        const res = await api.get(`/streak/calendar/${userId}`, {
          params: { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 },
        });
        setStreakDates(new Set(res.data.dates || []));
      } catch {
        // non-critical
      }
    };
    fetchStreak();
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const planDates = {};
  plans.forEach((p) => {
    if (!planDates[p.plan_date]) planDates[p.plan_date] = [];
    planDates[p.plan_date].push(p);
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDelete = async (planId) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await api.delete(`/weekly-plan/${planId}`);
      setPlans(plans.filter((p) => p.id !== planId));
      setSelectedPlan(null);
    } catch (err) {
      console.error(err);
    }
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];

  return (
    <>
      <Navbar />
      <div className="cal-page">
        {/* hero */}
        <header className="cal-hero">
          <div className="cal-hero-content">
            <span className="am-badge">
              <FaBolt /> SAVED PLANS
            </span>
            <h1>My Calendar</h1>
            <p>
              View your saved daily workout plans on a <strong>monthly calendar</strong>.
              Each day's plan lives on its own date.
            </p>
          </div>
          <div className="cal-hero-deco">
            <div className="cal-circle cal-c1" />
            <div className="cal-circle cal-c2" />
            <div className="cal-hero-icon">
              <FaCalendarAlt size={48} />
            </div>
          </div>
        </header>

        {/* layout */}
        <div className="cal-layout">
          {/* calendar widget */}
          <div className="cal-widget">
            <div className="cal-nav">
              <button onClick={prevMonth}><FaChevronLeft /></button>
              <h2>{MONTH_NAMES[month]} {year}</h2>
              <button onClick={nextMonth}><FaChevronRight /></button>
            </div>
            <div className="cal-grid">
              {DAY_LABELS.map((l) => (
                <div key={l} className="cal-day-label">{l}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} className="cal-day-cell empty" />;
                const dateKey = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const hasPlan = planDates[dateKey];
                const isToday = dateKey === todayKey;
                const isStreak = streakDates.has(dateKey);
                return (
                  <div
                    key={i}
                    className={`cal-day-cell ${hasPlan ? "has-plan" : ""} ${isToday ? "today" : ""} ${isStreak ? "streak" : ""}`}
                    onClick={() => hasPlan && setSelectedPlan(hasPlan[0])}
                  >
                    <span className="cal-day-num">{day}</span>
                    {isStreak && (
                      <div className="cal-streak-dot" title="Streak day">🔥</div>
                    )}
                    {hasPlan && (
                      <div className="cal-dots">
                        {hasPlan[0].plan_data && <div className="cal-dot cal-dot-workout" />}
                        {hasPlan[0].nutrition_data && <div className="cal-dot cal-dot-nutrition" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* sidebar */}
          <div className="cal-sidebar">
            <h3>Saved Plans</h3>
            {plans.length === 0 ? (
              <div className="cal-no-plans">
                <p>No plans saved yet.</p>
                <p className="cal-hint">Go to Weekly Plan and click "Save to Calendar".</p>
              </div>
            ) : (
              <div className="cal-plan-list">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`cal-plan-item ${selectedPlan?.id === p.id ? "active" : ""}`}
                    onClick={() => setSelectedPlan(p)}
                  >
                    <div className="cal-plan-info">
                      <strong>{p.day_label}</strong>
                      <span>{p.plan_date}</span>
                      <div className="cal-plan-types">
                        {p.plan_data && <span className="cal-type-badge cal-type-workout"><FaDumbbell size={10} /> Workout</span>}
                        {p.nutrition_data && <span className="cal-type-badge cal-type-nutrition"><FaAppleAlt size={10} /> Nutrition</span>}
                      </div>
                    </div>
                    <button className="cal-delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* modal */}
        {selectedPlan && (
          <div className="cal-modal-overlay" onClick={() => setSelectedPlan(null)}>
            <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cal-modal-header">
                <div className="cal-modal-title">
                  <FaCheckCircle size={18} />
                  <h2>{selectedPlan.day_label}</h2>
                </div>
                <button className="cal-modal-close" onClick={() => setSelectedPlan(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="cal-modal-meta">
                <span>{selectedPlan.plan_date}</span>
                <div className="cal-modal-types">
                  {selectedPlan.plan_data && <span className="cal-type-badge cal-type-workout"><FaDumbbell size={10} /> Workout</span>}
                  {selectedPlan.nutrition_data && <span className="cal-type-badge cal-type-nutrition"><FaAppleAlt size={10} /> Nutrition</span>}
                </div>
              </div>
              <div className="cal-modal-body">
                {/* Workout section */}
                {selectedPlan.plan_data && (
                  <div className="cal-modal-section">
                    <div className="cal-modal-section-head cal-section-workout">
                      <FaDumbbell size={14} />
                      <h3>Workout Plan</h3>
                    </div>
                    <div className="cal-modal-content">
                      {selectedPlan.plan_data.split("\n").map((line, i) => {
                        const trimmed = stripMd(line);
                        if (!trimmed) return <br key={i} />;
                        const isSection =
                          /^warm/i.test(trimmed) || /^main/i.test(trimmed) ||
                          /^cool/i.test(trimmed) || /^exercise/i.test(trimmed) ||
                          /^cardio/i.test(trimmed) || /^stretch/i.test(trimmed) ||
                          /^sets/i.test(trimmed) || /^reps/i.test(trimmed) ||
                          /^rest/i.test(trimmed) || /^notes/i.test(trimmed) ||
                          /^tips/i.test(trimmed) || /^duration/i.test(trimmed) ||
                          /^focus/i.test(trimmed);
                        const isBullet = /^[-•*]\s/.test(trimmed);
                        const clean = isBullet ? trimmed.replace(/^[-•*]\s*/, "") : trimmed;
                        return (
                          <div key={i} className={`cal-line ${isBullet ? "cal-bullet" : ""} ${isSection ? "cal-section-line" : ""}`}>
                            {isBullet && <span className="cal-line-dot" />}
                            <span>{clean}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Nutrition section */}
                {selectedPlan.nutrition_data && (
                  <div className="cal-modal-section">
                    <div className="cal-modal-section-head cal-section-nutrition">
                      <FaAppleAlt size={14} />
                      <h3>Nutrition Plan</h3>
                    </div>
                    <div className="cal-modal-content">
                      {selectedPlan.nutrition_data.split("\n").map((line, i) => {
                        const trimmed = stripMd(line);
                        if (!trimmed) return <br key={i} />;
                        const isMeal =
                          /^breakfast|^lunch|^dinner|^snack|^morning|^afternoon|^evening|^pre[- ]?workout|^post[- ]?workout/i.test(trimmed);
                        const isBullet = /^[-•*]\s/.test(trimmed);
                        const clean = isBullet ? trimmed.replace(/^[-•*]\s*/, "") : trimmed;
                        return (
                          <div key={i} className={`cal-line ${isBullet ? "cal-bullet" : ""} ${isMeal ? "cal-section-line" : ""}`}>
                            {isBullet && <span className="cal-line-dot cal-dot-green" />}
                            <span>{clean}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <FloatingChat />
      </div>
    </>
  );
}

export default CalendarPage;
