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
import Profile from "./pages/Profile";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  const publicRoutes = ["/", "/login", "/register"];
  const isMeetingRoom = location.pathname.startsWith("/meeting/");

  const usePublicNavbar = publicRoutes.includes(location.pathname) || !token || isMeetingRoom;

  return (
    <div className="app-container">
      {usePublicNavbar ? <PublicNavbar /> : <AuthNavbar />}

      <main className="main-content">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Meeting Room - PUBLIC (no login required) */}
          <Route path="/meeting/:roomId" element={<MeetingRoom />} />

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

          {/* Profile Page Route */}
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
