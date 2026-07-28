import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import HealthForm from "./pages/HealthForm";
import Dashboard from "./pages/Dashboard";
import WorkoutPage from "./pages/WorkoutPage";
import NutritionPage from "./pages/NutritionPage";
import WeeklyPlanPage from "./pages/WeeklyPlanPage";
import CalendarPage from "./pages/CalendarPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  /* re-read token when localStorage changes (login / logout) */
  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" /> : <Register />}
        />

        <Route path="/health" element={
          <ProtectedRoute><HealthForm /></ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="/workout-plan" element={
          <ProtectedRoute><WorkoutPage /></ProtectedRoute>
        } />

        <Route path="/nutrition-plan" element={
          <ProtectedRoute><NutritionPage /></ProtectedRoute>
        } />

        <Route path="/weekly-plan" element={
          <ProtectedRoute><WeeklyPlanPage /></ProtectedRoute>
        } />

        <Route path="/calendar" element={
          <ProtectedRoute><CalendarPage /></ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
