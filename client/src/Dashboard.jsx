import React, { useEffect, useState, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider, useUser } from "./contexts/UserContext";
import logoSvg from "./photo/Logo.svg";
import "./Dashboard.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const DASHBOARD_STATS_ENDPOINT = "/dashboard/stats";
const CONTACTS_ENDPOINT = "/chat/contacts";
const MESSAGES_ENDPOINT = "/chat/messages";

// ─── Icons ────────────────────────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
      stroke={active ? "#10b981" : "#9ca3af"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      fill={active ? "rgba(16,185,129,0.1)" : "none"} />
  </svg>
);

const TruckIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M1 3h15v13H1z" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 8h4l3 3v5h-7V8z" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5.5" cy="18.5" r="2.5" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" />
    <circle cx="18.5" cy="18.5" r="2.5" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" />
  </svg>
);

const RouteIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
      stroke={active ? "#10b981" : "#9ca3af"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
    <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

const getToken = () => localStorage.getItem("token");

const DashboardContent = ({
  onNavigate,
  currentUserId,
  hasUnreadNotifications = false,
}) => {
  const { userData } = useUser();
  const userName = userData.name || "User";
  const userRole = userData.role || "USER";
  const userPhoto = userData.photo || "";
  const [activeTab, setActiveTab] = useState("home");
  const [activeShipments, setActiveShipments] = useState(0);
  const [activeRoutes, setActiveRoutes] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setIsStatsLoading(true);
      setStatsError("");
      try {
        const res = await fetch(`${API_URL}${DASHBOARD_STATS_ENDPOINT}`, {
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        setActiveShipments(Number.isFinite(Number(data?.activeShipments)) ? Number(data.activeShipments) : 0);
        setActiveRoutes(Number.isFinite(Number(data?.activeRoutes)) ? Number(data.activeRoutes) : 0);
      } catch {
        if (!isMounted) return;
        setStatsError("Could not load latest stats.");
      } finally {
        if (isMounted) setIsStatsLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${API_URL}/chat/contacts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const contacts = await res.json();
      const totalFromContacts = contacts.reduce((sum, c) => sum + (Number(c.unread) || 0), 0);
      if (totalFromContacts > 0 || contacts.every(c => c.unread !== undefined)) {
        setUnreadMessages(totalFromContacts);
        return;
      }
      const counts = await Promise.all(
        contacts.map(async (contact) => {
          try {
            const mRes = await fetch(`${API_URL}/chat/messages`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({
                fromUser: contact.userId ?? contact.id,
                toUser: currentUserId,
              }),
            });
            if (!mRes.ok) return 0;
            const msgs = await mRes.json();
            return msgs.filter(m => m.read === false || m.isRead === false || m.seen === false).length;
          } catch {
            return 0;
          }
        })
      );
      setUnreadMessages(counts.reduce((a, b) => a + b, 0));
    } catch {
      // silently ignore
    }
  }, [currentUserId]);

  // Only fetch unread count when actively in chat, not on mount
  useEffect(() => {
    if (activeTab !== "chat") return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [activeTab, fetchUnreadCount]);

  const handleNav = (tab) => {
    setActiveTab(tab);
    if (tab === "shipments") onNavigate("shipments");
    if (tab === "routes") onNavigate("routes");
    if (tab === "chat") onNavigate("chat");
    if (tab === "profile") onNavigate("profile");
  };

  const handleChatClick = () => {
    setUnreadMessages(0);
    onNavigate("chat");
  };

  const shipmentLabel = activeShipments === 1 ? "shipment" : "shipments";
  const routeLabel = activeRoutes === 1 ? "route" : "routes";
  const isAdmin = String(userRole || "").toUpperCase() === "ADMIN";
  const badgeLabel = unreadMessages > 99 ? "99+" : String(unreadMessages);

  const MobileLayout = () => (
    <div className="db-mobile-layout">
      <div className="db-header">
        <div className="db-logo-row">
          <div className="db-logo-box">
            <img src={logoSvg} alt="Wesselli logo" className="db-logo-mark" />
          </div>
          <span className="db-brand">WESSELLI</span>
        </div>

        <div className="db-header-icons">
          <button
            className="db-icon-btn db-bell"
            onClick={() => onNavigate("notifications")}
            title="Notifications"
          >
            <BellIcon />
            {hasUnreadNotifications && <span className="db-notif-dot" />}
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="db-body">
        <div className="db-greeting">
          <h1 className="db-greeting-title">Hello, {userName}!</h1>
          <p className="db-greeting-sub">Welcome back to your logistics dashboard.</p>
        </div>

        <button className="db-cta-btn" onClick={() => onNavigate("createShipment")}>
          <span className="db-cta-icon"><PlusIcon /></span>
          Post a New Shipment
          <span className="db-cta-arrow"><ArrowRightIcon /></span>
        </button>

        {isAdmin && (
          <div className="db-card" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => onNavigate("adminPanel")}>
            <div className="db-card-img" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80")', backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="db-card-body">
              <div className="db-card-row">
                <h3 className="db-card-title">Admin Panel</h3>
                <span className="db-badge db-badge--transit">ADMIN</span>
              </div>
              <p className="db-card-desc">Manage users, routes, shipments, and more.</p>
              <p className="db-card-time"><ClockIcon />Administrative controls</p>
              <button className="db-view-btn">Open</button>
            </div>
          </div>
        )}

        <div className="db-card" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => onNavigate("subscription")}>
          <div className="db-card-img" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80")', backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="db-card-body">
            <div className="db-card-row">
              <h3 className="db-card-title">Subscription Plans</h3>
              <span className="db-badge db-badge--transit">UPGRADE</span>
            </div>
            <p className="db-card-desc">Unlock premium features with our flexible plans.</p>
            <p className="db-card-time"><ClockIcon />Choose your momentum</p>
            <button className="db-view-btn">View Plans</button>
          </div>
        </div>

        <div className="db-card" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => onNavigate("activeShipments")}>
          <div className="db-card-img db-card-img--containers" />
          <div className="db-card-body">
            <div className="db-card-row">
              <h3 className="db-card-title">Your Shipments</h3>
              <span className="db-badge db-badge--transit">ALL</span>
            </div>
            <p className="db-card-desc">You have <strong>{isStatsLoading ? "..." : `${activeShipments} ${shipmentLabel}`}</strong> total.</p>
            <p className="db-card-time"><ClockIcon />{statsError || "Live Data"}</p>
            <button className="db-view-btn">View Details</button>
          </div>
        </div>

        <div className="db-card" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => onNavigate("activeRoutes")}>
          <div className="db-card-img db-card-img--truck" />
          <div className="db-card-body">
            <div className="db-card-row">
              <h3 className="db-card-title">Your Routes</h3>
              <span className="db-badge db-badge--transit">ALL</span>
            </div>
            <p className="db-card-desc">You have <strong>{isStatsLoading ? "..." : `${activeRoutes} ${routeLabel}`}</strong> total.</p>
            <p className="db-card-time"><ClockIcon />{statsError || "Live Data"}</p>
            <button className="db-view-btn">View Details</button>
          </div>
        </div>
      </div>

      <div className="db-bottom-nav">
        <button className={`db-nav-item ${activeTab === "home" ? "db-nav-item--active" : ""}`} onClick={() => handleNav("home")}>
          <HomeIcon active={activeTab === "home"} />
          <span>HOME</span>
        </button>

        <button className={`db-nav-item ${activeTab === "shipments" ? "db-nav-item--active" : ""}`} onClick={() => handleNav("shipments")}>
          <TruckIcon active={activeTab === "shipments"} />
          <span>SHIPMENTS</span>
        </button>

        <button className="db-nav-chat" onClick={handleChatClick} aria-label={unreadMessages > 0 ? `Messages, ${badgeLabel} unread` : "Messages"} title="Open chat" type="button">
          <ChatIcon />
          {unreadMessages > 0 && <span className="db-nav-chat-badge">{badgeLabel}</span>}
        </button>

        <button className={`db-nav-item ${activeTab === "routes" ? "db-nav-item--active" : ""}`} onClick={() => handleNav("routes")}>
          <RouteIcon active={activeTab === "routes"} />
          <span>ROUTES</span>
        </button>

        <button className={`db-nav-item ${activeTab === "profile" ? "db-nav-item--active" : ""}`} onClick={() => handleNav("profile")}>
          <ProfileIcon active={activeTab === "profile"} />
          <span>PROFILE</span>
        </button>
      </div>
    </div>
  );

  const DesktopLayout = () => (
    <div className="db-desktop-layout">
      <Sidebar
        activeNav={activeTab}
        onNavigate={(tab) => {
          if (tab === "home") { setActiveTab("home"); onNavigate("dashboard"); }
          else if (tab === "shipments") { handleNav("shipments"); }
          else if (tab === "routes") { handleNav("routes"); }
          else if (tab === "chat") { handleNav("chat"); }
          else if (tab === "profile") { handleNav("profile"); }
          else { onNavigate(tab); }
        }}
        userRole={userRole}
      />

      <div className="db-main">
        <Header
          userName={userName}
          userRole={userRole}
          userPhoto={userPhoto}
          hasUnreadNotifications={hasUnreadNotifications}
          onNavigate={onNavigate}
        />

        <div className="db-content">
          <div className="db-content-inner">
            {/* ── Hero Welcome Banner ── */}
            <div className="db-hero-banner">
              <div className="db-hero-text">
                <p className="db-desktop-welcome">Welcome back,</p>
                <h1 className="db-desktop-title">{userName.split(" ")[0]}'s Logistics Hub</h1>
                <p className="db-hero-subtitle">Here's an overview of your logistics operations today.</p>
              </div>
              <div className="db-hero-actions">
                <button type="button" className="db-cta-btn db-cta-btn--desktop" onClick={() => onNavigate("createShipment")}>
                  <PlusIcon />
                  New Shipment
                </button>
                <button type="button" className="db-cta-btn db-cta-btn--desktop db-cta-btn--outline" onClick={() => onNavigate("createRoute")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  New Route
                </button>
              </div>
            </div>

            {statsError && <div className="db-desktop-status">{statsError}</div>}

            <div className="db-stat-cards">
              <div className="db-stat-card db-stat-card--dark" onClick={() => onNavigate("activeShipments")} role="button" tabIndex={0}>
                <div className="db-stat-card-top">
                  <span className="db-stat-label">Active Shipments</span>
                  <div className="db-stat-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /></svg>
                  </div>
                </div>
                <div className="db-stat-value">{isStatsLoading ? "..." : activeShipments.toLocaleString()}</div>
                <div className="db-stat-sub">+12 today</div>
                <div className="db-stat-wave" />
              </div>

              <div className="db-stat-card db-stat-card--dark" onClick={() => onNavigate("activeRoutes")} role="button" tabIndex={0}>
                <div className="db-stat-card-top">
                  <span className="db-stat-label">Active Routes</span>
                  <div className="db-stat-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
                <div className="db-stat-value">{isStatsLoading ? "..." : activeRoutes.toLocaleString()}</div>
                <div className="db-stat-sub">{activeRoutes === 1 ? "1 in transit" : `${activeRoutes} in transit`}</div>
                <div className="db-stat-wave" />
              </div>

              <div className="db-stat-card db-stat-card--dark" role="button" tabIndex={0}>
                <div className="db-stat-card-top">
                  <span className="db-stat-label">Available Vehicles</span>
                  <div className="db-stat-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
                <div className="db-stat-value">{isStatsLoading ? "..." : "0"}</div>
                <div className="db-stat-sub">This month</div>
                <div className="db-stat-wave" />
              </div>
            </div>

            <div className="db-section">
              <div className="db-section-header">
                <div>
                  <h2 className="db-section-title">Quick Access</h2>
                  <p className="db-section-sub">Jump to any workspace</p>
                </div>
                <button type="button" className="db-view-all-btn" onClick={() => onNavigate("shipments")}>View all</button>
              </div>
              <div className="db-quick-grid">
                <button type="button" className="db-quick-card db-quick-card--featured" onClick={() => onNavigate("activeShipments")}>
                  <div className="db-quick-card-top">
                    <span className="db-quick-icon">📦</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="db-quick-arrow">
                      <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="db-quick-label">Active Shipments</span>
                  <span className="db-quick-desc">Track live parcels in motion</span>
                  <span className="db-quick-meta">{isStatsLoading ? "..." : `${activeShipments} active`}</span>
                </button>

                <button type="button" className="db-quick-card" onClick={() => onNavigate("activeRoutes")}>
                  <div className="db-quick-card-top">
                    <span className="db-quick-icon">🗺️</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="db-quick-arrow">
                      <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="db-quick-label">Active Routes</span>
                  <span className="db-quick-desc">Monitor all running routes</span>
                  <span className="db-quick-meta">{isStatsLoading ? "..." : `${activeRoutes} routes`}</span>
                </button>

                <button type="button" className="db-quick-card" onClick={() => onNavigate("shipments")}>
                  <div className="db-quick-card-top">
                    <span className="db-quick-icon">🔍</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="db-quick-arrow">
                      <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="db-quick-label">Explore Shipments</span>
                  <span className="db-quick-desc">Browse history & insights</span>
                  <span className="db-quick-meta">Discover</span>
                </button>

                <button type="button" className="db-quick-card" onClick={() => onNavigate("subscription")}>
                  <div className="db-quick-card-top">
                    <span className="db-quick-icon">💳</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="db-quick-arrow">
                      <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="db-quick-label">Subscription</span>
                  <span className="db-quick-desc">Plans, billing & invoices</span>
                  <span className="db-quick-meta">Business</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="db-screen">
      <div className="db-container">
        <div className="db-show-mobile">
          <MobileLayout />
        </div>
        <div className="db-show-desktop">
          <DesktopLayout />
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({
  onNavigate,
  userName = "User",
  userRole = "USER",
  currentUserId,
  hasUnreadNotifications = false,
}) => {
  return (
    <UserProvider>
      <DashboardContent
        onNavigate={onNavigate}
        currentUserId={currentUserId}
        hasUnreadNotifications={hasUnreadNotifications}
      />
    </UserProvider>
  );
};

export default Dashboard;