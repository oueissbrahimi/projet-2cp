import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConfirmDialog from "./ConfirmDialog";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider, useUser } from "./contexts/UserContext";
import { deleteRoute, getRouteById } from "./services/routeService";
import { toastError, toastSuccess } from "./services/toastService";
import { resolveMediaUrl } from "./utils/media";
import "./Shipmentdetails.css";
import "./ActiveManage.css";

const toTitle = (value) => {
  const raw = String(value || "").replace(/_/g, " ").trim();
  if (!raw) return "Unknown";
  return raw
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const toStatusKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const formatDateOnly = (value) => {
  if (!value) return "";
  const text = String(value);
  const [datePart] = text.split("T");
  return datePart || text;
};

function ActiveRouteDetailsPageContent({ routeId, onBack, onNavigate, source = "my", allowActions = true, hasUnreadNotifications = false }) {
  const { userData } = useUser();
  const userName = userData.name || "User";
  const userRole = userData.role || "USER";
  const userPhoto = userData.photo || "";

  const [mounted, setMounted] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
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
        const found = await getRouteById(routeId);
        setItem(found || null);
        if (!found) setError("Route not found.");
      } catch (err) {
        setError(err?.message || "Failed to load route details.");
      } finally {
        setLoading(false);
      }
    };

    if (routeId != null) load();
  }, [routeId]);

  const display = useMemo(() => {
    if (!item) return null;

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const ownerName =
      item?.user?.individual?.full_Name ||
      item?.user?.business?.business_Name ||
      storedUser?.full_Name ||
      storedUser?.business_Name ||
      storedUser?.name ||
      "Unknown user";

    return {
      id: item?.route_ID || item?.id,
      photo: typeof item?.photo === "string" ? item.photo.trim() : "",
      ownerId: item?.user?.id || null,
      ownerPhoto: item?.user?.profile_Photo || storedUser?.profile_Photo || "",
      status: toTitle(item?.status || "SCHEDULED"),
      statusRaw: item?.status || "SCHEDULED",
      routeType: toTitle(item?.post_type || "ORIGIN_DESTINATION"),
      dateType: toTitle(item?.date_type || "DAY"),
      name: item?.name || "Route",
      origin: item?.origin || "Origin not specified",
      destination: item?.destination || "Destination not specified",
      waypoints: Array.isArray(item?.waypoints)
        ? item.waypoints.map((stop) => String(stop || "").trim()).filter(Boolean)
        : [],
      region: item?.region || "Region not specified",
      date: formatDateOnly(item?.date) || "Date not specified",
      intervalStart: formatDateOnly(item?.interval_start) || "-",
      intervalEnd: formatDateOnly(item?.interval_end) || "-",
      plate: item?.vehicle?.plate_Number ?? item?.vehicle_plate ?? "N/A",
      vehicleName: item?.vehicle?.vehicle_Name || "Unknown vehicle",
      vehicleType: item?.vehicle?.type || "N/A",
      vehicleColor: item?.vehicle?.color || "N/A",
      vehicleYear: item?.vehicle?.year || "N/A",
      capacity: item?.vehicle?.capacity ?? null,
      createdAt: formatDateOnly(item?.createdAt) || "N/A",
      waypointCount: Array.isArray(item?.waypoints) ? item.waypoints.length : 0,
      ownerName,
      notes: String(item?.more_Information || "No additional notes").trim(),
    };
  }, [item]);

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    try {
      await deleteRoute(item.route_ID || item.id);
      toastSuccess("Route deleted");
      onNavigate?.("activeRoutes");
    } catch (err) {
      setError(err?.message || "Failed to delete route.");
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleSidebarNav = (tab) => {
    if (tab === "home") onNavigate?.("dashboard");
    else if (tab === "shipments") onNavigate?.("shipments");
    else if (tab === "routes") onNavigate?.("routes");
    else if (tab === "profile") onNavigate?.("profile");
    else onNavigate?.(tab);
  };

  /* shared detail content */
  const detailBody = (
    <div className="sd-body">
      {loading ? (
        <div className="sd-id-row">
          <h1 className="sd-id">Loading route...</h1>
        </div>
      ) : error ? (
        <div className="sd-id-row">
          <h1 className="sd-id">{error}</h1>
        </div>
      ) : (
        <>
          <div className="sd-id-row">
            <div>
              <h1 className="sd-id">#WES-R{display.id}</h1>
              <p className="sd-type">{display.name}</p>
            </div>
            <span className={`sd-status-badge sd-status-badge--${toStatusKey(display.statusRaw)}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {display.status.toUpperCase()}
            </span>
          </div>

          <div className="sd-desktop-split">
            <div className="sd-desktop-split-col">
              {display.photo ? (
                <div className="sd-map">
                  <div className="sd-map-bg">
                    <img
                      src={resolveMediaUrl(display.photo)}
                      alt={`Route ${display.id}`}
                      className="sd-cover-image"
                    />
                  </div>
                  <div className="sd-map-badge">
                    <span className="sd-map-label">ROUTE TYPE</span>
                    <span className="sd-map-loc">{display.routeType}</span>
                  </div>
                </div>
              ) : null}

              <div className="sd-info-row">
                <div className="sd-info-card">
                  <span className="sd-info-label">PATH</span>
                  <div className="sd-info-val-row">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="var(--app-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="sd-info-val">
                      {display.routeType === "Region" ? display.region : `${display.origin} to ${display.destination}`}
                    </span>
                  </div>
                </div>
                <div className="sd-info-card">
                  <span className="sd-info-label">VEHICLE</span>
                  <div className="sd-info-val-row">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="var(--app-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="5.5" cy="18.5" r="2.5" stroke="var(--app-green)" strokeWidth="2"/>
                      <circle cx="18.5" cy="18.5" r="2.5" stroke="var(--app-green)" strokeWidth="2"/>
                    </svg>
                    <span className="sd-info-val">{display.vehicleName} • {display.plate}</span>
                  </div>
                </div>
              </div>

              <div className="sd-sender-card">
                <div className="sd-sender-avatar">
                  {display.ownerPhoto ? (
                    <img
                      src={resolveMediaUrl(display.ownerPhoto)}
                      alt={display.ownerName}
                      className="sd-sender-avatar-img"
                    />
                  ) : (
                    <span className="sd-sender-avatar-fallback" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="sd-sender-info">
                  <span className="sd-sender-label">POST OWNER</span>
                  <span className="sd-sender-name">{display.ownerName}</span>
                </div>
                {display.ownerId ? (
                  <button
                    className="sd-msg-btn"
                    type="button"
                    aria-label="View owner profile"
                    onClick={() => onNavigate?.("publicProfile", { userId: display.ownerId, from: source === "all" ? "routeDetails" : "activeRouteDetails" })}
                  >
                    P
                  </button>
                ) : (
                  <button className="sd-msg-btn" type="button" aria-label="Route date type">
                    {display.dateType === "Interval" ? "I" : "D"}
                  </button>
                )}
              </div>

              <div className="sd-meta-section">
                <h3 className="sd-timeline-title">Route Specs</h3>
                <div className="sd-meta-grid">
                  <div className="sd-meta-card">
                    <span className="sd-meta-label">DATE MODE</span>
                    <span className="sd-meta-value">{display.dateType}</span>
                  </div>
                  <div className="sd-meta-card">
                    <span className="sd-meta-label">WAYPOINTS</span>
                    <span className="sd-meta-value">{display.waypointCount}</span>
                  </div>
                  <div className="sd-meta-card">
                    <span className="sd-meta-label">VEHICLE TYPE</span>
                    <span className="sd-meta-value">{display.vehicleType}</span>
                  </div>
                  <div className="sd-meta-card">
                    <span className="sd-meta-label">VEHICLE STYLE</span>
                    <span className="sd-meta-value">{display.vehicleColor} • {display.vehicleYear}</span>
                  </div>
                  <div className="sd-meta-card">
                    <span className="sd-meta-label">CAPACITY</span>
                    <span className="sd-meta-value">{display.capacity != null ? `${display.capacity} t` : "N/A"}</span>
                  </div>
                  <div className="sd-meta-card">
                    <span className="sd-meta-label">POSTED ON</span>
                    <span className="sd-meta-value">{display.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sd-desktop-split-col">
              <div className="sd-route">
                <div className="sd-route-item">
                  <div className="sd-route-dot sd-route-dot--active" />
                  <div className="sd-route-line" />
                  <div className="sd-route-content">
                    <span className="sd-route-label">START</span>
                    <span className="sd-route-place">{display.routeType === "Region" ? display.region : display.origin}</span>
                    <span className="sd-route-time">Date: {display.date}</span>
                  </div>
                </div>

                {display.routeType !== "Region"
                  ? display.waypoints.map((stop, index) => {
                      return (
                        <div className="sd-route-item" key={`waypoint-${index}`}>
                          <div className="sd-route-dot sd-route-dot--inactive" />
                          <div className="sd-route-line" />
                          <div className="sd-route-content">
                            <span className="sd-route-label">STOP {index + 1}</span>
                            <span className="sd-route-place">{stop}</span>
                            <span className="sd-route-time">Waypoint</span>
                          </div>
                        </div>
                      );
                    })
                  : null}

                <div className="sd-route-item">
                  <div className="sd-route-dot sd-route-dot--inactive" />
                  <div className="sd-route-content">
                    <span className="sd-route-label">END</span>
                    <span className="sd-route-place">{display.routeType === "Region" ? display.region : display.destination}</span>
                    <span className="sd-route-time">Interval: {display.intervalStart} to {display.intervalEnd}</span>
                  </div>
                </div>
              </div>

              <h3 className="sd-timeline-title">Route Information</h3>
              <div className="sd-timeline">
                <div className="sd-timeline-item">
                  <div className="sd-timeline-icon sd-timeline-icon--done">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="sd-timeline-content">
                    <span className="sd-timeline-label">Details</span>
                    <span className="sd-timeline-sub">{display.notes}</span>
                  </div>
                </div>
                <div className="sd-timeline-item">
                  <div className="sd-timeline-icon sd-timeline-icon--active">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="4" fill="white"/>
                      <path d="M12 8v4l3 3" stroke="var(--app-green)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="sd-timeline-content">
                    <span className="sd-timeline-label">Route Setup</span>
                    <span className="sd-timeline-sub">Capacity: {display.capacity != null ? `${display.capacity} t` : "N/A"} • Type: {display.dateType}</span>
                  </div>
                </div>
              </div>

              {allowActions ? (
                <div className="am-actions">
                  <button className="am-btn am-btn-edit" type="button" onClick={() => onNavigate("editActiveRoute", { activeRouteId: display.id, from: "activeRouteDetails" })}>
                    <Pencil size={13} /> Update
                  </button>
                  <button className="am-btn am-btn-delete" type="button" onClick={() => setConfirmDeleteOpen(true)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile Layout (unchanged) ── */}
      <div className="sd-screen sd-show-mobile">
        <div className={`sd-container ${mounted ? "sd-container--visible" : ""}`}>
          <div className="sd-header">
            <button className="sd-back-btn" onClick={onBack} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h2 className="sd-title">Route Details</h2>
            <ThemeToggle />
          </div>
          {detailBody}
        </div>
      </div>

      {/* ── Desktop Layout ── */}
      <div className="sd-desktop-layout sd-show-desktop">
        <Sidebar activeNav="routes" onNavigate={handleSidebarNav} userRole={userRole} />
        <div className="sd-desktop-main">
          <Header
            userName={userName}
            userRole={userRole}
            userPhoto={userPhoto}
            hasUnreadNotifications={hasUnreadNotifications}
            onNavigate={onNavigate}
          />
          <div className="sd-desktop-content">
            <div className="sd-desktop-content-inner">
              <div className="sd-desktop-page-header">
                <button className="sd-desktop-back" onClick={onBack} type="button">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="sd-desktop-page-title">Route Details</h2>
              </div>
              {detailBody}
            </div>
          </div>
        </div>
      </div>

      {allowActions ? (
        <ConfirmDialog
          open={confirmDeleteOpen}
          title="Delete Route"
          message={item ? `Delete route #${item.route_ID || item.id}?` : ""}
          confirmLabel="Yes"
          cancelLabel="No"
          loading={deleting}
          onCancel={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}

export default function ActiveRouteDetailsPage(props) {
  return (
    <UserProvider>
      <ActiveRouteDetailsPageContent {...props} />
    </UserProvider>
  );
}
