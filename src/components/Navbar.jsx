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
      <nav className="site-navbar">
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
            <div className="site-navbar-actions">
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

          /* Navbar - completely box-free */
          .site-navbar {
            background: transparent;
            box-shadow: none;
            border: none;
            padding: 1rem 0;
          }

          .site-navbar-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
          }

          /* Brand - no box */
          .site-navbar-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            background: transparent;
            border: none;
          }

          .site-navbar-logo {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #6759FF, #A79BFF);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 18px;
          }

          .site-navbar-title {
            font-weight: 600;
            color: #1E1E2F;
            font-size: 1rem;
          }

          /* Actions container */
          .site-navbar-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          /* Profile button - no box */
          .auth-navbar-profile {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 12px;
            transition: background 0.2s;
          }

          .auth-navbar-profile:hover {
            background: rgba(0, 0, 0, 0.05);
          }

          .auth-navbar-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #6759FF, #A79BFF);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
          }

          .auth-navbar-meta {
            text-align: left;
          }

          .auth-navbar-name {
            font-weight: 600;
            color: #1E1E2F;
            font-size: 0.875rem;
          }

          .auth-navbar-email {
            font-size: 0.75rem;
            color: #606074;
          }

          /* Mobile responsive */
          @media (max-width: 768px) {
            .site-navbar-inner {
              padding: 0 1rem;
            }

            .site-navbar-title {
              font-size: 14px;
            }

            .site-navbar-logo {
              width: 32px;
              height: 32px;
              font-size: 16px;
            }

            .auth-navbar-meta {
              display: none;
            }

            .auth-navbar-profile {
              padding: 0.25rem;
            }

            .auth-navbar-avatar {
              width: 36px;
              height: 36px;
              font-size: 13px;
            }
          }

          /* Extra small screens */
          @media (max-width: 480px) {
            .site-navbar-title {
              display: none;
            }

            .site-navbar-logo {
              width: 36px;
              height: 36px;
            }

            .auth-navbar-avatar {
              width: 32px;
              height: 32px;
              font-size: 12px;
            }
          }

          /* Touch device optimizations */
          button,
          .site-navbar-brand,
          .auth-navbar-profile {
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
      )}
    </>
  );
}