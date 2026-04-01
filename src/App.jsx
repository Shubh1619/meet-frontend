import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import PublicNavbar from "./components/PublicNavbar";
import AuthNavbar from "./components/AuthNavbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { getAccessToken } from "./authSession";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ScheduleMeeting from "./pages/ScheduleMeeting";
import InstantMeeting from "./pages/InstantMeeting";
import JoinMeeting from "./pages/JoinMeeting";
import MeetingRoom from "./pages/MeetingRoom";
import Profile from "./pages/Profile";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();

  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.startsWith("#/reset-password")) {
      const query = hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
      navigate(`/reset-password${query}`, { replace: true });
    }
  }, [navigate]);

  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isMeetingRoom = location.pathname.startsWith("/meeting/");
  const usePublicNavbar = publicRoutes.includes(location.pathname) || !token || isMeetingRoom;

  return (
    <div className="app-container">
      {usePublicNavbar ? <PublicNavbar /> : <AuthNavbar />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/meeting/:roomId" element={<MeetingRoom />} />

          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/schedule"
            element={(
              <ProtectedRoute>
                <ScheduleMeeting />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/instant"
            element={(
              <ProtectedRoute>
                <InstantMeeting />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/join"
            element={(
              <ProtectedRoute>
                <JoinMeeting />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isMeetingRoom && <footer className="footer">All rights reserved | Meeting Platform</footer>}
    </div>
  );
}

