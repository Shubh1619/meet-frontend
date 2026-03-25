import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthNavbar() {
  const nav = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      <nav className="site-navbar">
        <div className="site-navbar-inner">
          <div
            className="site-navbar-brand"
            onClick={() => nav("/dashboard")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                nav("/dashboard");
              }
            }}
          >
            <div className="site-navbar-logo">M</div>
            <div className="site-navbar-title">Meetify</div>
          </div>

          <button
            type="button"
            className="site-navbar-toggle"
            aria-label="Toggle account menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`site-navbar-actions site-navbar-actions-user ${menuOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="auth-navbar-profile"
              onClick={() => {
                setMenuOpen(false);
                setOpenProfile(true);
              }}
            >
              <div className="auth-navbar-avatar">{initials}</div>
              <div className="auth-navbar-meta">
                <div className="auth-navbar-name">{user.name || "User"}</div>
                <div className="auth-navbar-email">{user.email}</div>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {openProfile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.28)",
            zIndex: 190,
          }}
          onClick={() => setOpenProfile(false)}
        />
      )}

      {openProfile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "min(360px, 100vw)",
            height: "100vh",
            background: "#fff",
            boxShadow: "-4px 0px 15px rgba(0,0,0,0.08)",
            zIndex: 200,
            padding: "2rem 1.5rem",
            animation: "slideIn .25s ease",
          }}
        >
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
            x
          </div>

          <h2 style={{ marginBottom: "1.2rem", color: "#1E1E2F" }}>
            Your Profile
          </h2>

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

          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: 0, fontWeight: 600, color: "#1E1E2F" }}>
              {user.name}
            </p>
            <p style={{ margin: 0, color: "#606074", overflowWrap: "anywhere" }}>{user.email}</p>
          </div>

          <button
            onClick={() => {
              if (window.location.pathname.includes("/meeting/")) {
                return;
              }
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
            title="Profile page disabled during meeting"
          >
            Open Profile Page
          </button>

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

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
