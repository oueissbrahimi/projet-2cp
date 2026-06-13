import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  IdCard,
  RefreshCw,
  Route,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import {
  exportRoutesCsv,
  exportShipmentsCsv,
  exportUsersCsv,
  getAdminDashboardStats,
} from "./services/adminService";
import { toastError, toastSuccess } from "./services/toastService";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider, useUser } from "./contexts/UserContext";
import "./AdminPanel.css";

/* ── Small shared UI pieces ─────────────────────────────────── */

function StatCard({ label, value, badge }) {
  return (
    <div className="ap-stat-card">
      <p className="ap-stat-label">{label}</p>
      <p className="ap-stat-value">{value}</p>
      {badge && (
        <div className={`ap-stat-badge ap-stat-badge--${badge.type}`}>
          {badge.icon && <span className="ap-stat-badge-icon">{badge.icon}</span>}
          <span>{badge.text}</span>
        </div>
      )}
    </div>
  );
}

function StatSkeleton() {
  return <div className="ap-stat-card ap-skeleton" />;
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="ap-error-banner">
      <span>{message}</span>
      <button className="ap-btn ap-btn--retry" type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

/* ── Shared content body (used in both layouts) ─────────────── */

function AdminPanelContent({ loading, error, apiDown, exportError, exporting, loadAdminStats, summaryCards, highlights, exportsList }) {
  return (
    <>
      {error && <ErrorBanner message={error} onRetry={loadAdminStats} />}

      <section className="ap-grid">
        {loading
          ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
          : summaryCards.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} badge={item.badge} />
            ))}
      </section>

      <div className="ap-two-col">
        <section className="ap-section">
          <h2 className="ap-section-title">Export Data</h2>
          <p className="ap-export-desc">
            Export user data, route data and shipment data from database into a structured CSV file
            with proper formatting.
          </p>
          {exportError && <p className="ap-export-error">{exportError}</p>}
          <div className="ap-export-list">
            {exportsList.map((item) => (
              <div className="ap-export-row" key={item.key}>
                <div className="ap-export-left">
                  <div className="ap-export-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                </div>
                <button
                  className="ap-export-btn"
                  type="button"
                  onClick={item.onClick}
                  disabled={exporting[item.key]}
                >
                  {exporting[item.key] ? "EXPORTING..." : item.action}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="ap-section">
          <h2 className="ap-section-title">Quick actions</h2>
          <div className="ap-highlight-list">
            {highlights.map((item) => (
              <article className="ap-highlight-card" key={item.id}>
                <div className="ap-highlight-icon">{item.icon}</div>
                <div className="ap-highlight-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <button className="ap-btn" type="button" onClick={item.onClick}>
                  {item.action}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="ap-section ap-section--status">
        <h2 className="ap-section-title">System status</h2>
        <div className="ap-health-row">
          <div className={`ap-health-item ${apiDown ? "ap-health-item--down" : "ap-health-item--ok"}`}>
            <CheckCircle2 size={16} />
            <span>{apiDown ? "API is not running" : "API available"}</span>
          </div>
          <div className="ap-health-item ap-health-item--warning">
            <AlertTriangle size={16} />
            <span>No Logs Currently</span>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Main inner component ───────────────────────────────────── */

function AdminPanelInner({ onNavigate, onBack }) {
  const { userData } = useUser();

  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [apiDown, setApiDown]         = useState(false);
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting]     = useState({ users: false, routes: false, shipments: false });

  const triggerDownload = (blob, filename) => {
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (key, exporter) => {
    setExportError("");
    setExporting((p) => ({ ...p, [key]: true }));
    try {
      const { blob, filename } = await exporter();
      triggerDownload(blob, filename);
      toastSuccess("Export completed", { description: `${filename} has been downloaded.` });
    } catch (err) {
      setExportError(err?.message || "Failed to export data.");
    } finally {
      setExporting((p) => ({ ...p, [key]: false }));
    }
  };

  useEffect(() => { if (error)       toastError(error);       }, [error]);
  useEffect(() => { if (exportError) toastError(exportError); }, [exportError]);

  const loadAdminStats = useCallback(async () => {
    setLoading(true);
    setError("");
    setApiDown(false);
    try {
      const data = await getAdminDashboardStats();
      setStats(data || {});
    } catch (err) {
      const msg    = String(err?.message || "").toLowerCase();
      const offline =
        err?.status == null ||
        msg.includes("failed to fetch") ||
        msg.includes("network") ||
        msg.includes("load failed");
      if (offline) {
        setApiDown(true);
        setError("Admin API is not running. Please start the server and try again.");
      } else {
        setError(err?.message || "Failed to load admin dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdminStats(); }, [loadAdminStats]);

  const summaryCards = useMemo(() => {
    if (!stats) return [];
    const totalUsers      = Number(stats?.users?.total    ?? 0);
    const activeUsers     = Number(stats?.users?.active   ?? 0);
    const activeShipments = Number(stats?.activeShipments ?? 0);
    const totalRoutes     = Number(stats?.routes?.total   ?? 0);
    const completionRate  = totalUsers > 0
      ? ((activeUsers / totalUsers) * 100).toFixed(1)
      : "0.0";
    return [
      {
        label: "NEW USERS (MONTH)",
        value: totalUsers.toLocaleString(),
        badge: { text: `${totalUsers > 0 ? "+" : ""}12%`, type: "green", icon: <TrendingUp size={13} /> },
      },
      {
        label: "ACTIVE SHIPMENTS",
        value: activeShipments.toLocaleString(),
        badge: { text: "Live", type: "green", icon: <RefreshCw size={13} className="ap-spin" /> },
      },
      {
        label: "TOTAL ROUTES",
        value: totalRoutes.toLocaleString(),
        badge: { text: "National", type: "gray" },
      },
      {
        label: "COMPLETION RATE",
        value: `${completionRate}%`,
        badge: { text: "Target", type: "green" },
      },
    ];
  }, [stats]);

  const highlights = [
    {
      id: "users",
      icon: <Users size={18} />,
      title: "User management",
      description: "Review all users, and activate or suspend access in one place.",
      action: "View Users",
      onClick: () => onNavigate?.("usersList"),
    },
    {
      id: "shipments",
      icon: <Truck size={18} />,
      title: "Shipments overview",
      description: `Currently active shipments: ${Number(stats?.activeShipments ?? 0)}`,
      action: "Open Shipments",
      onClick: () => onNavigate?.("shipments"),
    },
    {
      id: "routes",
      icon: <Route size={18} />,
      title: "Routes monitoring",
      description: `Currently active routes: ${Number(stats?.activeRoutes ?? 0)}`,
      action: "Open Routes",
      onClick: () => onNavigate?.("routes"),
    },
    {
      id: "subscriptions",
      icon: <IdCard size={18} />,
      title: "Subscription management",
      description: "View all subscriptions and manage updates or deletions.",
      action: "Manage Subscriptions",
      onClick: () => onNavigate?.("adminSubscriptions"),
    },
  ];

  const exportsList = [
    { key: "users",     icon: <IdCard size={20} />, title: "User Info",     action: "EXPORT", onClick: () => handleExport("users",     exportUsersCsv)     },
    { key: "routes",    icon: <Route  size={20} />, title: "Route Info",    action: "EXPORT", onClick: () => handleExport("routes",    exportRoutesCsv)    },
    { key: "shipments", icon: <Truck  size={20} />, title: "Shipment Info", action: "EXPORT", onClick: () => handleExport("shipments", exportShipmentsCsv) },
  ];

  const sharedProps = {
    loading, error, apiDown, exportError, exporting,
    loadAdminStats, summaryCards, highlights, exportsList,
  };

  const handleSidebarNav = (tab) => {
    if (tab === "home") onNavigate?.("dashboard");
    else onNavigate?.(tab);
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════
          MOBILE  —  only visible below 768 px
          Controlled by: .ap-mobile-only in AdminPanel.css
      ══════════════════════════════════════════════════ */}
      <div className="ap-mobile-only">
        <div className="ap-mobile-root">
          <div className="ap-mobile-wrapper">
            <div className="ap-header">
              <button className="ap-back-btn" type="button" onClick={onBack}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="ap-title">Admin Panel</h1>
                <p className="ap-subtitle">Manage users, routes, shipments, and system operations.</p>
              </div>
              <ThemeToggle />
            </div>
            <AdminPanelContent {...sharedProps} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          DESKTOP  —  only visible at 768 px and above
          Controlled by: .ap-desktop-only in AdminPanel.css
          Uses db-desktop-layout / db-main / db-content-inner
          from Dashboard.css so Sidebar positions identically.
      ══════════════════════════════════════════════════ */}
      <div className="ap-desktop-only">
        <div className="ap-desktop-root db-desktop-layout">
          <Sidebar
            activeNav="adminPanel"
            onNavigate={handleSidebarNav}
            userRole={userData?.role || "ADMIN"}
          />
          <div className="db-main">
            <Header
              userName={userData?.name  || "Admin"}
              userRole={userData?.role  || "ADMIN"}
              userPhoto={userData?.photo || ""}
              hasUnreadNotifications={false}
              onNavigate={onNavigate}
            />
            <div className="db-content">
              <div className="db-content-inner">
                <div className="ap-desktop-heading">
                  <div>
                    <h1 className="ap-title">Admin Panel</h1>
                    <p className="ap-subtitle">Manage users, routes, shipments, and system operations.</p>
                  </div>
                </div>
                <AdminPanelContent {...sharedProps} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Default export wrapped in UserProvider ─────────────────── */

export default function AdminPanel({ onNavigate, onBack }) {
  return (
    <UserProvider>
      <AdminPanelInner onNavigate={onNavigate} onBack={onBack} />
    </UserProvider>
  );
}