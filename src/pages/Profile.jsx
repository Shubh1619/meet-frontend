import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";

export default function Profile() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.message);
        const cached = localStorage.getItem("user");
        if (cached) {
          setUser(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return "#6759FF";
    const colors = ["#6759FF", "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const cardBg = darkMode ? "#16213e" : "#fff";
  const pageBg = darkMode ? "#1a1a2e" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#9ca3af" : "#6b7280";
  const softBg = darkMode ? "#101426" : "#F8F9FF";
  const borderColor = darkMode ? "#2a3148" : "#eef1f6";

  if (loading) {
    return (
      <div style={{ ...styles.container, background: pageBg }}>
        <div style={{ ...styles.loadingCard, background: cardBg, color: textColor }}>
          <div style={styles.spinner} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, background: pageBg }}>
      <div style={{ ...styles.profileCard, background: cardBg }}>
        <div style={styles.header}>
          <div style={{ ...styles.avatar, background: getAvatarColor(user?.name) }}>
            {getInitials(user?.name)}
          </div>
          <h2 style={styles.userName}>{user?.name || "User"}</h2>
          <p style={styles.userEmail}>{user?.email}</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        <div style={{ ...styles.section, borderBottom: `1px solid ${borderColor}` }}>
          <h3 style={styles.sectionTitle}>Profile Information</h3>

          <div style={{ ...styles.responsiveRow, borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ ...styles.infoLabel, color: mutedColor }}>
              <span style={styles.infoIcon}>ID</span>
              Full Name
            </div>
            <div style={{ ...styles.infoValue, color: textColor }}>{user?.name || "Not set"}</div>
          </div>

          <div style={styles.responsiveRow}>
            <div style={{ ...styles.infoLabel, color: mutedColor }}>
              <span style={styles.infoIcon}>@</span>
              Email Address
            </div>
            <div style={{ ...styles.infoValue, color: textColor, overflowWrap: "anywhere" }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ ...styles.section, borderBottom: `1px solid ${borderColor}` }}>
          <h3 style={styles.sectionTitle}>Settings</h3>

          <div style={{ ...styles.responsiveRow, borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ ...styles.settingLabel, color: mutedColor }}>
              <span style={styles.settingIcon}>DM</span>
              Dark Mode
            </div>
            <label style={styles.toggle}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={toggleDarkMode}
                style={styles.toggleInput}
              />
              <span style={{ ...styles.toggleSlider, background: darkMode ? "#6759FF" : "#ddd" }} />
            </label>
          </div>

          <div style={{ ...styles.responsiveRow, borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ ...styles.settingLabel, color: mutedColor }}>
              <span style={styles.settingIcon}>NT</span>
              Notifications
            </div>
            <label style={styles.toggle}>
              <input type="checkbox" defaultChecked style={styles.toggleInput} />
              <span style={styles.toggleSlider} />
            </label>
          </div>

          <div style={styles.responsiveRow}>
            <div style={{ ...styles.settingLabel, color: mutedColor }}>
              <span style={styles.settingIcon}>EM</span>
              Email Reminders
            </div>
            <label style={styles.toggle}>
              <input type="checkbox" defaultChecked style={styles.toggleInput} />
              <span style={styles.toggleSlider} />
            </label>
          </div>
        </div>

        <div style={{ ...styles.section, borderBottom: `1px solid ${borderColor}` }}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>

          <div style={styles.actionsGrid}>
            <button style={{ ...styles.actionBtn, background: softBg, color: textColor, border: `1px solid ${borderColor}` }} onClick={() => navigate("/instant")}>
              <span style={styles.actionIcon}>IM</span>
              Instant Meeting
            </button>

            <button style={{ ...styles.actionBtn, background: softBg, color: textColor, border: `1px solid ${borderColor}` }} onClick={() => navigate("/schedule")}>
              <span style={styles.actionIcon}>SC</span>
              Schedule Meeting
            </button>

            <button style={{ ...styles.actionBtn, background: softBg, color: textColor, border: `1px solid ${borderColor}` }} onClick={() => navigate("/dashboard")}>
              <span style={styles.actionIcon}>DB</span>
              Dashboard
            </button>
          </div>
        </div>

        <div style={styles.dangerZone}>
          <h3 style={styles.dangerTitle}>Account</h3>

          {!showLogoutConfirm ? (
            <button
              style={styles.logoutBtn}
              onClick={() => setShowLogoutConfirm(true)}
            >
              Logout
            </button>
          ) : (
            <div style={styles.confirmBox}>
              <p style={styles.confirmText}>Are you sure you want to logout?</p>
              <div style={styles.confirmBtns}>
                <button
                  style={styles.confirmLogoutBtn}
                  onClick={handleLogout}
                >
                  Yes, Logout
                </button>
                <button
                  style={styles.cancelBtn}
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ ...styles.footer, background: softBg, color: mutedColor }}>
          <p>Meeting Platform - AI Meeting Assistant</p>
          <p style={styles.version}>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingTop: "5.75rem",
    minHeight: "calc(100vh - 60px)",
    display: "flex",
    justifyContent: "center",
    paddingBottom: "2rem",
    paddingLeft: "1rem",
    paddingRight: "1rem",
    width: "100%",
  },
  profileCard: {
    borderRadius: 16,
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  loadingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "3rem",
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #6759FF",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    background: "linear-gradient(135deg, #6759FF, #A79BFF)",
    padding: "2rem",
    textAlign: "center",
    color: "#fff",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#fff",
    margin: "0 auto 1rem",
    border: "4px solid rgba(255,255,255,0.3)",
  },
  userName: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  userEmail: {
    margin: "0.5rem 0 0",
    opacity: 0.9,
    fontSize: "0.9rem",
    overflowWrap: "anywhere",
  },
  errorAlert: {
    background: "#ffe5e5",
    color: "#ff3b3b",
    padding: "0.8rem 1rem",
    textAlign: "center",
    fontSize: "0.9rem",
  },
  section: {
    padding: "1.5rem",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: "0.5px",
    marginBottom: "1rem",
    fontWeight: 600,
  },
  responsiveRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.75rem",
    padding: "0.8rem 0",
  },
  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.95rem",
  },
  infoIcon: {
    minWidth: 26,
    padding: "0.18rem 0.35rem",
    borderRadius: 8,
    background: "rgba(103, 89, 255, 0.12)",
    color: "#6759FF",
    fontSize: "0.8rem",
    fontWeight: 700,
    textAlign: "center",
  },
  infoValue: {
    fontWeight: 500,
  },
  settingLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  settingIcon: {
    minWidth: 26,
    padding: "0.18rem 0.35rem",
    borderRadius: 8,
    background: "rgba(103, 89, 255, 0.12)",
    color: "#6759FF",
    fontSize: "0.8rem",
    fontWeight: 700,
    textAlign: "center",
  },
  toggle: {
    position: "relative",
    display: "inline-block",
    width: 48,
    height: 26,
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSlider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ccc",
    transition: "0.3s",
    borderRadius: 26,
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "0.8rem",
  },
  actionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.3rem",
    padding: "1rem 0.5rem",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: "0.8rem",
    transition: "all 0.2s",
  },
  actionIcon: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#6759FF",
  },
  dangerZone: {
    padding: "1.5rem",
  },
  dangerTitle: {
    fontSize: "0.85rem",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: "0.5px",
    marginBottom: "1rem",
    fontWeight: 600,
  },
  logoutBtn: {
    width: "100%",
    padding: "0.9rem",
    borderRadius: 10,
    background: "#ff4757",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "1rem",
  },
  confirmBox: {
    background: "#fff5f5",
    padding: "1rem",
    borderRadius: 10,
    border: "1px solid #ff4757",
  },
  confirmText: {
    margin: "0 0 1rem",
    color: "#333",
    textAlign: "center",
  },
  confirmBtns: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.8rem",
  },
  confirmLogoutBtn: {
    flex: 1,
    minWidth: 140,
    padding: "0.7rem",
    borderRadius: 8,
    background: "#ff4757",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
  cancelBtn: {
    flex: 1,
    minWidth: 140,
    padding: "0.7rem",
    borderRadius: 8,
    background: "#fff",
    color: "#666",
    border: "1px solid #ddd",
    cursor: "pointer",
    fontWeight: 600,
  },
  footer: {
    padding: "1.5rem",
    textAlign: "center",
    fontSize: "0.85rem",
  },
  version: {
    margin: "0.3rem 0 0",
    fontSize: "0.75rem",
  },
};

