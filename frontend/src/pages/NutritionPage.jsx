import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import FloatingChat from "../components/FloatingChat";
import api from "../services/api";
import {
  FaLeaf,
  FaFire,
  FaBolt,
  FaUtensils,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaClipboardList,
  FaTrophy,
  FaAppleAlt,
} from "react-icons/fa";
import "./NutritionPage.css";

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
    .replace(/(?<!\w)\*(?!\*)/g, "")
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

/* ── map day index → weekday name ── */
function getWeekdayForIndex(startDate, index) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + index);
  return WEEKDAYS[d.getDay()];
}

/* ── parse calories from a text line ── */
function parseCalories(text) {
  const t = text.toLowerCase();
  // "300 kcal" / "300 calories" / "300 cal" / "300 k cal"
  const m = t.match(/(\d{2,4})\s*(kcal|calories?|cal)\b/);
  if (m) return parseInt(m[1], 10);
  // "calories: 300"
  const m2 = t.match(/calories?\s*[:=]\s*(\d{2,4})/);
  if (m2) return parseInt(m2[1], 10);
  return 0;
}

/* ── extract meals from a day's body ── */
function extractMeals(body) {
  if (!body) return [];
  const lines = body.split("\n").map(stripMd).filter(Boolean);
  const meals = [];
  const MEAL_HEADER = /^(breakfast|lunch|dinner|snack|meal\s*\d|morning|afternoon|evening)/i;
  const SKIP = /^(total|calories|protein|carbs?|fats?|fiber|water|hydration|macros?|nutrients?|notes?|tips?)/i;

  let currentMeal = null;
  let currentMealFull = null;
  let buf = [];

  for (const raw of lines) {
    const t = raw.replace(/^[-•*]\s*/, "").trim();
    if (!t) continue;

    if (MEAL_HEADER.test(t)) {
      // save previous meal
      if (currentMeal) {
        const mealText = buf.join("\n").trim();
        const cal = parseCalories(currentMealFull) || parseCalories(mealText) || estimateMealCalories(currentMeal);
        meals.push({ name: currentMeal, text: mealText, calories: cal });
      }
      currentMealFull = t;
      currentMeal = t.replace(/[:\-–].*$/, "").trim();
      buf = [];
    } else if (!SKIP.test(t) && currentMeal) {
      buf.push(t);
    }
  }

  // save last meal
  if (currentMeal) {
    const mealText = buf.join("\n").trim();
    const cal = parseCalories(currentMealFull) || parseCalories(mealText) || estimateMealCalories(currentMeal);
    meals.push({ name: currentMeal, text: mealText, calories: cal });
  }

  // fallback: if no headers found, treat each meaningful line as a meal item
  if (!meals.length) {
    for (const raw of lines) {
      const t = raw.replace(/^[-•*]\s*/, "").trim();
      if (!t || SKIP.test(t)) continue;
      const cal = parseCalories(t);
      if (cal > 0 || t.length > 5) {
        meals.push({ name: t.substring(0, 60), text: t, calories: cal || 250 });
      }
    }
  }

  return meals;
}

/* ── rough calorie estimate per meal type ── */
function estimateMealCalories(name) {
  const n = name.toLowerCase();
  if (/breakfast/.test(n)) return 350;
  if (/lunch/.test(n)) return 500;
  if (/dinner/.test(n)) return 550;
  if (/snack/.test(n)) return 200;
  return 300;
}

/* ── nutrition line renderer ── */
function NutritionLine({ text }) {
  const t = stripMd(text.trim());
  if (!t) return null;
  const isBullet = /^[-•*]\s/.test(t);
  const clean = isBullet ? t.replace(/^[-•*]\s*/, "") : t;
  if (!clean) return null;
  const isSection =
    /^breakfast/i.test(clean) || /^lunch/i.test(clean) ||
    /^dinner/i.test(clean) || /^snack/i.test(clean) ||
    /^meal/i.test(clean) || /^calories/i.test(clean) ||
    /^total/i.test(clean) || /^protein/i.test(clean) ||
    /^carbs/i.test(clean) || /^fats/i.test(clean) ||
    /^fiber/i.test(clean) || /^water/i.test(clean) ||
    /^hydration/i.test(clean);

  return (
    <div className={`nut-line ${isBullet ? "nut-bullet" : ""} ${isSection ? "nut-section" : ""}`}>
      {isBullet && <span className="nut-dot" />}
      <span>{clean}</span>
    </div>
  );
}

