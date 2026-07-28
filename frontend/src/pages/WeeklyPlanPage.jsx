import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  FaDumbbell,
  FaFire,
  FaBolt,
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaArrowRight,
  FaAppleAlt,
} from "react-icons/fa";
import "./WeeklyPlanPage.css";

const ACCENT = [
  "#6c5ce7",
  "#0984e3",
  "#00b894",
  "#e17055",
  "#d63031",
  "#00cec9",
  "#e84393",
];

/* ── strip markdown ── */
function stripMd(s) {
  return s
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/(?<!\w)\*(?!\*)/g, "")
    .trim();
}

/* ── parse plan text into day chunks ── */
function parseDays(planText) {
  if (!planText) return [];
  const lines = planText.split("\n").map(stripMd);
  const days = [];
  let cur = null;
  let buf = [];
  const pats = [/^day\s*(\d+)/i, /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i];
  for (const ln of lines) {
    const t = ln.trim();
    let hit = false;
    for (const p of pats) {
      if (p.test(t)) {
        if (cur !== null) days.push({ label: cur, content: buf.join("\n") });
        cur = t;
        buf = [];
        hit = true;
        break;
      }
    }
    if (!hit && t) buf.push(ln);
  }
  if (cur !== null) days.push({ label: cur, content: buf.join("\n") });

  /* fallback — chunk by lines */
  if (!days.length && planText.trim()) {
    const meaningful = lines.filter((l) => l.trim());
    if (meaningful.length) {
      const n = Math.min(meaningful.length, 7);
      const sz = Math.ceil(meaningful.length / n);
      for (let i = 0; i < n; i++) {
        const s = meaningful.slice(i * sz, (i + 1) * sz).join("\n").trim();
        if (s) days.push({ label: `Day ${i + 1}`, content: s });
      }
    }
  }
  return days;
}

/* ── extract exercise names from workout content ── */
function extractExercises(content) {
  if (!content) return { sections: [], exercises: [] };
  const lines = content.split("\n").map(stripMd).filter(Boolean);
  const sections = [];
  const exercises = [];

  const sectionRe =
    /^warm[- ]?up|^main\s*workout|^cool[- ]?down|^exercise|^cardio|^strength|^stretch|^hiit|^circuit|^focus/i;
  const skipRe =
    /^duration|^rest\s*(between|after)|^total|^note|^tip|^hydrate|^focus|^sets\s*&|^reps\s*&/i;

  for (const ln of lines) {
    const t = ln.trim();
    if (!t) continue;
    if (sectionRe.test(t)) {
      sections.push(t.replace(/[:\-–]+$/, ""));
      continue;
    }
    if (skipRe.test(t)) continue;

    /* lines with sets/reps are likely exercise names */
    const hasSets = /\d+\s*(sets|reps|times|x)/i.test(t);
    const isList = /^[-•*]\s/.test(t) || /^\d+[.)]\s/.test(t);
    if (hasSets || isList) {
      const name = t
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .replace(/\s*[-–:]\s*(\d+\s*(sets|reps|times).*?)$/i, "")
        .replace(/\s*[-–]\s*\d+\s*(sets|reps).*$/i, "")
        .trim();
      if (name.length > 2 && name.length < 80) exercises.push(name);
    }
  }

  return { sections, exercises: [...new Set(exercises)].slice(0, 12) };
}

/* ── extract meals from nutrition content ── */
function extractMeals(content) {
  if (!content) return { meals: [], calories: "" };
  const lines = content.split("\n").map(stripMd).filter(Boolean);
  const meals = [];
  let totalCal = "";

  const mealRe =
    /^(breakfast|lunch|dinner|snack|morning snack|afternoon snack|evening snack|pre[- ]?workout|post[- ]?workout)[:\s]*/i;
  const calRe = /(\d{3,5})\s*(kcal|cal|calories)/i;

  for (const ln of lines) {
    const t = ln.trim();
    if (!t) continue;
    const calMatch = t.match(calRe);
    if (/^total|^daily total|^overall/i.test(t) && calMatch) {
      totalCal = calMatch[1] + " kcal";
      continue;
    }
    const m = t.match(mealRe);
    if (m) {
      const mealName = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      const rest = t.slice(m[0].length).trim();
      const items = rest
        .split(/[,;]\s*/)
        .map((s) => s.replace(/^[-–:•*]\s*/, "").trim())
        .filter((s) => s.length > 1 && s.length < 100);
      const cal = calMatch ? calMatch[1] + " kcal" : "";
      meals.push({ name: mealName, items: items.slice(0, 5), cal });
    }
  }

  return { meals: meals.slice(0, 6), calories: totalCal };
}

