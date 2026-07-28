import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import HealthForm from "./pages/HealthForm";
import Dashboard from "./pages/Dashboard";
import WorkoutPage from "./pages/WorkoutPage";
import NutritionPage from "./pages/NutritionPage";
import WeeklyPlanPage from "./pages/WeeklyPlanPage";
import CalendarPage from "./pages/CalendarPage";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/health"
          element={token ? <HealthForm /> : <Navigate to="/" />}
        />

        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/" />}
        />

        {/* Workout Plan Page */}
        <Route
          path="/workout-plan"
          element={token ? <WorkoutPage /> : <Navigate to="/" />}
        />

        {/* Nutrition Plan Page */}
        <Route
          path="/nutrition-plan"
          element={token ? <NutritionPage /> : <Navigate to="/" />}
        />

        {/* Weekly Plan Page */}
        <Route
          path="/weekly-plan"
          element={token ? <WeeklyPlanPage /> : <Navigate to="/" />}
        />

        {/* Calendar Page */}
        <Route
          path="/calendar"
          element={token ? <CalendarPage /> : <Navigate to="/" />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