/* ═══════════════════ COMPONENT ═══════════════════ */
function NutritionPage() {
  const [plan, setPlan] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dayIndex, setDayIndex] = useState(0);
  const [checked, setChecked] = useState({});

  /* ── persist checked state per day ── */
  const STORAGE_KEY = "nut_checked";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
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
    const serializable = {};
    for (const [k, v] of Object.entries(next)) {
      serializable[k] = [...v];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  };

  const toggleMeal = (dayIdx, mealIdx) => {
    const current = checked[dayIdx] || new Set();
    const next = new Set(current);
    if (next.has(mealIdx)) next.delete(mealIdx);
    else next.add(mealIdx);
    const newChecked = { ...checked, [dayIdx]: next };
    saveChecked(newChecked);

    /* ── sync streak immediately ── */
    const meals = extractMeals(days[dayIdx]?.body || "");
    const newIsComplete = meals.length > 0 && next.size === meals.length;
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
        nutrition_done: newIsComplete,
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
          api.get(`/nutrition-plan/${userId}`, { params: { t: Date.now() } }),
          api.get(`/weekly-plan/${userId}`, { params: { t: Date.now() } }),
        ]);

        if (results[0].status === "fulfilled") {
          setPlan(results[0].value.data.plan || "");
        }

        if (results[1].status === "fulfilled" && results[1].value.data.length > 0) {
          setStartDate(results[1].value.data[0].plan_date);
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

  const days = allDays.map((d, i) => ({
    ...d,
    weekday: startDate
      ? getWeekdayForIndex(startDate, i)
      : WEEKDAYS[(new Date().getDay() - allDays.length + i + 7) % 7] || d.label,
  }));

  const todayDayOfWeek = new Date().getDay();
  let todayIndex = 0;
  if (startDate) {
    const start = new Date(startDate);
    const now = new Date();
    todayIndex = Math.floor((now - start) / 86400000);
    if (todayIndex < 0) todayIndex = 0;
    if (todayIndex >= days.length) todayIndex = days.length - 1;
  } else {
    const idx = days.findIndex((d) =>
      d.weekday.toLowerCase() === WEEKDAYS[todayDayOfWeek].toLowerCase()
    );
    todayIndex = idx >= 0 ? idx : 0;
  }

  const currentIndex = dayIndex;
  const currentDay = days[currentIndex];

  useEffect(() => {
    if (!loading && days.length > 0 && dayIndex === 0) {
      setDayIndex(todayIndex);
    }
  }, [loading, days.length]);

  /* ── sync streak on initial load (pre-ticked boxes) ── */
  useEffect(() => {
    if (loading || !days.length) return;
    const meals = extractMeals(days[currentIndex]?.body || "");
    if (!meals.length) return;
    const allDone = (checked[currentIndex]?.size || 0) === meals.length;
    if (!allDone) return;
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
        nutrition_done: true,
      }).then(() => {
        window.dispatchEvent(new CustomEvent("streak-updated"));
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const prevDay = () => setDayIndex((i) => Math.max(0, i - 1));
  const nextDay = () => setDayIndex((i) => Math.min(days.length - 1, i + 1));

  const currentMeals = useMemo(
    () => (currentDay ? extractMeals(currentDay.body) : []),
    [currentDay]
  );

  return (
    <>
      <Navbar />
      <div className="nut-page">
        <header className="nut-hero">
          <div className="nut-hero-content">
            <span className="am-badge">
              <FaBolt /> AI-GENERATED
            </span>
            <h1>Today's Nutrition</h1>
            <p>
              Personalised by <strong>AROMI</strong> based on your health profile.
              Meal-by-meal breakdown with calorie guidance.
            </p>
          </div>
          <div className="nut-hero-deco">
            <div className="nut-circle nut-c1" />
            <div className="nut-circle nut-c2" />
            <div className="nut-hero-icon">
              <FaUtensils size={48} />
            </div>
          </div>
        </header>

        {/* ── stats ── */}
        {days.length > 0 && (
          <div className="nut-stats">
            <div className="nut-stat">
              <FaLeaf />
              <div>
                <strong>{days.length} Days</strong>
                <span>Meal Plan</span>
              </div>
            </div>
            <div className="nut-stat">
              <FaFire />
              <div>
                <strong>{currentDay?.weekday || "—"}</strong>
                <span>Today's Meals</span>
              </div>
            </div>
            <div className="nut-stat">
              <FaClock />
              <div>
                <strong>4 Meals</strong>
                <span>Per Day</span>
              </div>
            </div>
          </div>
        )}

        {/* loading */}
        {loading && (
          <div className="nut-loading">
            <div className="nut-spinner" />
            <p>Loading your plan...</p>
          </div>
        )}

        {/* ── day navigation pills ── */}
        {!loading && days.length > 0 && (
          <div className="nut-day-nav">
            <button className="nut-nav-btn" onClick={prevDay} disabled={currentIndex === 0}>
              <FaChevronLeft />
            </button>
            <div className="nut-day-pills">
              {days.map((d, i) => (
                <button
                  key={i}
                  className={`nut-pill ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setDayIndex(i)}
                >
                  {d.weekday?.substring(0, 3) || `D${i + 1}`}
                </button>
              ))}
            </div>
            <button className="nut-nav-btn" onClick={nextDay} disabled={currentIndex === days.length - 1}>
              <FaChevronRight />
            </button>
          </div>
        )}

        {/* ── single day card + meal tracker ── */}
        {!loading && currentDay && (
          <div className="nut-content-row">
            {/* main nutrition card */}
            <div className="nut-single-card">
              <div className="nut-single-top">
                <span className="nut-single-badge">
                  Day {currentIndex + 1} of {days.length}
                </span>
                <h2>{currentDay.weekday}</h2>
                <p className="nut-single-sublabel">{currentDay.label}</p>
              </div>
              <div className="nut-single-body">
                {currentDay.body.split("\n").map((ln, j) => (
                  <NutritionLine key={j} text={ln} />
                ))}
              </div>
            </div>

            {/* meal tracker card */}
            <MealTracker
              key={currentIndex}
              meals={currentMeals}
              dayIndex={currentIndex}
              checked={checked[currentIndex] || new Set()}
              onToggle={(mealIdx) => toggleMeal(currentIndex, mealIdx)}
              startDate={startDate}
              dayOffset={currentIndex}
            />
          </div>
        )}

        {/* empty */}
          {!loading && !plan && (
          <div className="nut-empty">
            <div className="nut-empty-ring">
              <FaLeaf size={42} />
            </div>
            <h2>No Nutrition Plan Yet</h2>
            <p>
              Ask the AROMI chatbot to generate your personalised nutrition plan
              and it will appear here.
            </p>
            <Link to="/dashboard" className="nut-empty-btn">
              💬 Open Chat
            </Link>
          </div>
        )}
        <FloatingChat />
      </div>
    </>
  );
}

/* ═══════════════════ MEAL TRACKER ═══════════════════ */
function MealTracker({ meals, dayIndex, checked, onToggle, startDate, dayOffset }) {
  const total = meals.length;
  const done = checked.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;

  const totalCalories = useMemo(
    () => meals.reduce((sum, m) => sum + m.calories, 0),
    [meals]
  );
  const consumedCalories = useMemo(
    () => meals.reduce((sum, m, i) => (checked.has(i) ? sum + m.calories : sum), 0),
    [meals, checked]
  );

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="nut-tracker">
      <div className="nut-tracker-header">
        <FaClipboardList className="nut-tracker-icon" />
        <h3>Meal Tracker</h3>
      </div>

      {/* ring progress */}
      <div className="nut-tracker-ring-wrap">
        <svg viewBox="0 0 100 100" className="nut-tracker-ring">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#eef1f6" strokeWidth="7" />
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={isComplete ? "#22c55e" : "var(--am-teal)"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s" }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="nut-tracker-pct">
          {isComplete ? <FaTrophy className="nut-trophy" /> : <span>{pct}%</span>}
        </div>
      </div>

      <p className="nut-tracker-count">
        {done} / {total} meals logged
      </p>

      {/* ── calories consumed card ── */}
      <div className="nut-calories-card">
        <div className="nut-calories-top">
          <FaAppleAlt className="nut-calories-icon" />
          <span className="nut-calories-label">Calories Consumed</span>
        </div>
        <div className="nut-calories-row">
          <span className="nut-calories-big">{consumedCalories}</span>
          <span className="nut-calories-total">/ {totalCalories} kcal</span>
        </div>
        <div className="nut-calories-bar-bg">
          <div
            className="nut-calories-bar-fill"
            style={{
              width: totalCalories ? `${(consumedCalories / totalCalories) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {/* meal list */}
      <div className="nut-tracker-list">
        {meals.map((meal, i) => {
          const ticked = checked.has(i);
          return (
            <label key={i} className={`nut-tracker-item ${ticked ? "done" : ""}`}>
              <input
                type="checkbox"
                checked={ticked}
                onChange={() => onToggle(i)}
              />
              <span className="nut-tracker-check">
                {ticked && <FaCheckCircle />}
              </span>
              <div className="nut-tracker-meal-info">
                <span className="nut-tracker-text">{meal.name}</span>
                {meal.text && meal.text !== meal.name && (
                  <span className="nut-tracker-details">{meal.text.substring(0, 80)}{meal.text.length > 80 ? "..." : ""}</span>
                )}
              </div>
              <span className="nut-tracker-cal">{meal.calories} kcal</span>
            </label>
          );
        })}
      </div>

      {isComplete && (
        <div className="nut-tracker-complete">
          <FaTrophy /> All meals logged — great discipline!
        </div>
      )}
    </div>
  );
}

export default NutritionPage;
