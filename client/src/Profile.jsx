import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./components/Sidebar";
import { useUser } from "./contexts/UserContext";
import {
  MapPin, Mail, Phone, Settings, LogOut,
  ChevronRight, Star, CheckCircle, Truck, Edit3,
  ArrowLeft, XCircle, AlertCircle, Check, X, Package,
  Pencil, Trash2, MoreVertical, Eye, ChevronUp
} from "lucide-react";
import { getMyProfile, getShipmentHistory, getRouteHistory, getVehicles } from "./services/profileService";
import { deleteVehicle } from "./services/vehicleService";
import { toastError, toastSuccess } from "./services/toastService";
import ConfirmDialog from "./ConfirmDialog";
import { logout } from "./services/authService";
import { resolveMediaUrl } from "./utils/media";
import logoSvg from "./photo/Logo.svg";
import "./Profile.css";

const SHOW_ACTIVE_DEVICES = false;
const SHOW_PRIVACY_POLICY = false;
const SHOW_HELP_CENTER = false;
const SUPPORT_EMAIL = "wessellisupport@gmail.com";

const settingsGroups = [
  {
    label: "Account",
    items: [
      { label: "Subscription Plan", icon: "star", action: "subscription" },
    ],
  },
  {
    label: "Security",
    items: [
      { label: "Change Password", icon: "lock", action: "forgot" },
      { label: "Active Devices", icon: "devices", action: "activeDevices", hidden: !SHOW_ACTIVE_DEVICES },
      { label: "Privacy Policy", icon: "privacy", hidden: !SHOW_PRIVACY_POLICY },
    ],
  },
  {
    label: "Support & Info",
    items: [
      { label: "Help Center", icon: "help", hidden: !SHOW_HELP_CENTER },
      { label: "Contact Us", icon: "contact", action: "contact" },
      { label: "About Wesselli", icon: "info", action: "about" },
      { label: "Logout", icon: "logout", red: true, action: "logout" },
    ],
  },
];

function SettingsItemIcon({ type }) {
  const icons = {
    star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    devices: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M8 20h2" /><rect x="18" y="8" width="4" height="8" rx="1" /></svg>,
    privacy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>,
    help: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h.01M9 12h.01M9 15h.01M12 9h3M12 12h3M12 15h3" /></svg>,
    contact: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round" /><line x1="12" y1="12" x2="12" y2="16" /></svg>,
    logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  };
  return icons[type] || null;
}

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DefaultAvatar = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <circle cx="50" cy="50" r="50" fill="#f5f5f5" />
    <circle cx="50" cy="38" r="17" fill="#b3b3b3" />
    <path d="M16 87c5-16 19-24 34-24s29 8 34 24" fill="#b3b3b3" />
  </svg>
);

