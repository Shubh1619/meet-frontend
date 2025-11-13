import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthNavbar() {
  const nav = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const initials = (user.name
    ? user.name.split(" ").map((n) => n[0]).join("")
    : user.email?.[0] || "U"
  ).toUpperCase();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/login");
  }

  return (
    <>
      {/* NAVBAR */}
      <nav
        style={{
          width: "100%",
          background: "#fff",
          padding: "0.75rem 2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            cursor: "pointer",
          }}
          onClick={() => nav("/dashboard")}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6759FF, #A79BFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#6759FF" }}>
            Meetify
          </div>
        </div>

        {/* USER SECTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            cursor: "pointer",
          }}
          onClick={() => setOpenProfile(true)}
        >
          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6759FF,#A79BFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            {initials}
          </div>

          {/* Name + Email */}
          <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
            <div style={{ fontWeight: 600, color: "#1E1E2F" }}>
              {user.name || "User"}
            </div>
            <div style={{ color: "#606074" }}>{user.email}</div>
          </div>
        </div>
      </nav>

      {/* RIGHT SIDE PROFILE DRAWER */}
      {openProfile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "320px",
            height: "100vh",
            background: "#fff",
            boxShadow: "-4px 0px 15px rgba(0,0,0,0.08)",
            zIndex: 200,
            padding: "2rem 1.5rem",
            animation: "slideIn .25s ease",
          }}
        >
          {/* Close */}
          <div
            style={{
              position: "absolute",
              top: 15,
              right: 15,
              fontSize: 22,
              cursor: "pointer",
              color: "#606074",
            }}
            onClick={() => setOpenProfile(false)}
          >
            ✖
          </div>

          <h2 style={{ marginBottom: "1.2rem", color: "#1E1E2F" }}>
            Your Profile
          </h2>

          {/* Avatar */}
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6759FF,#A79BFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            {initials}
          </div>

          {/* User Info */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: 0, fontWeight: 600, color: "#1E1E2F" }}>
              {user.name}
            </p>
            <p style={{ margin: 0, color: "#606074" }}>{user.email}</p>
          </div>

          {/* Open full profile page */}
          <button
            onClick={() => {
              setOpenProfile(false);
              nav("/profile");
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 12,
              border: "1px solid #6759FF",
              background: "#fff",
              color: "#6759FF",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            Open Profile Page
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#FF4757,#FF6B7A)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* slide animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
