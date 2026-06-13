import React, { useState, useRef, useEffect } from "react";
import ThemeToggle from "../ThemeToggle";
import logoSvg from "../photo/Logo.svg";
import { logout } from "../services/authService";
import "./Header.css";

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Header({
  userName = "User",
  userRole = "USER",
  userPhoto = "",
  hasUnreadNotifications = false,
  onNavigate
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = String(userRole || "").toUpperCase() === "ADMIN";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    try { await logout(); } catch { }
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      onNavigate?.("landing");
    }
  };

  return (
    <header className="db-topbar">
      <div className="db-topbar-left">
        <div className="db-logo-row">
          <div className="db-logo-box">
            <img src={logoSvg} alt="Wesselli" className="db-logo-mark" />
          </div>
          <span className="db-brand">Wesselli</span>
        </div>
      </div>

      <div className="db-topbar-right">
        <button type="button" className="db-icon-btn db-bell" onClick={() => onNavigate?.("notifications")}>
          <BellIcon />
          {hasUnreadNotifications && <span className="db-notif-dot" />}
        </button>
        <ThemeToggle />

        {/* User menu */}
        <div className="db-user-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="db-topbar-user"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <div className="db-topbar-avatar">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                userName?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div>
              <span className="db-topbar-username">{userName || "User"}</span>
              <span className="db-topbar-role">{isAdmin ? "Admin account" : "Business account"}</span>
            </div>
          </button>

          {menuOpen && (
            <div className="db-user-dropdown">
              <div className="db-user-dropdown-header">
                <div className="db-user-dropdown-avatar">
                  {userPhoto ? (
                    <img src={userPhoto} alt={userName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    userName?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <p className="db-user-dropdown-name">{userName}</p>
                  <p className="db-user-dropdown-role">{isAdmin ? "Admin account" : "Business account"}</p>
                </div>
              </div>

              <div className="db-user-dropdown-divider" />

              <button type="button" className="db-user-dropdown-item" onClick={() => { setMenuOpen(false); onNavigate?.("profile"); }}>
                <ProfileIcon />
                View profile
              </button>

              <button type="button" className="db-user-dropdown-item" onClick={() => { setMenuOpen(false); onNavigate?.("profileSettings"); }}>
                <SettingsIcon />
                Settings
              </button>

              <div className="db-user-dropdown-divider" />

              <button type="button" className="db-user-dropdown-item db-user-dropdown-item--danger" onClick={handleLogout}>
                <LogoutIcon />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}