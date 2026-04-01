import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import { useDarkMode } from "../context/DarkModeContext";

export default function Home() {
  const nav = useNavigate();
  const { darkMode } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const cardBg = darkMode ? "#16213e" : "#fff";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";
  const sectionBg = darkMode ? "#0f0f23" : "#fff";

  return (
    <div style={{ width: "100%", backgroundColor: bgColor, color: textColor, minHeight: "100vh" }}>
      {/* Fixed Navbar */}
      <header
        style={{
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          height: "64px",
          background: cardBg,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          zIndex: 100,
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontWeight: 600,
            color: "#6759FF",
            cursor: "pointer",
          }}
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
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <span className="logo-text">Meeting Platform</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <a href="#home" style={{ color: mutedColor, textDecoration: "none" }}>Home</a>
          <a href="#features" style={{ color: mutedColor, textDecoration: "none" }}>Features</a>
          <a href="#contact" style={{ color: mutedColor, textDecoration: "none" }}>Contact</a>
        </nav>

        {/* Desktop: Meeting Platform button */}
        <div className="desktop-actions">
          <ActionButton variant="ghost" onClick={() => nav("/register")}>
            Meeting Platform
          </ActionButton>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            zIndex: 101,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 199,
            }}
          />
          <div className="mobile-menu" style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "80%",
            maxWidth: "300px",
            height: "100vh",
            background: cardBg,
            zIndex: 200,
            padding: "2rem 1.5rem",
            boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
            animation: "slideIn 0.3s ease",
          }}>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: textColor,
              }}
            >
              ×
            </button>
            
            <div style={{ marginTop: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <a href="#home" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: "none", fontSize: "1.1rem", fontWeight: 500 }}>Home</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: "none", fontSize: "1.1rem", fontWeight: 500 }}>Features</a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: "none", fontSize: "1.1rem", fontWeight: 500 }}>Contact</a>
                <hr style={{ margin: "0.5rem 0", borderColor: mutedColor }} />
                <ActionButton variant="ghost" onClick={() => {
                  setMobileMenuOpen(false);
                  nav("/register");
                }}>
                  Meeting Platform
                </ActionButton>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main
        style={{
          marginTop: "64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 1rem",
        }}
      >
        {/* Hero Section - Mobile First Grid */}
        <section
          id="home"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "2rem 1rem",
            width: "100%",
          }}
        >
          {/* Text Content */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 6vw, 2.5rem)", color: textColor, lineHeight: 1.3 }}>
              Make Meetings Smarter with{" "}
              <span style={{ color: "#6759FF" }}>Meeting Platform</span>
            </h1>
            <p
              style={{
                color: mutedColor,
                fontSize: "clamp(0.9rem, 4vw, 1.1rem)",
                marginTop: "1rem",
                lineHeight: 1.6,
              }}
            >
              Schedule, manage, and analyze meetings seamlessly with
              AI-powered insights.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem", justifyContent: "center" }}>
              <ActionButton onClick={() => nav("/login")}>
                Login
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => nav("/register")}>
                Register
              </ActionButton>
            </div>
          </div>

          {/* Image Box */}
          <div
            style={{
              height: "clamp(200px, 40vw, 320px)",
              borderRadius: "16px",
              background: darkMode ? "linear-gradient(135deg, #16213e, #1a1a2e)" : "linear-gradient(135deg, #A79BFF, #F8F9FF)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            Meeting Dashboard Illustration
          </div>
        </section>

        {/* Key Features - Responsive Grid */}
        <section
          id="features"
          style={{
            background: sectionBg,
            width: "100%",
            padding: "2rem 1rem",
          }}
        >
          <h2 style={{ textAlign: "center", color: textColor, fontSize: "clamp(1.3rem, 5vw, 2rem)" }}>Key Features</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "1.5rem",
              marginTop: "1.5rem",
              maxWidth: 1100,
              marginInline: "auto",
            }}
            className="features-grid"
          >
            {[
              { title: "AI Meeting Assistant", text: "Smart scheduling & summaries." },
              { title: "Easy Meeting Management", text: "Create, edit, and share with one click." },
              { title: "Analytics Dashboard", text: "Understand engagement and productivity." },
              { title: "Smart Reminders", text: "Never miss an important meeting." },
            ].map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{
                  background: darkMode ? "#1a1a2e" : "#F8F9FF",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "1.5rem 1rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  color: textColor,
                  cursor: "pointer",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(103,89,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                }}
              >
                <h3 style={{ margin: "0 0 0.5rem", color: textColor, fontSize: "clamp(1rem, 4vw, 1.25rem)" }}>{f.title}</h3>
                <p style={{ color: mutedColor, fontSize: "clamp(0.85rem, 3vw, 1rem)" }}>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          id="contact"
          style={{
            background: sectionBg,
            width: "100%",
            padding: "1.5rem 1rem",
            textAlign: "center",
            borderTop: `1px solid ${darkMode ? "#333" : "rgba(0,0,0,0.05)"}`,
            marginTop: "1rem",
            color: textColor,
          }}
        >
          <p style={{ margin: 0, fontSize: "clamp(0.8rem, 3vw, 1rem)" }}>
            © {new Date().getFullYear()} Meeting Platform. All rights reserved.
          </p>
          <p style={{ color: mutedColor, fontSize: "clamp(0.75rem, 3vw, 0.9rem)", marginTop: "0.5rem" }}>
            <a href="#home" style={{ color: mutedColor, textDecoration: "none", margin: "0 0.5rem" }}>Home</a>
            <a href="#features" style={{ color: mutedColor, textDecoration: "none", margin: "0 0.5rem" }}>Features</a>
            <a href="#contact" style={{ color: mutedColor, textDecoration: "none", margin: "0 0.5rem" }}>Support</a>
          </p>
        </footer>
      </main>

      {/* Styles */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        /* Desktop Styles */
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
          
          .desktop-actions {
            display: flex !important;
          }
          
          .desktop-nav {
            display: flex !important;
            align-items: center;
            gap: 1.25rem;
            font-weight: 500;
          }
          
          .logo-text {
            display: inline !important;
          }
          
          /* Hero section grid for desktop */
          section#home {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          section#home > div:first-child {
            text-align: left !important;
          }
          
          section#home .action-buttons {
            justify-content: flex-start !important;
          }
          
          /* Features grid for desktop */
          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
          }
        }
        
        /* Mobile Styles */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          
          .desktop-actions {
            display: none !important;
          }
          
          .mobile-menu-btn {
            display: flex !important;
          }
          
          .logo-text {
            display: none !important;
          }
          
          header {
            padding: 0.75rem 1rem !important;
          }
          
          /* Hero section mobile */
          section#home {
            padding: 1rem !important;
            gap: 1.5rem !important;
          }
          
          /* Features section mobile */
          .features-grid {
            padding: 0 0.5rem !important;
          }
          
          .feature-card {
            margin: 0 !important;
          }
          
          /* Adjust spacing for mobile */
          main {
            padding: 0 !important;
          }
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Optional thin scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #6759FF;
          border-radius: 3px;
        }
        
        * {
          scrollbar-width: thin;
        }
      `}</style>
    </div>
  );
}