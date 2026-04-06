import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMoon,
  FaBell,
  FaEnvelopeOpenText,
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
  FaCamera,
  FaUserEdit,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaSignOutAlt,
  FaCircle,
} from "react-icons/fa";
import { useDarkMode } from "../context/DarkModeContext";
import { clearAuthSession, getRefreshToken } from "../authSession";
import { API_BASE, getApiErrorMessage } from "../api";
import { useToast } from "../components/ToastProvider";
import PasswordInput from "../components/PasswordInput";
import AppPopup from "../components/AppPopup";
import { focusFirstInvalidField } from "../utils/formUtils";
import "./Profile.css";

const PERSIST_KEYS = {
  avatar: "profile_avatar_data_url",
  notifications: "profile_notifications_enabled",
  reminders: "profile_email_reminders_enabled",
};

function calculatePasswordStrength(password) {
  if (!password) return { label: "Weak", score: 0, percentage: 0 };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score <= 2) return { label: "Weak", score, percentage: 30 };
  if (score <= 4) return { label: "Medium", score, percentage: 62 };
  return { label: "Strong", score, percentage: 100 };
}

function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

function getInitials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableName, setEditableName] = useState("");
  const [nameError, setNameError] = useState("");

  const [avatarDataUrl, setAvatarDataUrl] = useState(() => localStorage.getItem(PERSIST_KEYS.avatar) || "");
  const avatarInputRef = useRef(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem(PERSIST_KEYS.notifications) !== "false"
  );
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(
    localStorage.getItem(PERSIST_KEYS.reminders) !== "false"
  );

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pendingPasswordOtp, setPendingPasswordOtp] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const passwordFormRef = useRef(null);
  const otpFormRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem(PERSIST_KEYS.notifications, String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem(PERSIST_KEYS.reminders, String(emailRemindersEnabled));
  }, [emailRemindersEnabled]);

  useEffect(() => {
    if (avatarDataUrl) {
      localStorage.setItem(PERSIST_KEYS.avatar, avatarDataUrl);
    }
  }, [avatarDataUrl]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await res.json();
        setUser(data);
        setEditableName(data?.name || "");
        localStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        const message = err?.message || "Unable to load profile.";
        setError(message);
        const cached = localStorage.getItem("user");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUser(parsed);
            setEditableName(parsed?.name || "");
          } catch {
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  const accountStatus = user?.is_active === false ? "Inactive" : "Active";
  const lastLoginValue =
    user?.last_login ||
    user?.last_login_at ||
    user?.last_seen ||
    user?.updated_at ||
    localStorage.getItem("last_login_at");

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(user?.name),
      Boolean(user?.email),
      Boolean(user?.email_verified),
      Boolean(avatarDataUrl),
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [avatarDataUrl, user]);

  const handleLogout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    clearAuthSession();
    navigate("/login");
  };

  const validateNewPassword = (value) => {
    if (!value || value.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
    if (!/\d/.test(value)) return "Password must include at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Password must include at least one special character.";
    return "";
  };

  const validatePasswordForm = () => {
    const nextErrors = {};

    if (!oldPassword.trim()) nextErrors.oldPassword = "Current password is required.";
    if (!newPassword.trim()) {
      nextErrors.newPassword = "New password is required.";
    } else {
      const validation = validateNewPassword(newPassword);
      if (validation) nextErrors.newPassword = validation;
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "New password and confirm password do not match.";
    }

    if (newPassword && oldPassword && newPassword === oldPassword) {
      nextErrors.newPassword = "New password must be different from current password.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    const isValid = validatePasswordForm();
    if (!isValid) {
      toast.error("Please fix the highlighted password fields.", "Validation");
      focusFirstInvalidField(passwordFormRef.current);
      return;
    }

    setPwdLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, "Failed to change password."));

      const successMsg = data.message || "Password change OTP sent.";
      setPwdSuccess(successMsg);
      setPendingPasswordOtp(true);
      setPasswordOtp("");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
      toast.success("OTP sent to your email for password confirmation.", "Verification required");
    } catch (err) {
      const message = err?.message || "Something went wrong.";
      setPwdError(message);
      toast.error(message, "Password update failed");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleConfirmPasswordOtp = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    const cleanedOtp = passwordOtp.trim();
    if (!cleanedOtp) {
      const otpError = "Enter the OTP sent to your email.";
      setFieldErrors((prev) => ({ ...prev, otp: otpError }));
      setPwdError(otpError);
      focusFirstInvalidField(otpFormRef.current);
      return;
    }

    setOtpLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/change-password/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: cleanedOtp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, "Failed to confirm password change."));

      const successMsg = data.message || "Password changed successfully.";
      setPwdSuccess(successMsg);
      setPendingPasswordOtp(false);
      setPasswordOtp("");
      setFieldErrors((prev) => ({ ...prev, otp: "" }));
      toast.success("Password updated successfully.", "Security updated");
    } catch (err) {
      const message = err?.message || "Something went wrong.";
      setPwdError(message);
      toast.error(message, "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Please upload an image file.", "Invalid file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.warning("Image should be smaller than 2 MB.", "Large file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (!url) return;
      setAvatarDataUrl(url);
      toast.success("Profile photo updated.", "Avatar changed");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const trimmed = editableName.trim();
    if (trimmed.length < 2) {
      setNameError("Please enter your full name.");
      return;
    }

    setNameError("");
    const updated = { ...(user || {}), name: trimmed };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
    setEditMode(false);
    toast.success("Profile details updated.", "Saved");
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
    if (darkMode) {
      toast.info("Light mode enabled.", "Theme updated");
    } else {
      toast.success("Dark mode enabled ??", "Theme updated");
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      toast.info(next ? "Notifications enabled." : "Notifications muted.", "Settings");
      return next;
    });
  };

  const handleToggleReminders = () => {
    setEmailRemindersEnabled((prev) => {
      const next = !prev;
      toast.info(next ? "Email reminders enabled." : "Email reminders turned off.", "Settings");
      return next;
    });
  };

  if (loading) {
    return (
      <div className={`profile-page ${darkMode ? "profile-page--dark" : ""}`}>
        <div className="profile-loading-card">
          <div className="profile-spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-page ${darkMode ? "profile-page--dark" : ""}`}>
      <div className="profile-shell">
        <section className="profile-header-card">
          <div className="profile-header-glow" />
          <button className="profile-edit-btn" type="button" onClick={() => setEditMode((prev) => !prev)}>
            <FaUserEdit />
            {editMode ? "Cancel Edit" : "Edit Profile"}
          </button>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="profile-avatar-input"
            onChange={handleAvatarChange}
          />

          <button className="profile-avatar" type="button" onClick={handleAvatarClick} title="Change profile photo">
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt="Profile avatar" className="profile-avatar-image" />
            ) : (
              <span>{getInitials(user?.name)}</span>
            )}
            <span className="profile-avatar-overlay">
              <FaCamera />
              Change
            </span>
          </button>

          <div className="profile-identity">
            {editMode ? (
              <>
                <label className="required-label profile-input-label">Full Name</label>
                <input
                  type="text"
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  className={`profile-input ${nameError ? "input-invalid" : ""}`}
                  data-invalid={nameError ? "true" : "false"}
                  placeholder="Enter your full name"
                />
                {nameError ? <p className="field-error">{nameError}</p> : null}
                <button className="profile-save-btn" type="button" onClick={handleSaveProfile}>
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <h1>{user?.name || "User"}</h1>
                <p>{user?.email || "No email"}</p>
              </>
            )}
          </div>

          <div className="profile-meta-grid">
            <article className="profile-meta-card">
              <div className="profile-meta-label">
                <FaClock /> Last Login
              </div>
              <div className="profile-meta-value">{formatDateTime(lastLoginValue)}</div>
            </article>

            <article className="profile-meta-card">
              <div className="profile-meta-label">
                <FaCheckCircle /> Account Status
              </div>
              <div className="profile-meta-value">{accountStatus}</div>
            </article>

            <article className="profile-meta-card">
              <div className="profile-meta-label">
                <FaShieldAlt /> Profile Completion
              </div>
              <div className="profile-progress-row">
                <div className="profile-progress-track">
                  <div className="profile-progress-fill" style={{ width: `${profileCompletion}%` }} />
                </div>
                <span>{profileCompletion}%</span>
              </div>
            </article>
          </div>
        </section>

        {error ? <div className="profile-banner-error">{error}</div> : null}

        <section className="profile-section-card">
          <div className="profile-section-heading">Settings</div>
          <div className="profile-setting-row">
            <div>
              <p className="profile-setting-title"><FaMoon /> Dark Mode</p>
              <p className="profile-setting-desc">Use a low-light theme for comfortable viewing.</p>
            </div>
            <label className="profile-toggle">
              <input type="checkbox" checked={darkMode} onChange={handleDarkModeToggle} />
              <span />
            </label>
          </div>

          <div className="profile-divider" />

          <div className="profile-setting-row">
            <div>
              <p className="profile-setting-title"><FaBell /> Notifications</p>
              <p className="profile-setting-desc">Receive product and meeting notifications.</p>
            </div>
            <label className="profile-toggle">
              <input type="checkbox" checked={notificationsEnabled} onChange={handleToggleNotifications} />
              <span />
            </label>
          </div>

          <div className="profile-divider" />

          <div className="profile-setting-row">
            <div>
              <p className="profile-setting-title"><FaEnvelopeOpenText /> Email Reminders</p>
              <p className="profile-setting-desc">Get reminder emails for upcoming meetings.</p>
            </div>
            <label className="profile-toggle">
              <input type="checkbox" checked={emailRemindersEnabled} onChange={handleToggleReminders} />
              <span />
            </label>
          </div>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">Quick Actions</div>
          <div className="profile-actions-grid">
            <button
              type="button"
              className="profile-action-card"
              title="Start a meeting right away"
              onClick={() => navigate("/instant")}
            >
              <div className="profile-action-icon"><FaBolt /></div>
              <div>
                <p className="profile-action-title">Instant Meeting</p>
                <p className="profile-action-desc">Start now and invite participants instantly.</p>
              </div>
            </button>

            <button
              type="button"
              className="profile-action-card"
              title="Schedule a meeting for later"
              onClick={() => navigate("/schedule")}
            >
              <div className="profile-action-icon"><FaCalendarAlt /></div>
              <div>
                <p className="profile-action-title">Schedule Meeting</p>
                <p className="profile-action-desc">Plan meetings with date, time, and agenda.</p>
              </div>
            </button>

            <button
              type="button"
              className="profile-action-card"
              title="Open your dashboard"
              onClick={() => navigate("/dashboard")}
            >
              <div className="profile-action-icon"><FaChartLine /></div>
              <div>
                <p className="profile-action-title">Dashboard</p>
                <p className="profile-action-desc">Track upcoming meetings and key insights.</p>
              </div>
            </button>
          </div>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">Security</div>

          <ul className="password-rule-list">
            <li>Minimum 8 characters</li>
            <li>At least one uppercase, lowercase, number, and special character</li>
            <li>New password must be different from current password</li>
          </ul>

          <div className="password-strength-wrap" aria-live="polite">
            <div className="password-strength-track">
              <div
                className={`password-strength-fill password-strength-${passwordStrength.label.toLowerCase()}`}
                style={{ width: `${passwordStrength.percentage}%` }}
              />
            </div>
            <span className={`password-strength-label password-strength-${passwordStrength.label.toLowerCase()}-text`}>
              Strength: {passwordStrength.label}
            </span>
          </div>

          {pwdError ? <div className="profile-banner-error profile-inline-banner">{pwdError}</div> : null}
          {pwdSuccess ? <div className="profile-banner-success profile-inline-banner">{pwdSuccess}</div> : null}

          <form ref={passwordFormRef} onSubmit={handleChangePassword} noValidate className="profile-form-grid">
            <div>
              <label className="required-label profile-input-label">Current Password</label>
              <PasswordInput
                className={`profile-input ${fieldErrors.oldPassword ? "input-invalid" : ""}`}
                containerClassName="profile-password-wrap"
                toggleButtonClassName="profile-eye-btn"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, oldPassword: "" }));
                }}
                data-invalid={fieldErrors.oldPassword ? "true" : "false"}
                required
              />
              {fieldErrors.oldPassword ? <p className="field-error">{fieldErrors.oldPassword}</p> : null}
            </div>

            <div>
              <label className="required-label profile-input-label">New Password</label>
              <PasswordInput
                className={`profile-input ${fieldErrors.newPassword ? "input-invalid" : ""}`}
                containerClassName="profile-password-wrap"
                toggleButtonClassName="profile-eye-btn"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                }}
                data-invalid={fieldErrors.newPassword ? "true" : "false"}
                required
              />
              {fieldErrors.newPassword ? <p className="field-error">{fieldErrors.newPassword}</p> : null}
            </div>

            <div>
              <label className="required-label profile-input-label">Confirm New Password</label>
              <PasswordInput
                className={`profile-input ${fieldErrors.confirmPassword ? "input-invalid" : ""}`}
                containerClassName="profile-password-wrap"
                toggleButtonClassName="profile-eye-btn"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                data-invalid={fieldErrors.confirmPassword ? "true" : "false"}
                required
              />
              {fieldErrors.confirmPassword ? <p className="field-error">{fieldErrors.confirmPassword}</p> : null}
            </div>

            <button type="submit" className="profile-primary-btn" disabled={pwdLoading}>
              {pwdLoading ? "Updating..." : "Change Password"}
            </button>
          </form>

          {pendingPasswordOtp ? (
            <form ref={otpFormRef} onSubmit={handleConfirmPasswordOtp} noValidate className="profile-otp-form">
              <label className="required-label profile-input-label">Email OTP</label>
              <input
                className={`profile-input profile-otp-input ${fieldErrors.otp ? "input-invalid" : ""}`}
                value={passwordOtp}
                onChange={(e) => {
                  setPasswordOtp(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, otp: "" }));
                }}
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
                maxLength={6}
                data-invalid={fieldErrors.otp ? "true" : "false"}
                required
              />
              {fieldErrors.otp ? <p className="field-error">{fieldErrors.otp}</p> : null}
              <button type="submit" className="profile-secondary-btn" disabled={otpLoading}>
                {otpLoading ? "Verifying..." : "Confirm OTP"}
              </button>
            </form>
          ) : null}
        </section>

        <section className="profile-section-card profile-account-card">
          <div>
            <p className="profile-section-heading">Account</p>
            <p className="profile-account-subtitle">Use logout safely to protect your account on shared devices.</p>
          </div>
          <button type="button" className="profile-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
            <FaSignOutAlt /> Logout
          </button>
        </section>

        <footer className="profile-footer-links">
          <a href="/support">Help & Support</a>
          <span><FaCircle /></span>
          <a href="/privacy">Privacy Policy</a>
          <span><FaCircle /></span>
          <a href="/contact">Contact Us</a>
        </footer>
      </div>

      <AppPopup
        open={showLogoutConfirm}
        title="Leave your account session?"
        message="Are you sure you want to logout from this device?"
        confirmLabel="Yes, Logout"
        cancelLabel="No, Stay"
        confirmVariant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
