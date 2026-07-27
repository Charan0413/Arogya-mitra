import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

import "./NutritionPage.css";

function NutritionPage() {
  const [plan, setPlan] = useState("");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const userId = localStorage.getItem("user_id");

        const res = await api.get(`/nutrition-plan/${userId}`);

        setPlan(res.data.plan);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlan();
  }, []);

  return (
    <>
      <Navbar />

      <div className="nutrition-page">

        <div className="nutrition-header">
          <h1>🥗 Your Nutrition Plan</h1>
          <p>Personalized by AROMI AI</p>
        </div>

        <div className="nutrition-card">

          {plan ? (
            <pre>{plan}</pre>
          ) : (
            <div className="empty-state">
              <div className="emoji">🥗</div>

              <h2>No Nutrition Plan Yet</h2>

              <p>
                Generate a nutrition plan using AROMI to view it here.
              </p>
            </div>
          )}

        </div>

      </div>
    </>
  );
}

export default NutritionPage;