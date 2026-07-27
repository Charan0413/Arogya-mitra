import { useState } from "react";
import api from "../services/api";
import "./NutritionCard.css";

function NutritionCard() {
  const [nutrition, setNutrition] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("user_id");

  const generateNutrition = async () => {
    setLoading(true);

    try {
      const res = await api.get(`/nutrition/${userId}`);
      setNutrition(res.data.nutrition_plan);
    } catch (err) {
      console.error(err);
      alert("Failed to generate nutrition plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nutrition-card">
      <div className="card-header">
        <h2>🥗 AI Nutrition Plan</h2>
        <p>Get a personalized nutrition plan based on your profile.</p>
      </div>

      <button
        className="generate-btn"
        onClick={generateNutrition}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Nutrition"}
      </button>

      {nutrition && (
        <div className="nutrition-result">
          <pre>{nutrition}</pre>
        </div>
      )}
    </div>
  );
}

export default NutritionCard;