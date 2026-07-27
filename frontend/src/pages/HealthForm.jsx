import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./HealthForm.css";

function HealthForm() {
  const navigate = useNavigate();

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/health/submit", formData);

      alert("Health Assessment Saved Successfully!");

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to Save Health Assessment");
    }
  };

  return (
    <div className="health-container">
      <div className="health-card">
        <h1>Health Assessment</h1>

        <form onSubmit={handleSubmit}>

          <input
            type="number"
            name="age"
            placeholder="Age"
            onChange={handleChange}
            required
          />

          <select
            name="gender"
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>

          <input
            type="number"
            name="height"
            placeholder="Height (cm)"
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="weight"
            placeholder="Weight (kg)"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="fitness_goal"
            placeholder="Fitness Goal"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="activity_level"
            placeholder="Activity Level"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="workout_preference"
            placeholder="Workout Preference"
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="available_time"
            placeholder="Workout Time (minutes)"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="allergies"
            placeholder="Allergies"
            onChange={handleChange}
          />

          <input
            type="text"
            name="medical_conditions"
            placeholder="Medical Conditions"
            onChange={handleChange}
          />

          <input
            type="text"
            name="injuries"
            placeholder="Injuries"
            onChange={handleChange}
          />

          <button type="submit">Submit</button>

        </form>
      </div>
    </div>
  );
}

export default HealthForm;