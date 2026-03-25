import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function PublicNavbar() {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("resize", closeMenu);
    return () => window.removeEventListener("resize", closeMenu);
  }, []);

  return (
    <nav className="site-navbar">
      <div className="site-navbar-inner">
        <div
          className="site-navbar-brand"
          onClick={() => nav("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              nav("/");
            }
          }}
        >
          <div className="site-navbar-logo">M</div>
          <div className="site-navbar-title">Meetify</div>
        </div>

        <button
          type="button"
          className="site-navbar-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`site-navbar-actions ${menuOpen ? "is-open" : ""}`}>
          <Link
            to="/login"
            className="site-navbar-link site-navbar-link-primary"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="site-navbar-link"
            onClick={() => setMenuOpen(false)}
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
