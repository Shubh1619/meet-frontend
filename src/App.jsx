import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import PublicNavbar from "./components/PublicNavbar";
import AuthNavbar from "./components/AuthNavbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ScheduleMeeting from "./pages/ScheduleMeeting";
import InstantMeeting from "./pages/InstantMeeting";
import JoinMeeting from "./pages/JoinMeeting";
import MeetingRoom from "./pages/MeetingRoom";
import Profile from "./pages/Profile";  // ✅ ADD THIS


// -------------------------
// AUTH PROTECTED ROUTE
// -------------------------
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// -------------------------
// MAIN APP
// -------------------------
export default function App() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Public routes
  const publicRoutes = ["/", "/login", "/register"];

  const usePublicNavbar = publicRoutes.includes(location.pathname) || !token;

  return (
    <div className="app-container">
      {usePublicNavbar ? <PublicNavbar /> : <AuthNavbar />}

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <ScheduleMeeting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instant"
            element={
              <ProtectedRoute>
                <InstantMeeting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/join"
            element={
              <ProtectedRoute>
                <JoinMeeting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meeting/:roomId"
            element={
              <ProtectedRoute>
                <MeetingRoom />
              </ProtectedRoute>
            }
          />

          {/* ✅ ADD PROFILE PAGE ROUTE */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer">All rights reserved © Meetify</footer>
    </div>
  );
}
