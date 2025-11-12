import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const loc = useLocation();

  const tabs = [
    { path: "/", label: "Home" }, // Only Home tab now
  ];

  return (
    <nav
      className="navbar"
      style={{
        width: "100%",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        padding: "0.75rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      {/* 🔹 Left Brand Section */}
      <div
        className="nav-left"
        style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
      >
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* 🌀 Logo Box with "M" */}
          <div
            className="logo"
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
              boxShadow: "0 4px 10px rgba(103,89,255,0.25)",
            }}
          >
            M
          </div>

          {/* Brand Text */}
          <div style={{ lineHeight: 1.2 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#6759FF",
              }}
            >
              Meetify
            </div>
            <div style={{ fontSize: 12, color: "#606074" }}>
              Meeting management
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Center Tabs */}
      <div
        className="nav-tabs"
        style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
      >
        {tabs.map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className={`tab ${loc.pathname === t.path ? "active" : ""}`}
            style={{
              position: "relative",
              textDecoration: "none",
              fontWeight: 500,
              color:
                loc.pathname === t.path
                  ? "#6759FF"
                  : "var(--color-text-2, #606074)",
              paddingBottom: "0.25rem",
              transition: "color 0.2s ease",
            }}
          >
            {t.label}
            {loc.pathname === t.path && (
              <span
                style={{
                  position: "absolute",
                  bottom: -4,
                  left: 0,
                  right: 0,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: "#6759FF",
                }}
              />
            )}
          </Link>
        ))}
      </div>

      {/* 🔘 Right Placeholder (for future user/profile) */}
    </nav>
  );
}
