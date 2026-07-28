import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

import {
  FaDumbbell,
  FaFire,
  FaBolt,
  FaCalendarDay,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";

import "./WorkoutPage.css";

/* ── colour palette per day card ── */
const ACCENT = [
  "#6C5CE7",
  "#0984E3",
  "#00B894",
  "#E17055",
  "#D63031",
  "#00CEC9",
  "#E84393",
];

/* ── strip markdown artifacts from a line ── */
function stripMd(s) {
  return s
    .replace(/^#{1,6}\s*/, "")       // ### headings
    .replace(/\*\*\*/g, "")          // *** horizontal rules / bold-italic
    .replace(/\*\*/g, "")            // ** bold
    .replace(/__/g, "")              // __ bold
    .replace(/\*/g, "")              // any remaining single *
    .trim();
}

/* ── detect if a line is a day heading ── */
function isDayHeading(line) {
  const t = line.trim();
  if (!t) return false;
  /* matches: Day 1, Day 1:, Day 1 -, Day1, day 1, DAY 1, Monday, Tuesday... */
  if (/^day\s*\d+/i.test(t)) return true;
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(t)) return true;
  return false;
}

/* ── split raw AI text into intro + day objects ── */
function parseDays(raw) {
  if (!raw) return { intro: "", days: [] };

  const lines = raw.split("\n");

  /* strip markdown FIRST from every line */
  const stripped = lines.map(stripMd);

  const days = [];
  let cursor = null;
  let buf = [];
  let introBuf = [];

  for (const ln of stripped) {
    if (isDayHeading(ln)) {
      if (cursor !== null) {
        days.push({ label: cursor, body: buf.join("\n").trim() });
      } else {
        introBuf = [...buf];
      }
      cursor = ln;
      buf = [];
    } else {
      buf.push(ln);
    }
  }
  if (cursor !== null) {
    days.push({ label: cursor, body: buf.join("\n").trim() });
  }

  /* fallback — no day headings found → split into equal chunks */
  if (!days.length && raw.trim()) {
    const meaningful = stripped.filter((l) => l.trim());
    if (meaningful.length) {
      /* use the actual number of lines to decide chunk count, never exceed it */
      const chunkCount = Math.min(meaningful.length, 7);
      const chunk = Math.ceil(meaningful.length / chunkCount);
      for (let i = 0; i < chunkCount; i++) {
        const slice = meaningful
          .slice(i * chunk, (i + 1) * chunk)
          .join("\n")
          .trim();
        if (slice) days.push({ label: `Day ${i + 1}`, body: slice });
      }
    }
    return { intro: "", days };
  }

  return { intro: introBuf.join("\n").trim(), days };
}

/* ── tiny helper: line → styled fragment ── */
function WorkoutLine({ text }) {
  const t = stripMd(text.trim());
  if (!t) return null;

  const isBullet = /^[-•*]\s/.test(t);
  const clean = isBullet ? t.replace(/^[-•*]\s*/, "") : t;
  if (!clean) return null;

  const isSection =
    /^warm[\s-]/i.test(clean) ||
    /^main[\s-]/i.test(clean) ||
    /^cool[\s-]/i.test(clean) ||
    /^exercise/i.test(clean) ||
    /^cardio/i.test(clean) ||
    /^stretch/i.test(clean) ||
    /^sets/i.test(clean) ||
    /^reps/i.test(clean) ||
    /^rest/i.test(clean) ||
    /^notes/i.test(clean) ||
    /^tips/i.test(clean) ||
    /^summary/i.test(clean) ||
    /^hydration/i.test(clean) ||
    /^duration/i.test(clean) ||
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const res = await api.get(`/workout-plan/${userId}`, {
          params: { t: Date.now() },
        });
        setPlan(res.data.plan);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const { intro, days } = parseDays(plan);

  return (
    <>
      <Navbar />

      <div className="wk-page">
        <header className="wk-hero">
          <div className="wk-hero-content">
            <span className="wk-badge">
              <FaBolt /> AI-GENERATED
            </span>
            <h1>Your Workout Plan</h1>
            <p>
              Personalised by <strong>AROMI</strong> based on your health
              profile. Tap any day to see the full session.
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

        {/* ── plan overview (AI intro text) ── */}
        {intro && (
          <div className="wk-intro">
            {intro.split("\n").map((line, i) => {
              const trimmed = stripMd(line);
              if (!trimmed) return <br key={i} />;
              return <p key={i}>{trimmed}</p>;
            })}
          </div>
        )}

        {/* ── stats strip ── */}
        {days.length > 0 && (
          <div className="wk-stats">
            <div className="wk-stat">
              <FaCalendarDay />
              <div>
                <strong>{days.length}</strong>
                <span>Days</span>
              </div>
            </div>
            <div className="wk-stat">
              <FaFire />
              <div>
                <strong>Active</strong>
                <span>Plan Ready</span>
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

        {/* ── loading ── */}
        {loading && (
          <div className="wk-loading">
            <div className="wk-spinner" />
            <p>Loading your plan…</p>
          </div>
        )}

        {/* ── day cards — 100% dynamic from parsed days array ── */}
        {!loading && days.length > 0 && (
          <div className="wk-grid">
            {days.map((d, i) => (
              <article
                key={i}
                className="wk-card"
                style={{ "--accent": ACCENT[i % ACCENT.length] }}
              >
                <div className="wk-card-top">
                  <span className="wk-card-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{d.label}</h3>
                </div>

                <div className="wk-card-body">
                  {d.body.split("\n").map((ln, j) => (
                    <WorkoutLine key={j} text={ln} />
                  ))}
                </div>

                <div className="wk-card-footer">
                  <span className="wk-card-tag">
                    <FaDumbbell size={12} /> Session
                  </span>
                  <FaArrowRight className="wk-card-arrow" />
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── empty state ── */}
        {!loading && !plan && (
          <div className="wk-empty">
            <div className="wk-empty-ring">
              <FaFire size={42} />
            </div>
            <h2>No Workout Plan Yet</h2>
            <p>
              Ask the AROMI chatbot to generate your personalised workout plan
              and it will appear here as beautifully structured day cards.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default WorkoutPage;
