import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConfirmDialog from "./ConfirmDialog";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider, useUser } from "./contexts/UserContext";
import {
  deleteSubscription,
  getMySubscription,
  getSubscriptionById,
  updateSubscription,
} from "./services/subscriptionService";
import { getMySubscriptionRequest } from "./services/subscriptionRequestService";
import { toastError, toastSuccess } from "./services/toastService";
import { SUBSCRIPTION_PLANS } from "./subscriptionPlansData";
import "./SubscriptionDetailsPage.css";

const TIERS = ["Free", "Individual", "Business"];

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

const buildProgressData = (startDateValue, endDateValue) => {
  const start = new Date(startDateValue);
  const end = new Date(endDateValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      elapsedPercent: 0,
      remainingPercent: 0,
      remainingLabel: "Timeline unavailable",
    };
  }

  const totalMs = Math.max(end.getTime() - start.getTime(), 0);
  if (totalMs === 0) {
    return {
      elapsedPercent: 100,
      remainingPercent: 0,
      remainingLabel: "Ended",
    };
  }

  const now = Date.now();
  const elapsedMs = Math.min(Math.max(now - start.getTime(), 0), totalMs);
  const remainingMs = Math.max(end.getTime() - now, 0);

  const elapsedPercent = Math.round((elapsedMs / totalMs) * 100);
  const remainingPercent = Math.max(100 - elapsedPercent, 0);
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  return {
    elapsedPercent,
    remainingPercent,
    remainingLabel: remainingMs <= 0 ? "Ended" : `${remainingDays} day${remainingDays === 1 ? "" : "s"} left`,
  };
};