/* ══════════════════════════════════════════════════════════════ */
function WeeklyPlanPage() {
  const navigate = useNavigate();
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [nutritionPlan, setNutritionPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const results = await Promise.allSettled([
          api.get(`/workout-plan/${userId}`, { params: { t: Date.now() } }),
          api.get(`/nutrition-plan/${userId}`, { params: { t: Date.now() } }),
        ]);
        if (results[0].status === "fulfilled") setWorkoutPlan(results[0].value.data.plan || results[0].value.data.workout_plan || "");
        if (results[1].status === "fulfilled") setNutritionPlan(results[1].value.data.plan || results[1].value.data.nutrition_plan || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSaveToCalendar = async () => {
    if (!workoutPlan) return;
    setSaving(true);
    try {
      const userId = Number(localStorage.getItem("user_id"));
      const wDays = parseDays(workoutPlan);
      const nDays = parseDays(nutritionPlan);
      const today = new Date();
      const dayEntries = wDays.map((d, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return {
          user_id: userId,
          title: d.label,
          day_label: d.label,
          plan_data: d.content,
          nutrition_data: i < nDays.length ? nDays[i].content : "",
          plan_date: date.toISOString().split("T")[0],
        };
      });
      await api.post("/weekly-plan/save", { days: dayEntries });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save plan to calendar.");
    } finally {
      setSaving(false);
    }
  };

  const workoutDays = parseDays(workoutPlan);
  const nutritionDays = parseDays(nutritionPlan);
  const hasData = workoutDays.length > 0 || nutritionDays.length > 0;

  return (
    <>
      <Navbar />
      <div className="wp-page">
        {/* ── hero ── */}
        <header className="wp-hero">
          <div className="wp-hero-content">
            <span className="am-badge">
              <FaBolt /> {workoutDays.length > 0 ? `${Math.max(workoutDays.length, nutritionDays.length)}-DAY SCHEDULE` : "WEEKLY SCHEDULE"}
            </span>
            <h1>Weekly Plan</h1>
            <p>
              Your personalised fitness & nutrition schedule by <strong>AROMI</strong>.
              Save it to your calendar to stay on track.
            </p>
          </div>
          <div className="wp-hero-deco">
            <div className="wp-circle wp-c1" />
            <div className="wp-circle wp-c2" />
            <div className="wp-hero-icon">
              <FaClipboardList size={48} />
            </div>
          </div>
        </header>

        {/* ── action bar ── */}
        {hasData && (
          <div className="wp-action-bar">
            <div className="wp-action-info">
              <FaDumbbell size={20} />
              <span>
                {workoutDays.length > 0 && `${workoutDays.length} workout days`}
                {workoutDays.length > 0 && nutritionDays.length > 0 && " · "}
                {nutritionDays.length > 0 && `${nutritionDays.length} meal plans`}
              </span>
            </div>
            <button
              className={`wp-save-btn ${saved ? "wp-saved" : ""}`}
              onClick={handleSaveToCalendar}
              disabled={saving || !workoutPlan}
            >
              {saved ? (
                <><FaCheckCircle /> Saved!</>
              ) : saving ? (
                "Saving..."
              ) : (
                <><FaCalendarCheck /> Save to Calendar</>
              )}
            </button>
          </div>
        )}

        {/* loading */}
        {loading && (
          <div className="wp-loading">
            <div className="wp-spinner" />
            <p>Loading your plans...</p>
          </div>
        )}

        {/* ═══ WORKOUT SECTION ═══ */}
        {!loading && workoutDays.length > 0 && (
          <section className="wp-section">
            <div className="wp-section-header">
              <div className="wp-section-icon wp-icon-workout">
                <FaDumbbell size={20} />
              </div>
              <div>
                <h2>Workout Plan</h2>
                <p>{workoutDays.length}-day training schedule</p>
              </div>
            </div>
            <div className="wp-grid">
              {workoutDays.map((d, i) => {
                const { sections, exercises } = extractExercises(d.content);
                return (
                  <article
                    key={i}
                    className="wp-card"
                    style={{ "--accent": ACCENT[i % ACCENT.length] }}
                  >
                    <div className="wp-card-top">
                      <span className="wp-card-num">{String(i + 1).padStart(2, "0")}</span>
                      <h3>{d.label}</h3>
                    </div>
                    <div className="wp-card-body">
                      {sections.length > 0 && (
                        <div className="wp-tag-row">
                          {sections.map((s, si) => (
                            <span key={si} className="wp-tag">{s}</span>
                          ))}
                        </div>
                      )}
                      {exercises.length > 0 ? (
                        <ul className="wp-exercise-list">
                          {exercises.map((ex, ei) => (
                            <li key={ei}>
                              <span className="wp-exercise-dot" />
                              {ex}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="wp-fallback-text">
                          {d.content.split("\n").filter(Boolean).slice(0, 4).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="wp-card-footer">
                      <span className="wp-card-tag wp-tag-workout">
                        <FaDumbbell size={11} /> Workout
                      </span>
                      <FaArrowRight className="wp-card-arrow" />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ NUTRITION SECTION ═══ */}
        {!loading && nutritionDays.length > 0 && (
          <section className="wp-section">
            <div className="wp-section-header">
              <div className="wp-section-icon wp-icon-nutrition">
                <FaAppleAlt size={20} />
              </div>
              <div>
                <h2>Nutrition Plan</h2>
                <p>{nutritionDays.length}-day meal schedule</p>
              </div>
            </div>
            <div className="wp-grid">
              {nutritionDays.map((d, i) => {
                const { meals, calories } = extractMeals(d.content);
                return (
                  <article
                    key={i}
                    className="wp-card wp-card-nutrition"
                    style={{ "--accent": ACCENT[(i + 3) % ACCENT.length] }}
                  >
                    <div className="wp-card-top">
                      <span className="wp-card-num wp-num-nutrition">{String(i + 1).padStart(2, "0")}</span>
                      <h3>{d.label}</h3>
                    </div>
                    <div className="wp-card-body">
                      {meals.length > 0 ? (
                        <div className="wp-meals">
                          {meals.map((m, mi) => (
                            <div key={mi} className="wp-meal">
                              <div className="wp-meal-head">
                                <span className="wp-meal-name">{m.name}</span>
                                {m.cal && <span className="wp-meal-cal">{m.cal}</span>}
                              </div>
                              {m.items.length > 0 && (
                                <p className="wp-meal-items">{m.items.join(", ")}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="wp-fallback-text">
                          {d.content.split("\n").filter(Boolean).slice(0, 4).join(" · ")}
                        </p>
                      )}
                      {calories && (
                        <div className="wp-total-cal">
                          <FaFire size={13} /> {calories}
                        </div>
                      )}
                    </div>
                    <div className="wp-card-footer">
                      <span className="wp-card-tag wp-tag-nutrition">
                        <FaAppleAlt size={11} /> Nutrition
                      </span>
                      <FaArrowRight className="wp-card-arrow" />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* empty */}
        {!loading && !hasData && (
          <div className="wp-empty">
            <div className="wp-empty-ring">
              <FaFire size={42} />
            </div>
            <h2>No Plan Yet</h2>
            <p>Generate a workout or nutrition plan from the chatbot to see your weekly schedule here.</p>
            <div className="wp-empty-btns">
              <button className="wp-go-btn" onClick={() => navigate("/workout-plan")}>
                <FaDumbbell /> Workout Plan
              </button>
              <button className="wp-go-btn wp-go-alt" onClick={() => navigate("/nutrition-plan")}>
                <FaAppleAlt /> Nutrition Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default WeeklyPlanPage;
