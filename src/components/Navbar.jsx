import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ authenticated = false }) {
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
      <nav className={`site-navbar ${authenticated ? "is-auth" : "is-public"}`}>
        <div className="site-navbar-inner">
          <div
            className="site-navbar-brand"
            onClick={() => nav(authenticated ? "/dashboard" : "/")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                nav(authenticated ? "/dashboard" : "/");
              }
            }}
          >
            <div className="site-navbar-logo">M</div>
            <div className="site-navbar-title">Meeting Platform</div>
          </div>

          {authenticated ? (
            <div className="site-navbar-actions site-navbar-actions-auth">
              <button
                type="button"
                className="auth-navbar-profile"
                onClick={() => setOpenProfile(true)}
              >
                <div className="auth-navbar-avatar">{initials}</div>
                <div className="auth-navbar-meta">
                  <div className="auth-navbar-name">{user.name || "User"}</div>
                  <div className="auth-navbar-email">{user.email}</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="site-navbar-actions" />
          )}
        </div>
      </nav>

      {authenticated && openProfile && (
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

      {authenticated && openProfile && (
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
            overflowY: "auto",
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
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "background 0.2s",
            }}
            onClick={() => setOpenProfile(false)}
            onMouseEnter={(e) => e.target.style.background = "#f0f0f0"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            ×
          </div>

          <h2 style={{ 
            marginBottom: "1.2rem", 
            color: "#1E1E2F",
            fontSize: "clamp(1.25rem, 5vw, 1.5rem)"
          }}>
            Your Profile
          </h2>

          <div
            style={{
              width: "clamp(60px, 15vw, 70px)",
              height: "clamp(60px, 15vw, 70px)",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6759FF,#A79BFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "clamp(20px, 5vw, 24px)",
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            {initials}
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ 
              margin: 0, 
              fontWeight: 600, 
              color: "#1E1E2F",
              fontSize: "clamp(1rem, 4vw, 1.125rem)",
              wordBreak: "break-word"
            }}>
              {user.name}
            </p>
            <p style={{ 
              margin: "0.5rem 0 0 0", 
              color: "#606074", 
              overflowWrap: "anywhere",
              fontSize: "clamp(0.875rem, 3.5vw, 1rem)",
              wordBreak: "break-all"
            }}>
              {user.email}
            </p>
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
              fontSize: "clamp(0.875rem, 3.5vw, 1rem)",
              transition: "all 0.2s",
            }}
            title="Profile page disabled during meeting"
            onMouseEnter={(e) => {
              e.target.style.background = "#6759FF10";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#fff";
            }}
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
              fontSize: "clamp(0.875rem, 3.5vw, 1rem)",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.opacity = "0.9"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            Logout
          </button>
        </div>
      )}

      {authenticated && (
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      )}
    </>
  );
}
