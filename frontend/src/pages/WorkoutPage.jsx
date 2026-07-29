import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

import {
  FaDumbbell,
  FaFire,
  FaBolt,
  FaCalendarDay,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaClipboardList,
  FaTrophy,
  FaHeart,
} from "react-icons/fa";

import "./WorkoutPage.css";

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

/* ── strip markdown artifacts ── */
function stripMd(s) {
  return s
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\*/g, "")
    .trim();
}

/* ── detect if a line is a day heading ── */
function isDayHeading(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^day\s*\d+/i.test(t)) return true;
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(t)) return true;
  return false;
}

/* ── split raw AI text into day objects ── */
function parseDays(raw) {
  if (!raw) return [];
  const lines = raw.split("\n").map(stripMd);
  const days = [];
  let cursor = null;
  let buf = [];

  for (const ln of lines) {
    if (isDayHeading(ln)) {
      if (cursor !== null) days.push({ label: cursor, body: buf.join("\n").trim() });
      cursor = ln;
      buf = [];
    } else {
      buf.push(ln);
    }
  }
  if (cursor !== null) days.push({ label: cursor, body: buf.join("\n").trim() });

  /* fallback — no headings → equal chunks */
  if (!days.length && raw.trim()) {
    const meaningful = lines.filter((l) => l.trim());
    if (meaningful.length) {
      const n = Math.min(meaningful.length, 7);
      const sz = Math.ceil(meaningful.length / n);
      for (let i = 0; i < n; i++) {
        const s = meaningful.slice(i * sz, (i + 1) * sz).join("\n").trim();
        if (s) days.push({ label: `Day ${i + 1}`, body: s });
      }
    }
  }
  return days;
}

/* ── map day index → weekday name based on a start date ── */
function getWeekdayForIndex(startDate, index) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + index);
  return WEEKDAYS[d.getDay()];
}

/* ── estimate calories burned per exercise line ── */
function estimateCalories(text) {
  const t = text.toLowerCase();
  // high intensity
  if (/\b(sprint|burpee|jump|plyo|hike|swim|run|sprint|hiit|box jump|mountain climber)\b/.test(t)) return 75;
  // compound lifts
  if (/\b(squat|deadlift|bench|press|clean|snatch|row|pull[\s-]?up|chin[\s-]?up|lunge|dip)\b/.test(t)) return 60;
  // moderate exercises
  if (/\b(curl|raise|extension|fly|kickback|bridge|plank|push[\s-]?up|sit[\s-]?up|crunch|rotation)\b/.test(t)) return 40;
  // light / stretches
  if (/\b(stretch|walk|warm[\s-]?up|cool[\s-]?down|foam|roll|balance|yoga)\b/.test(t)) return 25;
  // default
  return 35;
}

/* ── extract individual exercises from day body ── */
function extractExercises(body) {
  if (!body) return [];
  const lines = body.split("\n").map(stripMd).filter(Boolean);
  const exercises = [];
  for (const ln of lines) {
    const t = ln.replace(/^[-•*]\s*/, "").trim();
    if (!t) continue;
    // skip section headers / labels / blank meta
    if (/^(warm[\s-]|main[\s-]|cool[\s-]|exercise|cardio|stretch|sets|reps|rest|notes|tips|summary|hydration|duration|focus|total|day\s)/i.test(t)) continue;
    // skip lines that are just numbers or very short meta like "3 x 12"
    if (/^\d+\s*[x×]\s*\d+/i.test(t)) continue;
    if (t.length < 3) continue;
    exercises.push({ text: t, calories: estimateCalories(t) });
  }
  return exercises;
}