function SubscriptionDetailsPageContent({ subId, isAdmin = false, onBack, onNavigate, hasUnreadNotifications = false }) {
  const { userData } = useUser();
  const userName = userData.name || "User";
  const userRole = userData.role || "USER";
  const userPhoto = userData.photo || "";

  const [mounted, setMounted] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [tier, setTier] = useState("Free");
  const [isActive, setIsActive] = useState(true);
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const resolvedTitle = useMemo(
    () => (isAdmin ? "Subscription Details (Admin)" : "My Subscription Details"),
    [isAdmin]
  );

  const progressData = useMemo(
    () => buildProgressData(subscription?.startDate, subscription?.endDate),
    [subscription?.startDate, subscription?.endDate]
  );

  const currentPlanLimits = useMemo(() => {
    const currentTier = String(subscription?.tier || "").toLowerCase();
    const matchedPlan = SUBSCRIPTION_PLANS.find(
      (plan) => String(plan.tier || "").toLowerCase() === currentTier
    );
    return matchedPlan?.limits || null;
  }, [subscription?.tier]);

  const currentPlanFeatures = useMemo(() => {
    const currentTier = String(subscription?.tier || "").toLowerCase();
    const matchedPlan = SUBSCRIPTION_PLANS.find(
      (plan) => String(plan.tier || "").toLowerCase() === currentTier
    );
    return Array.isArray(matchedPlan?.features) ? matchedPlan.features : [];
  }, [subscription?.tier]);

  const [usageCounts, setUsageCounts] = useState({ shipments: 0, routes: 0, vehicles: 0 });

  useEffect(() => {
    if (!subscription || isAdmin) return;
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [shipRes, routeRes, vehRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/shipments/mine`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/routes/mine`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/profile/vehicles`, { headers }),
        ]);
        const shipData = await shipRes.json().catch(() => ({}));
        const routeData = await routeRes.json().catch(() => ({}));
        const vehData = await vehRes.json().catch(() => ({}));
        setUsageCounts({
          shipments: Array.isArray(shipData.shipments) ? shipData.shipments.length : shipData.total ?? 0,
          routes: Array.isArray(routeData.routes) ? routeData.routes.length : routeData.total ?? 0,
          vehicles: Array.isArray(vehData.vehicles) ? vehData.vehicles.length : vehData.total ?? 0,
        });
      } catch {
        // silently ignore — limits will just show plan max
      }
    };
    fetchUsage();
  }, [subscription, isAdmin]);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = subId ? await getSubscriptionById(subId) : await getMySubscription();
      const sub = data || null;
      setSubscription(sub);
      setTier(String(sub?.tier || "Free"));
      setIsActive(Boolean(sub?.isActive));
      setEndDate(toDateInputValue(sub?.endDate));

      // If no subscription and not admin, check for pending request
      if (!sub && !isAdmin && !subId) {
        try {
          const req = await getMySubscriptionRequest();
          setPendingRequest(req || null);
        } catch {
          setPendingRequest(null);
        }
      }
    } catch (err) {
      setError(err?.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, [subId, isAdmin]);

  useEffect(() => {
    loadDetails();
  }, [subId, loadDetails]);

  useEffect(() => {
    if (!error) return;
    toastError(error);
  }, [error]);

  useEffect(() => {
    if (!successMessage) return;
    toastSuccess(successMessage);
  }, [successMessage]);

  const handleUpdate = async () => {
    if (!isAdmin) return;
    if (!subscription?.sub_ID) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const updated = await updateSubscription(subscription.sub_ID, {
        tier,
        isActive,
        endDate: toIsoOrNull(endDate),
      });

      setSubscription(updated);
      setSuccessMessage("Subscription updated successfully.");
    } catch (err) {
      setError(err?.message || "Failed to update subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!subscription?.sub_ID) return;

    setDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      await deleteSubscription(subscription.sub_ID);
      setSuccessMessage("Subscription deleted successfully.");
      if (isAdmin) {
        onNavigate?.("adminSubscriptions");
      } else {
        onNavigate?.("subscription");
      }
    } catch (err) {
      setError(err?.message || "Failed to delete subscription.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSidebarNav = (tab) => {
    if (tab === "home") onNavigate?.("dashboard");
    else if (tab === "shipments") onNavigate?.("shipments");
    else if (tab === "routes") onNavigate?.("routes");
    else if (tab === "profile") onNavigate?.("profile");
    else onNavigate?.(tab);
  };

  const pageBody = (
    <div className="subd-body">
          {loading ? (
            <div className="subd-id-row">
              <h1 className="subd-id">Loading subscription...</h1>
            </div>
          ) : error ? (
            <div className="subd-id-row">
              <h1 className="subd-id">{error}</h1>
            </div>
          ) : !subscription && pendingRequest?.status === 'PENDING' ? (
            <div className="subd-pending-card">
              <div className="subd-pending-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="subd-pending-title">Request In Processing</h2>
              <p className="subd-pending-text">
                Your <strong>{pendingRequest.tier}</strong> subscription request is still being reviewed by the admin.
                You will be notified once it is approved or rejected.
              </p>
              <p className="subd-pending-date">
                Requested on {formatDate(pendingRequest.createdAt)}
              </p>
            </div>
          ) : !subscription && pendingRequest?.status === 'REJECTED' ? (
            <div className="subd-pending-card">
              <div className="subd-pending-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                  <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="subd-pending-title" style={{ color: "#ef4444" }}>Request Rejected</h2>
              <p className="subd-pending-text">
                Your <strong>{pendingRequest.tier}</strong> subscription request was rejected by the admin.
                You can submit a new request from the subscription plans page.
              </p>
            </div>
          ) : !subscription ? (
            <div className="subd-id-row">
              <h1 className="subd-id">No subscription found.</h1>
            </div>
          ) : (
            <>
              <div className="subd-id-row">
                <div>
                  <h1 className="subd-id">#SUB-{subscription.sub_ID}</h1>
                  <p className="subd-type">Plan: {subscription.tier}</p>
                </div>
                <span className="subd-status-badge">
                  {subscription.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="subd-desktop-split">
                <div className="subd-desktop-split-col">
                  <div className="subd-info-row">
                    <div className="subd-info-card">
                      <span className="subd-info-label">USER</span>
                      <span className="subd-info-val">
                        {subscription.user?.individual?.full_Name || subscription.user?.business?.business_Name
                          ? <>{subscription.user.individual?.full_Name || subscription.user.business?.business_Name} <small style={{ color: "var(--text-secondary)", fontSize: 11 }}>(ID: {subscription.user_ID})</small></>
                          : `ID: ${subscription.user_ID}`}
                      </span>
                    </div>
                    <div className="subd-info-card">
                      <span className="subd-info-label">TIER</span>
                      <span className="subd-info-val">{subscription.tier}</span>
                    </div>
                  </div>

                  <div className="subd-features-card">
                    <h3 className="subd-features-title">Plan Features</h3>
                    {currentPlanFeatures.length === 0 ? (
                      <p className="subd-features-empty">No features available for this tier.</p>
                    ) : (
                      <ul className="subd-features-list">
                        {currentPlanFeatures.map((feature) => (
                          <li key={feature} className="subd-feature-item">
                            <span className="subd-feature-check">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {currentPlanLimits && (
                    <div className="subd-features-card">
                      <h3 className="subd-features-title">Usage Limits</h3>
                      <div className="subd-limits-grid">
                        {[
                          { label: "Shipments", used: isAdmin ? (subscription.shipmentsThisMonth ?? 0) : usageCounts.shipments, max: currentPlanLimits.maxShipments },
                          { label: "Routes", used: isAdmin ? (subscription.routesThisMonth ?? 0) : usageCounts.routes, max: currentPlanLimits.maxRoutes },
                          { label: "Contacts", used: isAdmin ? (subscription.contactsCount ?? 0) : usageCounts.vehicles, max: isAdmin ? (String(subscription.tier).toUpperCase() === "FREE" ? 2 : String(subscription.tier).toUpperCase() === "INDIVIDUAL" ? 15 : Infinity) : currentPlanLimits.maxVehicles },
                        ].map(({ label, used, max }) => {
                          const isUnlimited = max === Infinity;
                          const remaining = isUnlimited ? null : Math.max(max - used, 0);
                          const percent = isUnlimited ? null : Math.min(Math.round((used / max) * 100), 100);
                          return (
                            <div key={label} className="subd-limit-item">
                              <div className="subd-limit-header">
                                <span className="subd-limit-label">{label}</span>
                                <span className="subd-limit-count">
                                  {used}{isUnlimited ? " / ∞" : ` / ${max}`}
                                </span>
                              </div>
                              {!isUnlimited && (
                                <div className="subd-limit-track">
                                  <div className="subd-limit-fill" style={{ width: `${percent}%`, background: percent >= 90 ? "#ef4444" : percent >= 70 ? "#f59e0b" : "var(--app-green)" }} />
                                </div>
                              )}
                              {!isUnlimited && (
                                <span className="subd-limit-remaining" style={{ color: remaining === 0 ? "#ef4444" : "var(--text-secondary)" }}>
                                  {remaining} remaining
                                </span>
                              )}
                              {isUnlimited && (
                                <span className="subd-limit-remaining">Unlimited</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="subd-desktop-split-col">
                  <div className="subd-progress-card">
                    <div className="subd-progress-dates">
                      <div>
                        <span className="subd-progress-label">START DATE</span>
                        <span className="subd-progress-date">{formatDate(subscription.startDate)}</span>
                      </div>
                      <div className="subd-progress-right">
                        <span className="subd-progress-label">END DATE</span>
                        <span className="subd-progress-date">{formatDate(subscription.endDate)}</span>
                      </div>
                    </div>

                    <div className="subd-progress-track" aria-label="subscription timeline progress">
                      <div
                        className="subd-progress-elapsed"
                        style={{ width: `${progressData.elapsedPercent}%` }}
                      />
                      <div
                        className="subd-progress-remaining"
                        style={{ width: `${progressData.remainingPercent}%` }}
                      />
                    </div>

                    <p className="subd-progress-meta">{progressData.remainingLabel}</p>
                  </div>

                  {isAdmin && (
                    <div className="subd-edit-card">
                      <h3 className="subd-edit-title">Admin Controls</h3>
                      <div className="subd-edit-grid">
                        <label>
                          <span>Tier</span>
                          <select value={tier} onChange={(e) => setTier(e.target.value)}>
                            {TIERS.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span>Status</span>
                          <select
                            value={isActive ? "active" : "inactive"}
                            onChange={(e) => setIsActive(e.target.value === "active")}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>

                        <label className="subd-edit-full">
                          <span>End Date</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {successMessage ? <div className="subd-success">{successMessage}</div> : null}

                  <div className="subd-actions">
                    {isAdmin && (
                      <button
                        type="button"
                        className="subd-btn subd-btn-primary"
                        onClick={handleUpdate}
                        disabled={saving || deleting}
                      >
                        {saving ? "Saving..." : "Update Subscription"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="subd-btn subd-btn-danger"
                      onClick={() => setConfirmDeleteOpen(true)}
                      disabled={saving || deleting}
                    >
                      {deleting ? (
                        "Deleting..."
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Delete Subscription
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
  );

  return (
    <>
      {/* ── Mobile Layout ── */}
      <div className="subd-screen subd-show-mobile">
        <div className={`subd-container ${mounted ? "subd-container--visible" : ""}`}>
          <div className="subd-header">
            <button className="subd-back-btn" onClick={onBack} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h2 className="subd-title">{resolvedTitle}</h2>
            <ThemeToggle />
          </div>
          {pageBody}
        </div>
      </div>

      {/* ── Desktop Layout ── */}
      <div className="subd-desktop-layout subd-show-desktop">
        <Sidebar activeNav="subscription" onNavigate={handleSidebarNav} userRole={userRole} />
        <div className="subd-desktop-main">
          <Header userName={userName} userRole={userRole} userPhoto={userPhoto} hasUnreadNotifications={hasUnreadNotifications} onNavigate={onNavigate} />
          <div className="subd-desktop-content">
            <div className="subd-desktop-content-inner">
              <div className="subd-desktop-page-header">
                <button className="subd-desktop-back" onClick={onBack} type="button"><ArrowLeft size={18} /></button>
                <h2 className="subd-desktop-page-title">{resolvedTitle}</h2>
              </div>
              {pageBody}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription?"
        confirmLabel="Yes"
        cancelLabel="No"
        loading={deleting}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          await handleDelete();
          setConfirmDeleteOpen(false);
        }}
      />
    </>
  );
}

export default function SubscriptionDetailsPage(props) {
  return (
    <UserProvider>
      <SubscriptionDetailsPageContent {...props} />
    </UserProvider>
  );
}
