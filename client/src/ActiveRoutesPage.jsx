import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConfirmDialog from "./ConfirmDialog";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider, useUser } from "./contexts/UserContext";
import { deleteRoute, getMyRoutes } from "./services/routeService";
import { toastError, toastSuccess } from "./services/toastService";
import "./Routes.css";
import "./ActiveManage.css";

const formatRouteStatus = (value) => {
  const normalized = String(value || "").toUpperCase().trim();
  switch (normalized) {
    case "SCHEDULED": return "Scheduled";
    case "IN_PROGRESS": return "In Progress";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Cancelled";
    default: return normalized ? normalized.replace(/_/g, " ") : "Unknown";
  }
};

const statusCssKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const formatDateOnly = (value) => {
  if (!value) return "";
  const text = String(value);
  const [datePart] = text.split("T");
  return datePart || text;
};

function ActiveRoutesPageContent({ onBack, onNavigate, hasUnreadNotifications = false }) {
  const { userData } = useUser();
  const userName = userData.name || "User";
  const userRole = userData.role || "USER";
  const userPhoto = userData.photo || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!error) return;
    toastError(error);
  }, [error]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyRoutes();
        const normalized = data.map((item) => ({
          ...item,
          id: item?.route_ID || item?.id,
          name: item?.name || "Unnamed route",
        }));
        setItems(normalized);
      } catch (err) {
        setError(err?.message || "Failed to load active routes.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sortedItems = useMemo(() => [...items].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0)), [items]);

  const handleDelete = async () => {
    if (!confirmTarget?.id) return;
    setBusyId(confirmTarget.id);
    try {
      await deleteRoute(confirmTarget.id);
      setItems((prev) => prev.filter((item) => item.id !== confirmTarget.id));
      setConfirmTarget(null);
      toastSuccess("Route deleted");
    } catch (err) {
      setError(err?.message || "Failed to delete route.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSidebarNav = (tab) => {
    if (tab === "home") onNavigate?.("dashboard");
    else if (tab === "shipments") onNavigate?.("shipments");
    else if (tab === "routes") onNavigate?.("routes");
    else if (tab === "profile") onNavigate?.("profile");
    else onNavigate?.(tab);
  };

  /* shared card renderer */
  const renderCard = (item) => (
    <article className="sh-card am-card-item" key={item.id} style={{ borderLeft: 'none' }}>
      <div className="sh-card-top">
        <div className="sh-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="2" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="sh-card-info">
          <span className="sh-card-name">{item.name}</span>
          <span className="sh-card-time">Route #{item.id}</span>
        </div>

        <button
          className="am-menu-btn am-menu-btn--floating"
          type="button"
          onClick={() => setOpenMenuId((prev) => (prev === item.id ? null : item.id))}
          disabled={busyId === item.id}
        >
          <MoreVertical size={16} />
        </button>

        {openMenuId === item.id && (
          <div className="am-actions-menu" ref={menuRef}>
            <button className="am-actions-item" type="button" onClick={() => onNavigate("editActiveRoute", { activeRouteId: item.id, from: "activeRoutes" })}>
              <Pencil size={18} /> Update
            </button>
            <button className="am-actions-item" type="button" onClick={() => onNavigate("routeDetails", { routeId: item.id, from: "activeRoutes" })}>
              <Eye size={18} /> View Details
            </button>
            <button className="am-actions-item am-actions-item--delete" type="button" onClick={() => setConfirmTarget(item)}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="sh-card-footer">
        <div className="sh-card-tags">
          <span className={`sh-status-tag sh-status-tag--${statusCssKey(item.status)}`}>
            {formatRouteStatus(item.status)}
          </span>
          <span className="sh-tag">Type: {item.post_type || "ORIGIN_DESTINATION"}</span>
          {item.vehicle_plate != null ? <span className="sh-tag">Plate: {item.vehicle_plate}</span> : null}
          {item.date ? <span className="sh-tag">Date: {formatDateOnly(item.date)}</span> : null}
        </div>
      </div>

      <p className="am-card-description">
        {String(item.more_Information || item.description || item.notes || "No description provided.")}
      </p>
      <div className="sh-card-route">
        {item.post_type === "REGION" ? (
          <div className="sh-route-row">
            <span className="sh-route-dot sh-route-dot--green" />
            <div>
              <span className="sh-route-label">REGION</span>
              <span className="sh-route-val">{item.region || "Region not specified"}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="sh-route-row">
              <span className="sh-route-dot sh-route-dot--green" />
              <div>
                <span className="sh-route-label">ORIGIN</span>
                <span className="sh-route-val">{item.origin || "Origin not specified"}</span>
              </div>
            </div>
            <div className="sh-route-row">
              <span className="sh-route-dot sh-route-dot--gray" />
              <div>
                <span className="sh-route-label">DESTINATION</span>
                <span className="sh-route-val">{item.destination || "Destination not specified"}</span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="am-row-meta">
        {item.interval_start ? <span className="am-chip">From: {formatDateOnly(item.interval_start)}</span> : null}
        {item.interval_end ? <span className="am-chip">To: {formatDateOnly(item.interval_end)}</span> : null}
      </div>
    </article>
  );

  const listContent = (
    <>
      {error ? <div className="am-state">{error}</div> : null}
      {loading ? (
        <div className="am-state">Loading...</div>
      ) : sortedItems.length === 0 ? (
        <div className="am-state">No routes found.</div>
      ) : (
        <div className="am-list am-desktop-grid">
          {sortedItems.map(renderCard)}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile Layout (unchanged) ── */}
      <div className="am-page am-show-mobile">
        <div className="am-card">
          <header className="am-header">
            <button className="am-back" onClick={onBack} type="button">
              <ArrowLeft size={18} />
            </button>
            <div className="am-headtext">
              <h1>Your Routes</h1>
              <p>Manage your route posts.</p>
            </div>
            <ThemeToggle />
          </header>
          <div className="am-body">{listContent}</div>
        </div>
      </div>

      {/* ── Desktop Layout ── */}
      <div className="am-desktop-layout am-show-desktop">
        <Sidebar activeNav="routes" onNavigate={handleSidebarNav} userRole={userRole} />
        <div className="am-desktop-main">
          <Header
            userName={userName}
            userRole={userRole}
            userPhoto={userPhoto}
            hasUnreadNotifications={hasUnreadNotifications}
            onNavigate={onNavigate}
          />
          <div className="am-desktop-content">
            <div className="am-desktop-content-inner">
              <div className="am-desktop-page-header">
                <button className="am-desktop-back" onClick={onBack} type="button">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="am-desktop-page-title">Your Routes</h1>
                  <p className="am-desktop-page-sub">Manage your route posts.</p>
                </div>
              </div>
              {listContent}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete Route"
        message={confirmTarget ? `Delete route #${confirmTarget.id}?` : ""}
        confirmLabel="Yes"
        cancelLabel="No"
        loading={busyId === confirmTarget?.id}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

export default function ActiveRoutesPage(props) {
  return (
    <UserProvider>
      <ActiveRoutesPageContent {...props} />
    </UserProvider>
  );
}
