import { useState } from "react";
import api from "../services/api";
import "./WorkoutCard.css";

function WorkoutCard() {
  const [workout, setWorkout] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("user_id");

  const generateWorkout = async () => {
    setLoading(true);

    try {
      const res = await api.get(`/workout/${userId}`);

      setWorkout(res.data.workout_plan);
    } catch (err) {
      console.error(err);
      alert("Failed to generate workout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workout-card">
      <div className="card-header">
        <h2>🏋️ AI Workout Plan</h2>
        <p>Generate a personalized workout based on your health profile.</p>
      </div>

      <button
        className="generate-btn"
        onClick={generateWorkout}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Workout"}
      </button>

      {workout && (
        <div className="workout-result">
          <pre>{workout}</pre>
        </div>
      )}
    </div>
  );
}

export default WorkoutCard;