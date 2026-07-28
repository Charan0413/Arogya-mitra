import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  FaLeaf,
  FaFire,
  FaBolt,
  FaUtensils,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";
import "./NutritionPage.css";

const ACCENT = [
  "#00b894",
  "#0984e3",
  "#6c5ce7",
  "#e17055",
  "#d63031",
  "#00cec9",
  "#e84393",
];

/* ── strip markdown artifacts from a line ── */
function stripMd(s) {
  return s
    .replace(/^#{1,6}\s*/, "")       // ### headings
    .replace(/\*\*\*/g, "")          // *** horizontal rules / bold-italic
    .replace(/\*\*/g, "")            // ** bold
    .replace(/__/g, "")              // __ bold
    .replace(/(?<!\w)\*(?!\*)/g, "") // stray single * (not **)
    .trim();
}

function parseDays(raw) {
  if (!raw) return { intro: "", days: [] };

  /* strip markdown from every line first */
  const lines = raw.split("\n").map(stripMd);

  const days = [];
  let cursor = null;
  let buf = [];
  let introBuf = [];
  const DAY_RE =
    /^day\s*\d+|^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;

  for (const ln of lines) {
    if (DAY_RE.test(ln.trim())) {
      if (cursor !== null) {
        days.push({ label: cursor, body: buf.join("\n").trim() });
      } else {
        introBuf = [...buf];
      }
      cursor = ln.trim();
      buf = [];
    } else {
      buf.push(ln);
    }
  }
  if (cursor !== null) days.push({ label: cursor, body: buf.join("\n").trim() });

  /* fallback – no recognised headings → split into dynamic chunks */
  if (!days.length && raw.trim()) {
    const meaningful = lines.filter((l) => l.trim());
    if (meaningful.length) {
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

function NutritionLine({ text }) {
  const t = stripMd(text.trim());
  if (!t) return null;
  const isBullet = /^[-•*]\s/.test(t);
  const clean = isBullet ? t.replace(/^[-•*]\s*/, "") : t;
  if (!clean) return null;
  const isSection =
    /^breakfast/i.test(clean) ||
    /^lunch/i.test(clean) ||
    /^dinner/i.test(clean) ||
    /^snack/i.test(clean) ||
    /^meal/i.test(clean) ||
    /^calories/i.test(clean) ||
    /^total/i.test(clean) ||
    /^protein/i.test(clean) ||
    /^carbs/i.test(clean) ||
    /^fats/i.test(clean) ||
    /^fiber/i.test(clean) ||
    /^water/i.test(clean) ||
    /^hydration/i.test(clean);

  return (
    <div className={`nut-line ${isBullet ? "nut-bullet" : ""} ${isSection ? "nut-section" : ""}`}>
      {isBullet && <span className="nut-dot" />}
      <span>{clean}</span>
    </div>
  );
}

function NutritionPage() {
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const res = await api.get(`/nutrition-plan/${userId}`, { params: { t: Date.now() } });
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
      <div className="nut-page">
        {/* ── hero ── */}
        <header className="nut-hero">
          <div className="nut-hero-content">
            <span className="am-badge">
              <FaBolt /> AI-GENERATED
            </span>
            <h1>Your Nutrition Plan</h1>
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

        {/* ── plan overview (AI intro text) ── */}
        {intro && (
          <div className="nut-intro">
            {intro.split("\n").map((line, i) => {
              const trimmed = stripMd(line);
              if (!trimmed) return <br key={i} />;
              return <p key={i}>{trimmed}</p>;
            })}
          </div>
        )}

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
                <strong>Balanced</strong>
                <span>Nutrition</span>
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

        {/* ── loading ── */}
        {loading && (
          <div className="nut-loading">
            <div className="nut-spinner" />
            <p>Loading your plan...</p>
          </div>
        )}

        {/* ── day cards ── */}
        {!loading && days.length > 0 && (
          <div className="nut-grid">
            {days.map((d, i) => (
              <article
                key={i}
                className="nut-card"
                style={{ "--accent": ACCENT[i % ACCENT.length] }}
              >
                <div className="nut-card-top">
                  <span className="nut-card-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{d.label}</h3>
                </div>
                <div className="nut-card-body">
                  {d.body.split("\n").map((ln, j) => (
                    <NutritionLine key={j} text={ln} />
                  ))}
                </div>
                <div className="nut-card-footer">
                  <span className="nut-card-tag">
                    <FaUtensils size={12} /> Meal Plan
                  </span>
                  <FaArrowRight className="nut-card-arrow" />
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── empty ── */}
        {!loading && !plan && (
          <div className="nut-empty">
            <div className="nut-empty-ring">
              <FaLeaf size={42} />
            </div>
            <h2>No Nutrition Plan Yet</h2>
            <p>
              Ask the AROMI chatbot to generate your personalised nutrition plan
              and it will appear here as beautifully structured day cards.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default NutritionPage;
