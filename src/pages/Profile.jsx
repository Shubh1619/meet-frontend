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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user data
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

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate avatar color from name
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.profileCard}>
        {/* Header with Avatar */}
        <div style={styles.header}>
          <div style={{ ...styles.avatar, background: getAvatarColor(user?.name) }}>
            {getInitials(user?.name)}
          </div>
          <h2 style={styles.userName}>{user?.name || "User"}</h2>
          <p style={styles.userEmail}>{user?.email}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        {/* Profile Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Profile Information</h3>
          
          <div style={styles.infoRow}>
            <div style={styles.infoLabel}>
              <span style={styles.infoIcon}>👤</span>
              Full Name
            </div>
            <div style={styles.infoValue}>{user?.name || "Not set"}</div>
          </div>

          <div style={styles.infoRow}>
            <div style={styles.infoLabel}>
              <span style={styles.infoIcon}>✉️</span>
              Email Address
            </div>
            <div style={styles.infoValue}>{user?.email}</div>
          </div>
        </div>

        {/* Settings */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Settings</h3>
          
          <div style={styles.settingRow}>
            <div style={styles.settingLabel}>
              <span style={styles.settingIcon}>🌙</span>
              Dark Mode
            </div>
            <label style={styles.toggle}>
              <input 
                type="checkbox" 
                checked={darkMode} 
                onChange={toggleDarkMode}
                style={styles.toggleInput}
              />
              <span style={{ ...styles.toggleSlider, background: darkMode ? "#6759FF" : "#ddd" }}></span>
            </label>
          </div>

          <div style={styles.settingRow}>
            <div style={styles.settingLabel}>
              <span style={styles.settingIcon}>🔔</span>
              Notifications
            </div>
            <label style={styles.toggle}>
              <input type="checkbox" defaultChecked style={styles.toggleInput} />
              <span style={styles.toggleSlider}></span>
            </label>
          </div>

          <div style={styles.settingRow}>
            <div style={styles.settingLabel}>
              <span style={styles.settingIcon}>📧</span>
              Email Reminders
            </div>
            <label style={styles.toggle}>
              <input type="checkbox" defaultChecked style={styles.toggleInput} />
              <span style={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>
          
          <div style={styles.actionsGrid}>
            <button style={styles.actionBtn} onClick={() => navigate("/instant")}>
              <span style={styles.actionIcon}>⚡</span>
              Instant Meeting
            </button>
            
            <button style={styles.actionBtn} onClick={() => navigate("/schedule")}>
              <span style={styles.actionIcon}>📅</span>
              Schedule Meeting
            </button>
            
            <button style={styles.actionBtn} onClick={() => navigate("/dashboard")}>
              <span style={styles.actionIcon}>🏠</span>
              Dashboard
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={styles.dangerZone}>
          <h3 style={styles.dangerTitle}>Account</h3>
          
          {!showLogoutConfirm ? (
            <button 
              style={styles.logoutBtn}
              onClick={() => setShowLogoutConfirm(true)}
            >
              🚪 Logout
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

        {/* Footer */}
        <div style={styles.footer}>
          <p>Meetify - AI Meeting Assistant</p>
          <p style={styles.version}>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingTop: "5rem",
    minHeight: "calc(100vh - 60px)",
    background: "#F8F9FF",
    display: "flex",
    justifyContent: "center",
    paddingBottom: "2rem",
    paddingLeft: "1rem",
    paddingRight: "1rem",
    width: "100%",
  },
  profileCard: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  loadingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "3rem",
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
    borderBottom: "1px solid #eee",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: "0.5px",
    marginBottom: "1rem",
    fontWeight: 600,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 0",
    borderBottom: "1px solid #f5f5f5",
  },
  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#555",
    fontSize: "0.95rem",
  },
  infoIcon: {
    fontSize: "1.1rem",
  },
  infoValue: {
    fontWeight: 500,
    color: "#1E1E2F",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 0",
    borderBottom: "1px solid #f5f5f5",
  },
  settingLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#555",
  },
  settingIcon: {
    fontSize: "1.1rem",
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
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.8rem",
  },
  actionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.3rem",
    padding: "1rem 0.5rem",
    background: "#F8F9FF",
    border: "1px solid #eee",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: "0.8rem",
    color: "#555",
    transition: "all 0.2s",
  },
  actionIcon: {
    fontSize: "1.3rem",
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
    gap: "0.8rem",
  },
  confirmLogoutBtn: {
    flex: 1,
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
    background: "#f8f9ff",
    color: "#888",
    fontSize: "0.85rem",
  },
  version: {
    margin: "0.3rem 0 0",
    fontSize: "0.75rem",
    color: "#aaa",
  },
};
