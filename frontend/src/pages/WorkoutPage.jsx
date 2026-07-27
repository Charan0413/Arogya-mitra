import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

import {
  FaDumbbell,
  FaFire,
  FaRunning,
  FaCalendarAlt,
} from "react-icons/fa";

import "./WorkoutPage.css";

function WorkoutPage() {
  const [plan, setPlan] = useState("");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const userId = localStorage.getItem("user_id");

        const res = await api.get(`/workout-plan/${userId}`);

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

      <div className="workout-page">

        <div className="workout-header">

          <h1>
            <FaDumbbell />
            Your Workout Plan
          </h1>

          <p>
            Personalized by AROMI AI
          </p>

        </div>

        <div className="workout-card">

          {plan ? (
            <pre>{plan}</pre>
          ) : (
            <div className="empty-state">

              <FaFire size={60} />

              <h2>No Workout Plan Yet</h2>

              <p>
                Generate a workout plan from the chatbot to view it here.
              </p>

            </div>
          )}

        </div>

      </div>
    </>
  );
}

export default WorkoutPage;