/* ── workout line renderer ── */
function WorkoutLine({ text }) {
  const t = stripMd(text.trim());
  if (!t) return null;
  const isBullet = /^[-•*]\s/.test(t);
  const clean = isBullet ? t.replace(/^[-•*]\s*/, "") : t;
  if (!clean) return null;

  const isSection =
    /^warm[\s-]/i.test(clean) || /^main[\s-]/i.test(clean) ||
    /^cool[\s-]/i.test(clean) || /^exercise/i.test(clean) ||
    /^cardio/i.test(clean) || /^stretch/i.test(clean) ||
    /^sets/i.test(clean) || /^reps/i.test(clean) ||
    /^rest/i.test(clean) || /^notes/i.test(clean) ||
    /^tips/i.test(clean) || /^summary/i.test(clean) ||
    /^hydration/i.test(clean) || /^duration/i.test(clean) ||
    /^focus/i.test(clean);

  return (
    <div className={`wk-line ${isBullet ? "wk-bullet" : ""} ${isSection ? "wk-section" : ""}`}>
      {isBullet && <span className="wk-dot" />}
      <span>{clean}</span>
    </div>
  );
}

/* ═══════════════════ COMPONENT ═══════════════════ */
function WorkoutPage() {
  const [plan, setPlan] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dayIndex, setDayIndex] = useState(0);
  const [checked, setChecked] = useState({}); // { [dayIdx]: Set<exerciseIndex> }

  /* ── persist checked state per day in localStorage ── */
  const STORAGE_KEY = "wk_checked";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert arrays back to Sets
        const restored = {};
        for (const [k, v] of Object.entries(parsed)) {
          restored[k] = new Set(v);
        }
        setChecked(restored);
      }
    } catch {}
  }, []);

  const saveChecked = (next) => {
    setChecked(next);
    // Serialize Sets to arrays for localStorage
    const serializable = {};
    for (const [k, v] of Object.entries(next)) {
      serializable[k] = [...v];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  };

  const toggleExercise = (dayIdx, exIdx) => {
    const current = checked[dayIdx] || new Set();
    const next = new Set(current);
    if (next.has(exIdx)) next.delete(exIdx);
    else next.add(exIdx);
    const newChecked = { ...checked, [dayIdx]: next };
    saveChecked(newChecked);

    /* ── sync streak immediately ── */
    const exs = extractExercises(days[dayIdx]?.body || "");
    const newIsComplete = exs.length > 0 && next.size === exs.length;
    const userId = localStorage.getItem("user_id");
    let logDate;
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + dayIdx);
      logDate = d.toISOString().split("T")[0];
    } else {
      logDate = new Date().toISOString().split("T")[0];
    }
    if (userId) {
      api.post("/streak/log", {
        user_id: parseInt(userId, 10),
        log_date: logDate,
        workout_done: newIsComplete,
      }).then(() => {
        window.dispatchEvent(new CustomEvent("streak-updated"));
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const results = await Promise.allSettled([
          api.get(`/workout-plan/${userId}`, { params: { t: Date.now() } }),
          api.get(`/weekly-plan/${userId}`, { params: { t: Date.now() } }),
        ]);

        if (results[0].status === "fulfilled") {
          setPlan(results[0].value.data.plan || "");
        }

        // Determine start date from calendar entries
        if (results[1].status === "fulfilled" && results[1].value.data.length > 0) {
          const firstDate = results[1].value.data[0].plan_date;
          setStartDate(firstDate);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const allDays = parseDays(plan);

  // Map "Day 1" → actual weekday
  const days = allDays.map((d, i) => ({
    ...d,
    weekday: startDate
      ? getWeekdayForIndex(startDate, i)
      : WEEKDAYS[(new Date().getDay() - allDays.length + i + 7) % 7] || d.label,
  }));

  // Default to today's index
  const todayDayOfWeek = new Date().getDay();
  let todayIndex = 0;
  if (startDate) {
    // Calculate days since start
    const start = new Date(startDate);
    const now = new Date();
    todayIndex = Math.floor((now - start) / 86400000);
    if (todayIndex < 0) todayIndex = 0;
    if (todayIndex >= days.length) todayIndex = days.length - 1;
  } else {
    // No calendar data — find day matching today's weekday
    const idx = days.findIndex((d) =>
      d.weekday.toLowerCase() === WEEKDAYS[todayDayOfWeek].toLowerCase()
    );
    todayIndex = idx >= 0 ? idx : 0;
  }

  // Use dayIndex state (user can navigate)
  const currentIndex = dayIndex;
  const currentDay = days[currentIndex];

  // Initialize to today on first load
  useEffect(() => {
    if (!loading && days.length > 0 && dayIndex === 0) {
      setDayIndex(todayIndex);
    }
  }, [loading, days.length]);

  /* ── sync streak on initial load (pre-ticked boxes) ── */
  useEffect(() => {
    if (loading || !days.length) return;
    const exs = extractExercises(days[currentIndex]?.body || "");
    if (!exs.length) return;
    const allDone = (checked[currentIndex]?.size || 0) === exs.length;
    if (!allDone) return;
    // All boxes ticked on load → sync to backend
    const userId = localStorage.getItem("user_id");
    let logDate;
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + currentIndex);
      logDate = d.toISOString().split("T")[0];
    } else {
      logDate = new Date().toISOString().split("T")[0];
    }
    if (userId) {
      api.post("/streak/log", {
        user_id: parseInt(userId, 10),
        log_date: logDate,
        workout_done: true,
      }).then(() => {
        window.dispatchEvent(new CustomEvent("streak-updated"));
      }).catch(() => {});
    }
    // only run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const prevDay = () => setDayIndex((i) => Math.max(0, i - 1));
  const nextDay = () => setDayIndex((i) => Math.min(days.length - 1, i + 1));

  return (
    <>
      <Navbar />
      <div className="wk-page">
        <header className="wk-hero">
          <div className="wk-hero-content">
            <span className="wk-badge">
              <FaBolt /> AI-GENERATED
            </span>
            <h1>Today's Workout</h1>
            <p>
              Personalised by <strong>AROMI</strong> based on your health
              profile. Navigate between days to see each session.
            </p>
          </div>
          <div className="wk-hero-decoration">
            <div className="wk-circle wk-c1" />
            <div className="wk-circle wk-c2" />
            <div className="wk-dumbbell-icon">
              <FaDumbbell size={52} />
            </div>
          </div>
        </header>

        {/* ── stats strip ── */}
        {days.length > 0 && (
          <div className="wk-stats">
            <div className="wk-stat">
              <FaCalendarDay />
              <div>
                <strong>{days.length}</strong>
                <span>Days Total</span>
              </div>
            </div>
            <div className="wk-stat">
              <FaFire />
              <div>
                <strong>{currentDay?.weekday || "—"}</strong>
                <span>Today's Focus</span>
              </div>
            </div>
            <div className="wk-stat">
              <FaClock />
              <div>
                <strong>~60 min</strong>
                <span>Per Session</span>
              </div>
            </div>
          </div>
        )}

        {/* loading */}
        {loading && (
          <div className="wk-loading">
            <div className="wk-spinner" />
            <p>Loading your plan…</p>
          </div>
        )}

        {/* ── day navigation ── */}
        {!loading && days.length > 0 && (
          <div className="wk-day-nav">
            <button
              className="wk-nav-btn"
              onClick={prevDay}
              disabled={currentIndex === 0}
            >
              <FaChevronLeft />
            </button>
            <div className="wk-day-pills">
              {days.map((d, i) => (
                <button
                  key={i}
                  className={`wk-pill ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setDayIndex(i)}
                >
                  {d.weekday?.substring(0, 3) || `D${i + 1}`}
                </button>
              ))}
            </div>
            <button
              className="wk-nav-btn"
              onClick={nextDay}
              disabled={currentIndex === days.length - 1}
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        {/* ── single day card + progress tracker ── */}
        {!loading && currentDay && (
          <div className="wk-content-row">
            {/* main workout card */}
            <div className="wk-single-card">
              <div className="wk-single-top">
                <span className="wk-single-badge">
                  Day {currentIndex + 1} of {days.length}
                </span>
                <h2>{currentDay.weekday}</h2>
                <p className="wk-single-sublabel">{currentDay.label}</p>
              </div>
              <div className="wk-single-body">
                {currentDay.body.split("\n").map((ln, j) => (
                  <WorkoutLine key={j} text={ln} />
                ))}
              </div>
            </div>

            {/* progress tracker card */}
            <ProgressTracker
              key={currentIndex}
              exercises={extractExercises(currentDay.body)}
              dayIndex={currentIndex}
              checked={checked[currentIndex] || new Set()}
              onToggle={(exIdx) => toggleExercise(currentIndex, exIdx)}
              startDate={startDate}
              dayOffset={currentIndex}
            />
          </div>
        )}

        {/* empty */}
        {!loading && !plan && (
          <div className="wk-empty">
            <div className="wk-empty-ring">
              <FaFire size={42} />
            </div>
            <h2>No Workout Plan Yet</h2>
            <p>
              Ask the AROMI chatbot to generate your personalised workout plan
              and it will appear here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════ PROGRESS TRACKER ═══════════════════ */
function ProgressTracker({ exercises, dayIndex, checked, onToggle, startDate, dayOffset }) {
  const total = exercises.length;
  const done = checked.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;

  /* ── calories ── */

  /* ── calories ── */
  const totalCalories = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.calories, 0),
    [exercises]
  );
  const burnedCalories = useMemo(
    () => exercises.reduce((sum, ex, i) => (checked.has(i) ? sum + ex.calories : sum), 0),
    [exercises, checked]
  );

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="wk-tracker">
      <div className="wk-tracker-header">
        <FaClipboardList className="wk-tracker-icon" />
        <h3>Progress Tracker</h3>
      </div>

      {/* ring progress */}
      <div className="wk-tracker-ring-wrap">
        <svg viewBox="0 0 100 100" className="wk-tracker-ring">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#eef1f6" strokeWidth="7" />
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={isComplete ? "#22c55e" : "var(--am-purple)"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s" }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="wk-tracker-pct">
          {isComplete ? <FaTrophy className="wk-trophy" /> : <span>{pct}%</span>}
        </div>
      </div>

      <p className="wk-tracker-count">
        {done} / {total} exercises completed
      </p>

      {/* ── calories burned card ── */}
      <div className="wk-calories-card">
        <div className="wk-calories-top">
          <FaFire className="wk-calories-icon" />
          <span className="wk-calories-label">Calories Burned</span>
        </div>
        <div className="wk-calories-row">
          <span className="wk-calories-big">{burnedCalories}</span>
          <span className="wk-calories-total">/ {totalCalories} kcal</span>
        </div>
        <div className="wk-calories-bar-bg">
          <div
            className="wk-calories-bar-fill"
            style={{
              width: totalCalories ? `${(burnedCalories / totalCalories) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {/* exercise list */}
      <div className="wk-tracker-list">
        {exercises.map((ex, i) => {
          const ticked = checked.has(i);
          return (
            <label key={i} className={`wk-tracker-item ${ticked ? "done" : ""}`}>
              <input
                type="checkbox"
                checked={ticked}
                onChange={() => onToggle(i)}
              />
              <span className="wk-tracker-check">
                {ticked && <FaCheckCircle />}
              </span>
              <span className="wk-tracker-text">{ex.text}</span>
              <span className="wk-tracker-cal">{ex.calories} kcal</span>
            </label>
          );
        })}
      </div>

      {isComplete && (
        <div className="wk-tracker-complete">
          <FaTrophy /> Day complete — great work!
        </div>
      )}
    </div>
  );
}

export default WorkoutPage;
