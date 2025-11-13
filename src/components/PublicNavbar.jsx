import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function PublicNavbar() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
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
        style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}
        onClick={() => nav("/")}
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

      {/* Buttons */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link to="/login" style={{ color: "#6759FF", fontWeight: 600 }}>
          Login
        </Link>
        <Link to="/register" style={{ color: "#606074" }}>
          Register
        </Link>
      </div>
    </nav>
  );
}
