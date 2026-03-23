import React from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import { useDarkMode } from "../context/DarkModeContext";

export default function Home() {
  const nav = useNavigate();
  const { darkMode } = useDarkMode();

  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const cardBg = darkMode ? "#16213e" : "#fff";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";
  const sectionBg = darkMode ? "#0f0f23" : "#fff";

  return (
    <div style={{ width: "100%", backgroundColor: bgColor, color: textColor }}>
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
          padding: "0.75rem 2rem",
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
          Meetify
        </div>

        {/* Center: Nav Links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            fontWeight: 500,
            color: mutedColor,
          }}
        >
          <a href="#home" className="tab active" style={{ color: mutedColor }}>Home</a>
          <a href="#features" className="tab" style={{ color: mutedColor }}>Features</a>
          <a href="#workflow" className="tab" style={{ color: mutedColor }}>Workflow</a>
          <a href="#pricing" className="tab" style={{ color: mutedColor }}>Pricing</a>
          <a href="#contact" className="tab" style={{ color: mutedColor }}>Contact</a>
        </nav>

        {/* Right: CTA Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ActionButton variant="ghost" onClick={() => nav("/login")}>
            Login
          </ActionButton>
          <ActionButton onClick={() => nav("/register")}>Sign Up</ActionButton>
        </div>
      </header>

      {/* 🧭 Main Content */}
      <main
        style={{
          marginTop: "64px", // matches navbar height perfectly
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 1rem",
        }}
      >

        {/* Hero Section */}
        <section
          id="home"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            gap: "2rem",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "4rem 1rem",
          }}
        >
          {/* Left */}
          <div style={{ textAlign: "left" }}>
            <h1 style={{ fontSize: "2.5rem", color: textColor, lineHeight: 1.3 }}>
              Make Meetings Smarter with{" "}
              <span style={{ color: "#6759FF" }}>Meetify 🚀</span>
            </h1>
            <p
              style={{
                color: mutedColor,
                fontSize: "1.1rem",
                marginTop: "1rem",
                lineHeight: 1.6,
              }}
            >
              Schedule, manage, and analyze meetings seamlessly with
              AI-powered insights.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem" }}>
              <ActionButton onClick={() => nav("/register")}>
                Get Started
              </ActionButton>
              <ActionButton variant="ghost">Watch Demo</ActionButton>
            </div>
          </div>

          {/* Right: Hero Image Placeholder */}
          <div
            style={{
              height: 320,
              borderRadius: "16px",
              background: darkMode ? "linear-gradient(135deg, #16213e, #1a1a2e)" : "linear-gradient(135deg, #A79BFF, #F8F9FF)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1.1rem",
            }}
          >
            🧑‍💻 Meeting Dashboard Illustration
          </div>
        </section>

        {/* Key Features */}
        <section
          id="features"
          style={{
            background: sectionBg,
            width: "100%",
            padding: "4rem 1rem",
          }}
        >
          <h2 style={{ textAlign: "center", color: textColor }}>Key Features</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
              maxWidth: 1100,
              marginInline: "auto",
            }}
          >
            {[
              { icon: "🤖", title: "AI Meeting Assistant", text: "Smart scheduling & summaries." },
              { icon: "📅", title: "Easy Meeting Management", text: "Create, edit, and share with one click." },
              { icon: "📊", title: "Analytics Dashboard", text: "Understand engagement and productivity." },
              { icon: "🔔", title: "Smart Reminders", text: "Never miss an important meeting." },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  background: darkMode ? "#1a1a2e" : "#F8F9FF",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "2rem 1rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  color: textColor,
                }}
              >
                <div style={{ fontSize: "2rem" }}>{f.icon}</div>
                <h3 style={{ margin: "1rem 0 0.5rem", color: textColor }}>{f.title}</h3>
                <p style={{ color: mutedColor }}>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section
          id="workflow"
          style={{
            width: "100%",
            padding: "4rem 1rem",
            maxWidth: 1000,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: textColor }}>How It Works</h2>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "2rem",
              marginTop: "2rem",
            }}
          >
            {[
              { step: "1️⃣", text: "Create a meeting" },
              { step: "2️⃣", text: "Invite participants" },
              { step: "3️⃣", text: "Get insights" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  width: 240,
                  padding: "1.5rem",
                  background: cardBg,
                  borderRadius: 16,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                  color: textColor,
                }}
              >
                <div style={{ fontSize: "2rem" }}>{s.step}</div>
                <p style={{ fontWeight: 500, color: textColor, marginTop: "0.5rem" }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Meetify */}
        <section
          style={{
            background: sectionBg,
            width: "100%",
            padding: "4rem 1rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: textColor }}>Why Choose Meetify?</h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "2rem",
              marginTop: "2rem",
            }}
          >
            {[
              "✅ Trusted by 100+ teams",
              "⚡ Boosts productivity by 40%",
              "🧠 AI-generated meeting summaries",
            ].map((txt, i) => (
              <div
                key={i}
                style={{
                  width: 260,
                  padding: "1.5rem",
                  borderRadius: 16,
                  background: cardBg,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                  color: textColor,
                }}
              >
                {txt}
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          style={{
            width: "100%",
            padding: "4rem 1rem",
            background: sectionBg,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: textColor }}>
            Simple, Transparent Pricing
          </h2>
          <p
            style={{
              color: mutedColor,
              fontSize: "1rem",
              margin: "0 auto 2.5rem",
              maxWidth: 550,
              lineHeight: 1.6,
            }}
          >
            Choose the plan that works best for your team — upgrade anytime.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              justifyContent: "center",
              maxWidth: 1100,
              margin: "0 auto",
              alignItems: "stretch",
            }}
          >
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                desc: "Perfect for individuals and small teams",
                features: ["Up to 5 meetings/month", "Basic analytics", "Email support", "1 team member"],
              },
              {
                name: "Pro",
                price: "$9",
                period: "per month",
                desc: "Advanced features for growing teams",
                features: ["Unlimited meetings", "Advanced analytics", "Priority support", "Up to 10 team members", "AI summaries"],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "tailored",
                desc: "Full suite for large organizations",
                features: ["Unlimited everything", "Custom analytics", "Dedicated support", "SSO & security", "Custom integrations"],
              },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  padding: "2.5rem 2rem",
                  borderRadius: "16px",
                  border: p.highlighted
                    ? "2px solid #6759FF"
                    : `1px solid ${darkMode ? "#333" : "rgba(0,0,0,0.08)"}`,
                  background: p.highlighted
                    ? (darkMode ? "#16213e" : "linear-gradient(135deg, #F8F9FF, #FFFFFF)")
                    : cardBg,
                  boxShadow: p.highlighted
                    ? "0 10px 30px rgba(0,0,0,0.08)"
                    : "0 4px 16px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.3s ease",
                  height: "100%",
                  color: textColor,
                }}
              >
                {p.highlighted && (
                  <div
                    style={{
                      background: "#6759FF",
                      color: "#fff",
                      padding: "0.4rem 1.2rem",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      display: "inline-block",
                      marginBottom: "1rem",
                      alignSelf: "center",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div>
                  <h3
                    style={{
                      color: "#6759FF",
                      fontSize: "1.4rem",
                      fontWeight: 600,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {p.name}
                  </h3>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                      marginBottom: "0.25rem",
                      color: textColor,
                    }}
                  >
                    {p.price}
                  </div>
                  <div style={{ color: mutedColor, marginBottom: "1rem" }}>
                    {p.period}
                  </div>
                  <p
                    style={{
                      color: mutedColor,
                      marginBottom: "1.25rem",
                      fontSize: "0.95rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {p.desc}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "left",
                    marginBottom: "1.75rem",
                    flexGrow: 1,
                  }}
                >
                  {p.features.map((feature, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.6rem",
                        color: mutedColor,
                        fontSize: "0.95rem",
                      }}
                    >
                      <span style={{ color: "#6759FF" }}>✓</span>
                      {feature}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "auto" }}>
                  <ActionButton
                    style={{
                      width: "100%",
                      padding: "0.7rem 1.5rem",
                      fontSize: "1rem",
                      borderRadius: "10px",
                    }}
                    onClick={() => nav("/register")}
                  >
                    {p.highlighted ? "Upgrade Now" : "Get Started"}
                  </ActionButton>
                </div>
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
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} Meetify. All rights reserved.
          </p>
          <p style={{ color: mutedColor, fontSize: "0.9rem", marginTop: "0.3rem" }}>
            <a href="#home">Home</a> • <a href="#features">Features</a> •{" "}
            <a href="#pricing">Pricing</a> • <a href="#contact">Support</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