const statusStyles = {
  PENDING: { color: "#f59e0b", bg: "#fff7ed", border: "#fde68a" },
  MATCHED: { color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
  PICKED_UP: { color: "#92400e", bg: "#fef9c3", border: "#fde68a" },
  IN_TRANSIT: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  DELIVERED: { color: "#00c46a", bg: "#e8faf2", border: "#b2f0d4" },
  SCHEDULED: { color: "#0f766e", bg: "#ecfdf5", border: "#99f6e4" },
  IN_PROGRESS: { color: "#f59e0b", bg: "#fff7ed", border: "#fde68a" },
  COMPLETED: { color: "#00c46a", bg: "#e8faf2", border: "#b2f0d4" },
  Available: { color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" },
  FAILED: { color: "#ef4444", bg: "#fff0f0", border: "#fecaca" },
  CANCELLED: { color: "#ef4444", bg: "#fff0f0", border: "#fecaca" },
  Maintenance: { color: "#f59e0b", bg: "#fff7ed", border: "#fde68a" },
  ACTIVE: { color: "#00c46a", bg: "#e8faf2", border: "#b2f0d4" },
};

function StatusBadge({ status }) {
  const s = statusStyles[status] || statusStyles.Available;
  return (
    <span
      className={`status-badge ${status}`}
      style={{
        border: `1px solid ${s.border}`,
        color: s.color,
        background: s.bg,
      }}
    >
      {status}
    </span>
  );
}

function HistoryIconBox({ type }) {
  const configs = {
    check: { bg: "#e8faf2", icon: <CheckCircle size={20} color="#00c46a" /> },
    truck: { bg: "#fff3e0", icon: <Truck size={20} color="#f59e0b" /> },
    box: { bg: "#94a3b8", icon: <Package size={20} color="#ffffff" /> },
    alert: { bg: "#fff0f0", icon: <AlertCircle size={20} color="#ef4444" /> },
  };
  const c = configs[type];
  return (
    <div style={{ width: 44, height: 44, borderRadius: 13, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {c.icon}
    </div>
  );
}

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TruckIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5.5" cy="18.5" r="2.5" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" />
    <circle cx="18.5" cy="18.5" r="2.5" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" />
  </svg>
);

const RouteIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const getHistoryIconType = (status) => {
  if (status === "FAILED" || status === "CANCELLED") return "alert";
  if (status === "DELIVERED" || status === "COMPLETED") return "check";
  if (["PENDING", "MATCHED", "PICKED_UP", "IN_TRANSIT", "SCHEDULED", "IN_PROGRESS"].includes(status)) return "truck";
  return "box";
};

export default function Profile({ onNavigate, hasUnreadNotifications = false }) {
  const { userData: userContextData } = useUser();
  const [page, setPage] = useState("profile");
  const [activeNav, setActiveNav] = useState("profile");
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [desktopSettingsOpen, setDesktopSettingsOpen] = useState(false);
  const [desktopContactOpen, setDesktopContactOpen] = useState(false);
  const settingsPanelRef = useRef(null);
  const [userData, setUserData] = useState({
    type: "",
    verified: false,
    subscriptionTier: "Free",
    name: "",
    location: "",
    additionalLocations: [],
    rating: 0,
    reviews: 0,
    email: "",
    phone: "",
    profilePhoto: "",
  });
  const [historyItems, setHistoryItems] = useState([]);
  const [truckItems, setTruckItems] = useState([]);
  const [shipmentCount, setShipmentCount] = useState(0);
  const [routeCount, setRouteCount] = useState(0);
  const [menuOpenIndex, setMenuOpenIndex] = useState(-1);
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuOpenIndex === -1) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenIndex]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const verified = Boolean(userData.verified);

  const handleLogout = async () => {
    try { await logout(); } catch { }
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      onNavigate?.("landing");
    }
  };

  const handleNav = (tab) => {
    setActiveNav(tab);
    if (!onNavigate) return;
    if (tab === "home") onNavigate("dashboard");
    if (tab === "shipments") onNavigate("shipments");
    if (tab === "routes") onNavigate("routes");
    if (tab === "profile") onNavigate("profile");
  };

  const handleHistoryItemClick = (item) => {
    if (!onNavigate || !item) return;
    if (item.type === "shipment") {
      if (item.rawId != null) onNavigate("shipmentDetails", { shipmentId: item.rawId });
      else onNavigate("shipments");
      return;
    }
    if (item.type === "route") {
      if (item.rawId != null) onNavigate("routeDetails", { routeId: item.rawId, from: "profile" });
      else onNavigate("routes");
      return;
    }
    onNavigate("routes");
  };

  useEffect(() => {
    let isMounted = true;

    const toHistoryStatusLabel = (status) => {
      const raw = String(status || "").trim().toLowerCase();
      if (raw.includes("pending")) return "PENDING";
      if (raw.includes("matched") || raw.includes("accept")) return "MATCHED";
      if (raw.includes("picked")) return "PICKED_UP";
      if (raw.includes("transit") || raw.includes("delivery")) return "IN_TRANSIT";
      if (raw.includes("delivered")) return "DELIVERED";
      if (raw.includes("complete")) return "COMPLETED";
      if (raw.includes("schedule")) return "SCHEDULED";
      if (raw.includes("progress")) return "IN_PROGRESS";
      if (raw.includes("cancel")) return "CANCELLED";
      if (raw.includes("fail")) return "FAILED";
      return "COMPLETED";
    };

    const loadProfileData = async () => {
      try {
        const [profile, historyResponse, routeHistoryResponse, vehiclesResponse] = await Promise.all([
          getMyProfile(),
          getShipmentHistory(),
          getRouteHistory(),
          getVehicles(),
        ]);

        if (!isMounted) return;

        const businessLocations = Array.isArray(profile?.business?.locations)
          ? profile.business.locations.map((value) => String(value || "").trim()).filter(Boolean)
          : [];
        const mainBusinessLocation = businessLocations[0] || "";
        const additionalBusinessLocations = businessLocations.slice(1);

        setUserData({
          type: String(profile?.type || ""),
          verified: Boolean(profile?.individual || profile?.business),
          subscriptionTier: profile?.subscription?.tier || "Free",
          name: profile?.displayName || "",
          location: profile?.individual?.location || mainBusinessLocation,
          additionalLocations: profile?.individual ? [] : additionalBusinessLocations,
          rating: Number(profile?.rating ?? 0),
          reviews: Number(profile?.reviews ?? 0),
          email: profile?.email || "",
          phone: profile?.phone || "",
          profilePhoto: typeof profile?.profile_Photo === "string" ? profile.profile_Photo.trim() : "",
        });

        const shipments = Array.isArray(historyResponse?.shipments)
          ? historyResponse.shipments
          : Array.isArray(historyResponse?.data)
            ? historyResponse.data
            : [];

        const normalizedHistory = shipments.map((item) => {
          const normalizedStatus = toHistoryStatusLabel(item?.status);
          const shipmentId = item?.shipment_ID || item?.id || null;
          const normalizedTitle =
            String(item?.title || "").trim() ||
            String(item?.shipmentName || "").trim() ||
            String(item?.name || "").trim() ||
            (item?.category ? `${item.category} Shipment` : "") ||
            (shipmentId ? `Shipment #${shipmentId}` : "Shipment");

          return {
            id: shipmentId || `ID-${Math.random().toString(36).slice(2, 7)}`,
            rawId: shipmentId,
            type: "shipment",
            title: normalizedTitle,
            date: item?.date || "Unknown date",
            kindLabel: "SHIPMENT",
            status: normalizedStatus,
            icon: getHistoryIconType(normalizedStatus),
            origin: item?.origin || "-",
            destination: item?.destination || "-",
          };
        });

        const routes = Array.isArray(routeHistoryResponse?.routes)
          ? routeHistoryResponse.routes
          : Array.isArray(routeHistoryResponse?.data)
            ? routeHistoryResponse.data
            : [];

        const normalizedRouteHistory = routes.map((item) => {
          const normalizedStatus = toHistoryStatusLabel(item?.status);
          const routeId = item?.route_ID || item?.id || null;
          const isRegionPost =
            String(item?.post_type || "").toUpperCase() === "REGION" ||
            (!item?.origin && !item?.destination && !!item?.region);
          const routeDate =
            String(item?.date_type || "").toUpperCase() === "INTERVAL"
              ? `${item?.interval_start || "Unknown start"} to ${item?.interval_end || "Unknown end"}`
              : item?.date || "Unknown date";
          const routeTitle =
            isRegionPost
              ? `Region: ${item?.region || "Unknown region"}`
              : item?.name ||
              item?.route_Name ||
              `${item?.origin || "Unknown origin"} -> ${item?.destination || "Unknown destination"}`;

          return {
            id: routeId || `R-${Math.random().toString(36).slice(2, 7)}`,
            rawId: routeId,
            type: "route",
            title: routeTitle,
            date: routeDate,
            kindLabel: isRegionPost ? "REGION POST" : "ORIGIN/DESTINATION",
            status: normalizedStatus,
            icon: getHistoryIconType(normalizedStatus),
            origin: isRegionPost ? (item?.region || "-") : (item?.origin || "-"),
            destination: isRegionPost ? "-" : (item?.destination || "-"),
          };
        });

        const mergedHistory = [...normalizedHistory, ...normalizedRouteHistory].sort((a, b) => {
          const aDate = Date.parse(a?.date || "");
          const bDate = Date.parse(b?.date || "");
          if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) return bDate - aDate;
          const aId = Number(a?.rawId);
          const bId = Number(b?.rawId);
          if (!Number.isNaN(aId) && !Number.isNaN(bId)) return bId - aId;
          return 0;
        });

        setHistoryItems(mergedHistory);
        setShipmentCount(normalizedHistory.length);
        setRouteCount(normalizedRouteHistory.length);

        const vehicles = Array.isArray(vehiclesResponse?.vehicles)
          ? vehiclesResponse.vehicles
          : Array.isArray(vehiclesResponse?.data)
            ? vehiclesResponse.data
            : [];

        const normalizedTrucks = vehicles.map((vehicle, index) => {
          const hasActiveRoute = Array.isArray(vehicle?.routes)
            ? vehicle.routes.some((route) => ["SCHEDULED", "IN_PROGRESS"].includes(String(route?.status || "").toUpperCase()))
            : false;

          const photo = typeof vehicle?.photo === "string" ? vehicle.photo.trim() : "";

          return {
            name: vehicle?.vehicle_Name || `Vehicle ${index + 1}`,
            capacity: `${vehicle?.capacity ?? "-"} Tons`,
            status: hasActiveRoute ? "ACTIVE" : "Available",
            img: photo,
            hasPhoto: Boolean(photo),
            year: vehicle?.year || "-",
            plate: vehicle?.plate_Number || "-",
            driver: "-",
            trips: Array.isArray(vehicle?.routes) ? vehicle.routes.length : 0,
            fuel: "-",
            color: String(vehicle?.color || "").trim() || "-",
          };
        });

        setTruckItems(normalizedTrucks);
      } catch {
        if (!isMounted) return;
        setHistoryItems([]);
        setTruckItems([]);
      }
    };

    loadProfileData();
    return () => { isMounted = false; };
  }, []);

  const previewHistory = historyItems.slice(0, 2);
  const previewTrucks = truckItems.slice(0, 3);

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setDeletingVehicle(true);
    try {
      await deleteVehicle(vehicleToDelete.plate);
      toastSuccess("Vehicle deleted");
      setTruckItems((prev) => prev.filter((t) => t.plate !== vehicleToDelete.plate));
      if (page === "truckDetail") setPage("allTrucks");
    } catch (err) {
      toastError(err?.message || "Failed to delete vehicle");
    } finally {
      setDeletingVehicle(false);
      setConfirmDeleteOpen(false);
      setVehicleToDelete(null);
    }
  };

  const subPageHeader = (title, onBack) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, zIndex: 10 }}>
      <button onClick={onBack} className="back-btn-interactive" type="button">
        <ArrowLeft size={22} />
      </button>
      <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "1.2px", color: "var(--text-primary)" }}>{title}</span>
    </div>
  );

  const shell = (children) => (
    <div className="profile-root profile-subpage-shell">
      <div className="profile-subpage-shell-inner">
        <div className="profile-subpage-desktop">
          <Sidebar activeNav={activeNav} onNavigate={handleDesktopNavigate} userRole={userContextData?.role || ""} />
          <div className="profile-subpage-content">{children}</div>
        </div>
      </div>
    </div>
  );

  const handleDesktopNavigate = (tab) => {
    setActiveNav(tab);

    if (!onNavigate) return;
    if (tab === "home") onNavigate("dashboard");
    else if (tab === "shipments") onNavigate("shipments");
    else if (tab === "routes") onNavigate("routes");
    else if (tab === "profile") onNavigate("profile");
    else onNavigate(tab);
  };

  // Desktop settings action handler — logout goes through handleLogout, others navigate
  const handleDesktopSettingsAction = async (action) => {
    if (!action) return;
    if (action === "contact") {
      setDesktopContactOpen((prev) => !prev);
      return;
    }
    if (action === "logout") {
      handleLogout();
      return;
    }
    onNavigate?.(action);
  };

  if (page === "allHistory") return shell(<>
    {subPageHeader("ALL HISTORY", () => setPage("profile"))}
    <div className="all-history-card">
      {historyItems.length === 0 ? (
        <div className="all-history-empty">No history</div>
      ) : historyItems.map((item, i) => (
        <div
          key={`${item.type}-${item.id}-${i}`}
          onClick={() => handleHistoryItemClick(item)}
          className="subpage-row-interactive all-history-row"
          style={{ ...(i < historyItems.length - 1 ? { borderBottom: "1px solid var(--border-color)" } : {}) }}
        >
          <div className="all-history-row-left">
            <HistoryIconBox type={item.icon} />
            <div>
              <div className="all-history-title">{item.title}</div>
              <div className="all-history-meta">
                {item.date}{item.kindLabel ? ` • ${item.kindLabel}` : ""} • #{item.id}
              </div>
            </div>
          </div>
          <div className="all-history-row-right">
            <StatusBadge status={item.status} />
            <ChevronRight size={14} color="var(--text-secondary)" />
          </div>
        </div>
      ))}
    </div>
  </>);

  if (page === "allTrucks") return shell(<>
    {subPageHeader("ALL TRUCKS", () => setPage("profile"))}
    <div className="all-trucks-card" style={{ background: "var(--bg-secondary)", borderRadius: 16, margin: "12px 16px 0", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
      {truckItems.length === 0 ? (
        <div style={{ padding: "18px", color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, textAlign: "center" }}>No vehicles</div>
      ) : truckItems.map((truck, i) => (
        <div key={i}
          className="alltrucks-row-interactive"
          style={{ ...(i < truckItems.length - 1 ? { borderBottom: "1px solid var(--border-color)" } : {}) }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }} onClick={() => { setSelectedTruck(truck); setPage("truckDetail"); }}>
            {truck.hasPhoto ? (
              <img src={resolveMediaUrl(truck.img)} alt={truck.name} className="truck-img-hover" style={{ width: 52, height: 52, borderRadius: 13, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 13, background: "rgba(148,163,184,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Truck size={24} color="#94a3b8" />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{truck.name}</div>
              <div style={{ fontSize: 12, marginTop: 2, color: "var(--text-secondary)" }}>Capacity: {truck.capacity}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            <StatusBadge status={truck.status} />
            <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpenIndex(menuOpenIndex === i ? -1 : i); }} className="more-btn-interactive">
              <MoreVertical size={16} />
            </button>
            {menuOpenIndex === i && (
              <div ref={menuRef} className="menu-dropdown-anim" style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 50, overflow: "hidden", minWidth: 150 }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpenIndex(-1); setSelectedTruck(truck); setPage("truckDetail"); }} className="menu-item-interactive" style={{ color: "var(--text-primary)" }}>
                  <Eye size={14} color="#10b981" /> View Details
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpenIndex(-1); onNavigate?.("editVehicle", { vehicle: truck }); }} className="menu-item-interactive" style={{ color: "var(--text-primary)", borderTop: "1px solid var(--border-color)" }}>
                  <Pencil size={14} color="#f59e0b" /> Update
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpenIndex(-1); setVehicleToDelete(truck); setConfirmDeleteOpen(true); }} className="menu-item-interactive" style={{ color: "#ef4444", borderTop: "1px solid var(--border-color)" }}>
                  <Trash2 size={14} color="#ef4444" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
    <ConfirmDialog
      open={confirmDeleteOpen}
      title="Delete Vehicle"
      message={vehicleToDelete ? `Delete vehicle ${vehicleToDelete.name} (${vehicleToDelete.plate})?` : ""}
      confirmLabel="Yes"
      cancelLabel="No"
      loading={deletingVehicle}
      onCancel={() => { setConfirmDeleteOpen(false); setVehicleToDelete(null); }}
      onConfirm={handleDeleteVehicle}
    />
  </>);

  if (page === "truckDetail" && selectedTruck) {
    const t = selectedTruck;
    const st = statusStyles[t.status] || statusStyles.Available;
    const details = [
      { label: "Plate Number", value: t.plate },
      { label: "Year", value: t.year },
      { label: "Capacity", value: t.capacity },
      { label: "Fuel Type", value: t.fuel },
      { label: "Color", value: t.color },
      { label: "Driver", value: t.driver },
      { label: "Total Trips", value: t.trips },
    ];
    return shell(<>
      {subPageHeader("TRUCK DETAILS", () => setPage("allTrucks"))}
      <div>
        <div style={{ margin: "12px 16px 0", borderRadius: 16, overflow: "hidden", height: 180, position: "relative", background: "rgba(148,163,184,0.12)" }}>
          {t.hasPhoto ? (
            <img src={resolveMediaUrl(t.img)} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={64} color="#94a3b8" />
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{t.name}</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{t.plate}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "4px 12px", border: `1px solid ${st.border}`, color: st.color, background: st.bg }}>{t.status}</span>
          </div>
        </div>
        <div style={{ background: "var(--bg-secondary)", borderRadius: 16, margin: "10px 16px 0", padding: 20, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 14 }}>Truck Information</div>
          {details.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", ...(i < details.length - 1 ? { borderBottom: "1px solid var(--border-color)" } : {}) }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{d.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{d.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, margin: "16px 16px 0" }}>
          <button className="action-btn-green" type="button" onClick={() => onNavigate?.("editVehicle", { vehicle: t })}>
            <Pencil size={14} /> Update
          </button>
          <button className="action-btn-red" type="button" onClick={() => { setVehicleToDelete(t); setConfirmDeleteOpen(true); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Vehicle"
        message={vehicleToDelete ? `Delete vehicle ${vehicleToDelete.name} (${vehicleToDelete.plate})?` : ""}
        confirmLabel="Yes"
        cancelLabel="No"
        loading={deletingVehicle}
        onCancel={() => { setConfirmDeleteOpen(false); setVehicleToDelete(null); }}
        onConfirm={handleDeleteVehicle}
      />
    </>);
  }

  return (
    <div className="profile-root">
      <div className="profile-container">
        <div className="profile-desktop-wrap">
          <Sidebar activeNav={activeNav} onNavigate={handleDesktopNavigate} userRole={userContextData.role || ""} />

          <section className="profile-desktop-main">
            <header className="profile-desktop-header">
              <div className="profile-desktop-brand">
                <div className="profile-desktop-logo-box">
                  <img src={logoSvg} alt="Wesselli" className="profile-desktop-logo-img" />
                </div>
                <span>Wesselli</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>My Profile</h2>
              <div className="profile-desktop-actions">
                <button type="button" className="profile-desktop-bell-btn" onClick={() => onNavigate?.("notifications")}>
                  <BellIcon />
                  {hasUnreadNotifications && <span className="profile-desktop-notif-dot" />}
                </button>
                <ThemeToggle />
              </div>
            </header>

            <div className="profile-desktop-hero">
              <div className="profile-desktop-hero-left">
                <div className={`avatar-ring ${verified ? "verified" : "unverified"}`}>
                  {userData.profilePhoto ? <img src={resolveMediaUrl(userData.profilePhoto)} alt="profile" className="avatar-img" /> : <DefaultAvatar />}
                </div>
                <div>
                  <h2 className="profile-desktop-title">{userData.name || "User"}</h2>
                  <p className="profile-desktop-sub"><MapPin size={13} /> {userData.location || "Location not provided"}</p>
                  <p className="profile-desktop-rating"><Star size={13} fill="#10b981" color="#10b981" /> {userData.rating}/5 ({userData.reviews} reviews)</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Settings toggle button — desktop only */}
                <button
                  className={`profile-desktop-settings-btn${desktopSettingsOpen ? " active" : ""}`}
                  type="button"
                  onClick={() => {
                    setDesktopSettingsOpen((prev) => !prev);
                    if (desktopSettingsOpen) setDesktopContactOpen(false);
                    if (!desktopSettingsOpen) {
                      // scroll to panel after it opens
                      setTimeout(() => settingsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
                    }
                  }}
                  aria-expanded={desktopSettingsOpen}
                  aria-label={desktopSettingsOpen ? "Close settings" : "Open settings"}
                >
                  <Settings size={14} />
                  Settings
                  <ChevronUp
                    size={14}
                    className={`profile-desktop-settings-chevron${desktopSettingsOpen ? " rotated" : ""}`}
                  />
                </button>
                <button className="profile-desktop-edit" onClick={() => onNavigate?.("editProfile")}><Edit3 size={14} /> Edit Profile</button>
              </div>
            </div>

            <div className="profile-desktop-grid">
              <div className="profile-desktop-card">
                <h3 className="profile-desktop-card-title"><Mail size={16} /> Contact Information</h3>
                <div className="profile-desktop-contact-item"><Mail size={16} color="#10b981" /> {userData.email || "No email"}</div>
                <div className="profile-desktop-contact-item"><Phone size={16} color="#10b981" /> {userData.phone || "No phone"}</div>
                <div className="profile-desktop-contact-item"><MapPin size={16} color="#10b981" /> {userData.location || "No location"}</div>
              </div>

              <div className="profile-desktop-card profile-desktop-history">
                <div className="profile-desktop-card-header">
                  <h3 className="profile-desktop-card-title"><Package size={16} /> History</h3>
                  <button className="profile-desktop-view-all" onClick={() => setPage("allHistory")} type="button">View All</button>
                </div>
                <div className="profile-desktop-table-head">
                  <span>TYPE</span><span>ID</span><span>Details</span><span>Origin</span><span>Destination</span><span>Status</span>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {historyItems.length === 0 ? (
                  <div style={{ padding: "14px 0", color: "var(--text-secondary)", fontSize: 13, textAlign: "center" }}>No history</div>
                ) : historyItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="profile-desktop-table-row" onClick={() => handleHistoryItemClick(item)}>
                    <span>
                      {item.type === "route"
                        ? <span className="profile-desktop-type-badge route-type"><Truck size={10} /> Route</span>
                        : <span className="profile-desktop-type-badge ship-type"><Package size={10} /> Ship</span>
                      }
                    </span>
                    <span style={{ fontWeight: 600 }}>#{item.id}</span>
                    <span className="profile-desktop-title-cell">{item.title}</span>
                    <span className="profile-desktop-title-cell">{item.origin || "-"}</span>
                    <span className="profile-desktop-title-cell">{item.destination || "-"}</span>
                    <span><StatusBadge status={item.status} /></span>
                  </div>
                ))}
                </div>
              </div>

              <div className="profile-desktop-card profile-desktop-trucks">
                <div className="profile-desktop-card-header">
                  <h3 className="profile-desktop-card-title"><Truck size={16} /> My Trucks</h3>
                  <button className="profile-desktop-view-all profile-desktop-view-all--light" onClick={() => setPage("allTrucks")} type="button">View All</button>
                </div>
                {previewTrucks.length === 0 ? (
                  <p className="profile-desktop-empty">No vehicles</p>
                ) : previewTrucks.map((t, i) => (
                  <div key={i} className="profile-desktop-truck-row" onClick={() => { setSelectedTruck(t); setPage("truckDetail"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="profile-desktop-truck-thumb">
                        {t.hasPhoto
                          ? <img src={resolveMediaUrl(t.img)} alt={t.name} style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "cover" }} />
                          : <Truck size={15} color="#e6f4ec" />
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#e6f4ec" }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(230,244,236,0.65)" }}>{t.capacity}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusBadge status={t.status} />
                      <button type="button" className="profile-desktop-eye-btn" onClick={(e) => { e.stopPropagation(); setSelectedTruck(t); setPage("truckDetail"); }}>
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="profile-desktop-card profile-desktop-add-vehicle">
                <h3 className="profile-desktop-card-title"><Truck size={16} /> Add Vehicle</h3>
                <p className="profile-desktop-kpi-text">Add a new truck to your fleet and assign it to routes.</p>
                <button className="profile-desktop-add-btn" onClick={() => onNavigate?.("vehicle")}>+ Add Vehicle</button>
              </div>

              <div className="profile-desktop-card profile-desktop-kpi">
                <h3 className="profile-desktop-card-title">Activity Statistics</h3>
                <p className="profile-desktop-kpi-text">You have posted</p>
                <div className="profile-desktop-kpi-grid">
                  <div><strong>{shipmentCount}</strong><span>Shipments</span></div>
                  <div><strong>{routeCount}</strong><span>Routes</span></div>
                </div>
              </div>
            </div>

            {/* ── Desktop inline settings panel ── */}
            {desktopSettingsOpen && (
              <div
                ref={settingsPanelRef}
                className="profile-desktop-settings-panel"
                role="region"
                aria-label="Settings"
              >
                {/* Panel header with collapse arrow */}
                <div className="profile-desktop-settings-panel-header">
                  <span className="profile-desktop-settings-panel-title"><Settings size={15} /> Settings</span>
                  <button
                    type="button"
                    className="profile-desktop-settings-close-btn"
                    onClick={() => { setDesktopSettingsOpen(false); setDesktopContactOpen(false); }}
                    aria-label="Close settings"
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>

                <div className="profile-desktop-settings-groups">
                  {settingsGroups.map((group) => (
                    <div key={group.label} className="profile-desktop-settings-group">
                      <div className="profile-desktop-settings-section-label">{group.label}</div>
                      <div className="profile-desktop-settings-group-card">
                        {group.items.filter((item) => !item.hidden).map((item) => (
                          <div key={item.label}>
                            <div
                              className={`profile-desktop-settings-item${item.red ? " red" : ""}`}
                              onClick={() => handleDesktopSettingsAction(item.action)}
                            >
                              <div className={`profile-desktop-settings-icon${item.red ? " red" : ""}`}>
                                <SettingsItemIcon type={item.icon} />
                              </div>
                              <span className={`profile-desktop-settings-label${item.red ? " red" : ""}`}>{item.label}</span>
                              {!item.red && <ChevronRight size={15} color="var(--text-secondary)" style={{ marginLeft: "auto" }} />}
                            </div>
                            {item.action === "contact" && desktopContactOpen && (
                              <div className="profile-desktop-settings-contact-box">
                                <span className="profile-desktop-settings-contact-label">Support Email</span>
                                <span className="profile-desktop-settings-contact-value">{SUPPORT_EMAIL}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="profile-mobile-wrap profile-page-enter">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, letterSpacing: "1.5px", color: "var(--text-primary)" }}>
              <ProfileIcon active={false} />
              MY PROFILE
            </span>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <ThemeToggle />
              <button type="button" aria-label="Notifications" onClick={() => onNavigate("notifications")} className="bell-btn">
                <BellIcon />
                {hasUnreadNotifications && (
                  <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                )}
              </button>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border-color)", margin: "0 20px" }} />

          {/* Avatar section */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 30px", gap: 10 }}>
            <button type="button" onClick={() => onNavigate?.("editProfile")} aria-label="Edit profile photo" className="profile-avatar-btn">
              <div className={`avatar-ring ${verified ? "verified" : "unverified"}`} style={{ width: 100, height: 100, borderRadius: "50%", padding: 3 }}>
                {userData.profilePhoto ? (
                  <img src={resolveMediaUrl(userData.profilePhoto)} alt="profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}><DefaultAvatar /></div>
                )}
              </div>
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: "50%", background: verified ? "#10b981" : "#ef4444", border: "2px solid var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {verified ? <Check size={13} color="#ffffff" strokeWidth={3} /> : <X size={13} color="#ffffff" strokeWidth={3} />}
              </div>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <div className={`verified-pill-interactive ${verified ? "verified" : "unverified"}`} style={{ background: verified ? "#e8faf2" : "#fff0f0" }}>
                {verified ? <CheckCircle size={13} color="#10b981" /> : <XCircle size={13} color="#ef4444" />}
                <span style={{ fontSize: 12, fontWeight: 600, color: verified ? "#10b981" : "#ef4444" }}>{verified ? "Verified" : "Not Verified"}</span>
              </div>
              <div className="verified-pill-interactive" style={{ background: "#ecfeff" }}>
                <CheckCircle size={13} color="#0891b2" />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0e7490" }}>Tier: {userData.subscriptionTier || "Free"}</span>
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{userData.name || "User"}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{userData.location || "Location not provided"}</span>
            </div>
            <div className="rating-pill-interactive">
              <Star size={14} color="#10b981" fill="#10b981" />
              <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>{userData.rating}/5 Rating</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>({userData.reviews} Reviews)</span>
            </div>
            <button className="edit-btn" onClick={() => onNavigate?.("editProfile")} type="button"><Edit3 size={15} /> EDIT PROFILE</button>
          </div>

          <div style={{ height: 10 }} />

          {/* Contact Information */}
          <div className="profile-card-interactive profile-card-enter">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, background: "rgba(16,185,129,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={14} color="#10b981" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Contact Information</span>
            </div>
            {[
              { icon: <Mail size={16} color="#10b981" />, value: userData.email || "No email" },
              { icon: <Phone size={16} color="#10b981" />, value: userData.phone || "No phone" },
              { icon: <MapPin size={16} color="#10b981" />, value: userData.location || "No location" },
            ].map((item, i) => (
              <div key={i} className="contact-row-interactive">
                <div className="contact-icon-circle-anim" style={{ width: 34, height: 34, background: "rgba(16,185,129,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
                <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{item.value}</span>
              </div>
            ))}
            {String(userData.type).toUpperCase() === "BUSINESS" && Array.isArray(userData.additionalLocations) && userData.additionalLocations.length > 0 && (
              <div style={{ padding: "12px 0", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>Other Locations</div>
                {userData.additionalLocations.map((value, index) => (
                  <div key={`extra-${index}`} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <MapPin size={14} color="#10b981" />
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 10 }} />

          {/* History */}
          <div className="profile-card-interactive profile-card-enter">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>History</span>
              <button className="view-all-link" onClick={() => setPage("allHistory")} type="button">VIEW ALL</button>
            </div>
            {previewHistory.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, textAlign: "center", padding: "6px 0 2px" }}>No history</div>
            ) : previewHistory.map((item, i) => (
              <div key={i} onClick={() => handleHistoryItemClick(item)} className="history-row-interactive">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <HistoryIconBox type={item.icon} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{item.title}</div>
                    <div style={{ fontSize: 12, marginTop: 2, color: "var(--text-secondary)" }}>
                      {item.date}{item.kindLabel ? ` • ${item.kindLabel}` : ""} • #{item.id}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusBadge status={item.status} />
                  <ChevronRight size={14} color="var(--text-secondary)" />
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 10 }} />

          {/* My Trucks */}
          <div className="profile-card-interactive profile-card-enter">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>My Trucks</span>
              <button className="view-all-link" onClick={() => setPage("allTrucks")} type="button">VIEW ALL</button>
            </div>
            {truckItems.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, textAlign: "center", padding: "6px 0 2px" }}>No vehicles</div>
            ) : previewTrucks.map((truck, i) => (
              <div key={i} onClick={() => { setSelectedTruck(truck); setPage("truckDetail"); }} className="truck-row-interactive">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {truck.hasPhoto ? (
                    <img src={resolveMediaUrl(truck.img)} alt={truck.name} className="truck-img-hover" style={{ width: 52, height: 52, borderRadius: 13, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 13, background: "rgba(148,163,184,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Truck size={24} color="#94a3b8" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{truck.name}</div>
                    <div style={{ fontSize: 12, marginTop: 2, color: "var(--text-secondary)" }}>Capacity: {truck.capacity}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusBadge status={truck.status} />
                  <ChevronRight size={14} color="var(--text-secondary)" />
                </div>
              </div>
            ))}
            <button className="add-vehicle-btn" onClick={() => onNavigate?.("vehicle")} type="button">ADD VEHICLE</button>
          </div>

          <div style={{ height: 10 }} />

          {/* Settings / Logout */}
          <div className="profile-card-enter" style={{ background: "var(--bg-secondary)", borderRadius: 16, margin: "0 16px", overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
            {[
              { icon: <Settings size={18} />, label: "Settings", red: false, action: "profileSettings" },
              { icon: <LogOut size={18} />, label: "Logout", red: true, action: "logout" },
            ].map((item, i, arr) => (
              <div key={i}
                onClick={() => { if (item.action === "logout") handleLogout(); else onNavigate(item.action); }}
                className="settings-row-interactive"
                style={{ ...(i < arr.length - 1 ? { borderBottom: "1px solid var(--border-color)" } : {}) }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ color: item.red ? "#ef4444" : "var(--text-secondary)" }}>{item.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: item.red ? "#ef4444" : "var(--text-primary)", fontFamily: "inherit" }}>{item.label}</span>
                </div>
                <ChevronRight size={16} color={item.red ? "#ef4444" : "var(--text-secondary)"} className="settings-chevron" />
              </div>
            ))}
          </div>

          <div style={{ height: 96 }} />

          <div className="sh-bottom-nav">
            <button className={`sh-nav-item ${activeNav === "home" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("home")} type="button"><HomeIcon active={activeNav === "home"} /><span>HOME</span></button>
            <button className={`sh-nav-item ${activeNav === "shipments" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("shipments")} type="button"><TruckIcon active={activeNav === "shipments"} /><span>SHIPMENTS</span></button>
            <button className={`sh-nav-item ${activeNav === "routes" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("routes")} type="button"><RouteIcon active={activeNav === "routes"} /><span>ROUTES</span></button>
            <button className={`sh-nav-item ${activeNav === "profile" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("profile")} type="button"><ProfileIcon active={activeNav === "profile"} /><span>PROFILE</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}