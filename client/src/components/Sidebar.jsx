import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { useUser } from "../contexts/UserContext";

const ChatIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={active ? "#10b981" : "#9ca3af"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
      stroke={active ? "#10b981" : "#9ca3af"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      fill={active ? "rgba(16,185,129,0.1)" : "none"}/>
  </svg>
);

const TruckIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M1 3h15v13H1z" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 8h4l3 3v5h-7V8z" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5.5" cy="18.5" r="2.5" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2"/>
    <circle cx="18.5" cy="18.5" r="2.5" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2"/>
  </svg>
);

const RouteIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
      stroke={active ? "#10b981" : "#9ca3af"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke={active ? "#10b981" : "currentColor"} strokeWidth="2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={active ? "#10b981" : "currentColor"} strokeWidth="2" />
  </svg>
);

const SubscriptionIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke={active ? "#10b981" : "currentColor"} strokeWidth="2" />
    <line x1="1" y1="10" x2="23" y2="10" stroke={active ? "#10b981" : "currentColor"} strokeWidth="2" />
  </svg>
);

const AdminIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7l9 5 9-5-9-5z" stroke={active ? "#10b981" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 17l9 5 9-5M3 12l9 5 9-5" stroke={active ? "#10b981" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SidebarToggleIcon = ({ collapsed }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d={collapsed ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Sidebar({
  activeNav = "home",
  onNavigate,
  userRole = "",
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userData } = useUser();
  const userName = userData.name || "";
  const userEmail = userData.email || "";
  const userPhoto = userData.photo || "";

  const isAdmin = String(userRole || "").toUpperCase() === "ADMIN";

  useEffect(() => {
    document.documentElement.style.setProperty("--sb-sidebar-width", isCollapsed ? "88px" : "280px");
  }, [isCollapsed]);

  useEffect(() => () => {
    document.documentElement.style.removeProperty("--sb-sidebar-width");
  }, []);

  const handleNav = (tab) => {
    if (onNavigate) onNavigate(tab);
  };

  return (
    <aside className={`sb-sidebar ${isCollapsed ? "sb-sidebar--collapsed" : ""}`}>
      <button
        type="button"
        className="sb-sidebar-toggle-btn"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <SidebarToggleIcon collapsed={isCollapsed} />
      </button>

      <div className="sb-sidebar-inner">
      <div
        className="sb-sidebar-profile"
        onClick={() => handleNav("profile")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNav("profile");
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="sb-sidebar-avatar">
          {userData.photo ? (
            <img
              src={userData.photo}
              alt={userData.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            userData.name?.charAt(0)?.toUpperCase() || "U"
          )}
        </div>
        <div className="sb-sidebar-user-info">
          <h3 className="sb-sidebar-name">{userData.name || "User"}</h3>
          <p className="sb-sidebar-email">{userData.email}</p>
        </div>
      </div>

      <nav className="sb-sidebar-nav">
        <button
          type="button"
          title="Dashboard"
          aria-label="Dashboard"
          className={`sb-sidebar-nav-item ${activeNav === "home" ? "sb-sidebar-nav-item--active" : ""}`}
          onClick={() => handleNav("home")}
        >
          <HomeIcon active={activeNav === "home"} />
          <span className="sb-sidebar-nav-label">Dashboard</span>
        </button>
        <button
          type="button"
          title="Shipments"
          aria-label="Shipments"
          className={`sb-sidebar-nav-item ${activeNav === "shipments" ? "sb-sidebar-nav-item--active" : ""}`}
          onClick={() => handleNav("shipments")}
        >
          <TruckIcon active={activeNav === "shipments"} />
          <span className="sb-sidebar-nav-label">Shipments</span>
        </button>
        <button
          type="button"
          title="Routes"
          aria-label="Routes"
          className={`sb-sidebar-nav-item ${activeNav === "routes" ? "sb-sidebar-nav-item--active" : ""}`}
          onClick={() => handleNav("routes")}
        >
          <RouteIcon active={activeNav === "routes"} />
          <span className="sb-sidebar-nav-label">Routes</span>
        </button>
        <button
          type="button"
          title="Chat"
          aria-label="Chat"
          className={`sb-sidebar-nav-item ${activeNav === "chat" ? "sb-sidebar-nav-item--active" : ""}`}
          onClick={() => handleNav("chat")}
        >
          <ChatIcon active={activeNav === "chat"} />
          <span className="sb-sidebar-nav-label">Chat</span>
        </button>
        <button
          type="button"
          title="Subscription"
          aria-label="Subscription"
          className={`sb-sidebar-nav-item ${activeNav === "subscription" ? "sb-sidebar-nav-item--active" : ""}`}
          onClick={() => handleNav("subscription")}
        >
          <SubscriptionIcon active={activeNav === "subscription"} />
          <span className="sb-sidebar-nav-label">Subscription</span>
        </button>
        <button
          type="button"
          title="Settings"
          aria-label="Settings"
          className={`sb-sidebar-nav-item ${activeNav === "profileSettings" ? "sb-sidebar-nav-item--active" : ""}`}
          onClick={() => handleNav("profileSettings")}
        >
          <SettingsIcon active={activeNav === "profileSettings"} />
          <span className="sb-sidebar-nav-label">Settings</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            title="Admin Panel"
            aria-label="Admin Panel"
            className={`sb-sidebar-nav-item ${activeNav === "adminPanel" ? "sb-sidebar-nav-item--active" : ""}`}
            onClick={() => handleNav("adminPanel")}
          >
            <AdminIcon active={activeNav === "adminPanel"} />
            <span className="sb-sidebar-nav-label">Admin Panel</span>
          </button>
        )}
      </nav>

      <div className="sb-sidebar-support">
        <div className="sb-sidebar-support-text">
          <p className="sb-sidebar-support-label">Need help?</p>
          <p className="sb-sidebar-support-title">Support 24/7</p>
        </div>
        <button
          type="button"
          className="sb-sidebar-contact-btn"
          onClick={() => handleNav("about")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Contact
        </button>
      </div>
      </div>{/* end sb-sidebar-inner */}
    </aside>
  );
}