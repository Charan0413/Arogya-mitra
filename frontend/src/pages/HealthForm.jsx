import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { FaHeartbeat, FaCheckCircle } from "react-icons/fa";
import "./HealthForm.css";

function HealthForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    user_id: Number(localStorage.getItem("user_id")),
    age: "",
    gender: "",
    height: "",
    weight: "",
    fitness_goal: "",
    activity_level: "",
    workout_preference: "",
    available_time: "",
    allergies: "",
    medical_conditions: "",
    injuries: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/health/submit", formData);
      window.location.replace("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Failed to save health assessment. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="health-page">
      {/* hero */}
      <div className="health-hero">
        <div className="health-hero-inner">
          <span className="am-badge">
            <FaHeartbeat size={11} /> HEALTH PROFILE
          </span>
          <h1>Health Assessment</h1>
          <p>Tell us about yourself so we can personalise your fitness & nutrition plan</p>
        </div>
        <div className="health-hero-circle health-hc1" />
        <div className="health-hero-circle health-hc2" />
      </div>

      {/* form card */}
      <div className="health-form-wrapper">
        <form className="health-form-card" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          {/* section: basics */}
          <div className="health-section-title">Basic Information</div>
          <div className="health-grid">
            <div className="auth-field">
              <label>Age</label>
              <input type="number" name="age" placeholder="e.g. 28" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Gender</label>
              <select name="gender" onChange={handleChange} required>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div className="auth-field">
              <label>Height (cm)</label>
              <input type="number" name="height" placeholder="e.g. 175" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Weight (kg)</label>
              <input type="number" name="weight" placeholder="e.g. 70" onChange={handleChange} required />
            </div>
          </div>

          {/* section: fitness */}
          <div className="health-section-title">Fitness Profile</div>
          <div className="health-grid">
            <div className="auth-field">
              <label>Fitness Goal</label>
              <input type="text" name="fitness_goal" placeholder="e.g. Lose weight" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Activity Level</label>
              <input type="text" name="activity_level" placeholder="e.g. Moderate" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Workout Preference</label>
              <input type="text" name="workout_preference" placeholder="e.g. Home / Gym" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Available Time (min)</label>
              <input type="number" name="available_time" placeholder="e.g. 45" onChange={handleChange} required />
            </div>
          </div>

          {/* section: medical */}
          <div className="health-section-title">Medical & Conditions</div>
          <div className="health-grid health-grid-full">
            <div className="auth-field">
              <label>Allergies</label>
              <input type="text" name="allergies" placeholder="e.g. Peanuts, Dairy" onChange={handleChange} />
            </div>
            <div className="auth-field">
              <label>Medical Conditions</label>
              <input type="text" name="medical_conditions" placeholder="e.g. Diabetes" onChange={handleChange} />
            </div>
            <div className="auth-field">
              <label>Injuries</label>
              <input type="text" name="injuries" placeholder="e.g. Knee sprain" onChange={handleChange} />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit health-submit"
            disabled={loading}
          >
            {loading ? (
              "Saving..."
            ) : (
              <><FaCheckCircle size={16} /> Save Assessment</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default HealthForm;
