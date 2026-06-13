import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, Pencil, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConfirmDialog from "./ConfirmDialog";
import { SUBSCRIPTION_PLANS } from "./subscriptionPlansData";
import {
  deleteSubscription,
  listSubscriptions,
  updateSubscription,
} from "./services/subscriptionService";
import {
  acceptSubscriptionRequest,
  listSubscriptionRequests,
  rejectSubscriptionRequest,
  refreshSubscription,
} from "./services/subscriptionRequestService";
import { toastError, toastSuccess } from "./services/toastService";
import "./AdminSubscriptions.css";

const FILTERS = ["all", "active", "inactive", "free", "individual", "business", "expiring", "expired"];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "priceAsc", label: "Price: Low to High" },
  { key: "priceDesc", label: "Price: High to Low" },
  { key: "restAsc", label: "Remaining Time: Shortest" },
  { key: "restDesc", label: "Remaining Time: Longest" },
];

const toTierKey = (tier) => String(tier || "").trim().toLowerCase();

const toPriceNumber = (planPrice) => {
  const digits = String(planPrice || "").replace(/[^0-9]/g, "");
  return Number.parseInt(digits || "0", 10);
};

const getRemainingDays = (endDate) => {
  if (!endDate) return Number.POSITIVE_INFINITY;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return Number.POSITIVE_INFINITY;
  const diffMs = end - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatDate = (value) => {
  if (!value) return "No end date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No end date";
  return date.toLocaleDateString();
};

const formatRemaining = (days) => {
  if (!Number.isFinite(days)) return "No limit";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Ends today";
  return `${days} day${days === 1 ? "" : "s"} left`;
};

const getAttachmentNameFromPath = (attachment) => {
  if (!attachment) return "File";

  try {
    const url = new URL(attachment, window.location.origin);
    const encodedName = url.searchParams.get("name");
    if (encodedName) return decodeURIComponent(encodedName);
  } catch {
    const queryIndex = attachment.indexOf("?");
    if (queryIndex >= 0) {
      const params = new URLSearchParams(attachment.slice(queryIndex + 1));
      const encodedName = params.get("name");
      if (encodedName) return decodeURIComponent(encodedName);
    }
  }

  return attachment.split("/").pop() || "File";
};

export default function AdminSubscriptions({ onBack, onNavigate }) {
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [refreshingId, setRefreshingId] = useState(null);
  const [processingReqId, setProcessingReqId] = useState(null);

  const pricesByTier = useMemo(() => {
    return SUBSCRIPTION_PLANS.reduce((acc, plan) => {
      acc[toTierKey(plan?.tier)] = toPriceNumber(plan?.price);
      return acc;
    }, {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listSubscriptions();
      setItems(data.subs || []);
    } catch (err) {
      setError(err?.message || "Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const data = await listSubscriptionRequests();
      setRequests(data.requests || []);
    } catch (err) {
      toastError(err?.message || "Failed to load requests.");
    } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadRequests();
  }, [loadData, loadRequests]);

  useEffect(() => {
    if (!error) return;
    toastError(error);
  }, [error]);

  const normalizedItems = useMemo(() => {
    return items.map((sub) => {
      const tierKey = toTierKey(sub?.tier);
      const remainingDays = getRemainingDays(sub?.endDate);
      return {
        ...sub,
        tierKey,
        price: Number(pricesByTier[tierKey] ?? 0),
        remainingDays,
      };
    });
  }, [items, pricesByTier]);

  const filteredItems = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    const filtered = normalizedItems.filter((sub) => {
      if (filter === "all") return true;
      if (filter === "active") return Boolean(sub?.isActive);
      if (filter === "inactive") return !Boolean(sub?.isActive);
      if (filter === "expiring") return Number.isFinite(sub.remainingDays) && sub.remainingDays >= 0 && sub.remainingDays <= 7;
      if (filter === "expired") return Number.isFinite(sub.remainingDays) && sub.remainingDays < 0;
      return toTierKey(sub?.tier) === filter;
    });

    const searched = filtered.filter((sub) => {
      if (!lowerSearch) return true;
      const userId = String(sub?.user_ID ?? "").toLowerCase();
      const subId = String(sub?.sub_ID ?? "").toLowerCase();
      const tier = String(sub?.tier ?? "").toLowerCase();
      return userId.includes(lowerSearch) || subId.includes(lowerSearch) || tier.includes(lowerSearch);
    });

    return searched.sort((a, b) => {
      if (sortBy === "oldest") return Number(a.sub_ID) - Number(b.sub_ID);
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "restAsc") return a.remainingDays - b.remainingDays;
      if (sortBy === "restDesc") return b.remainingDays - a.remainingDays;
      return Number(b.sub_ID) - Number(a.sub_ID);
    });
  }, [normalizedItems, filter, search, sortBy]);

  const summary = useMemo(() => {
    const total = normalizedItems.length;
    const active = normalizedItems.filter((sub) => Boolean(sub.isActive)).length;
    const expiringSoon = normalizedItems.filter(
      (sub) => Number.isFinite(sub.remainingDays) && sub.remainingDays >= 0 && sub.remainingDays <= 7
    ).length;

    return { total, active, expiringSoon };
  }, [normalizedItems]);

  const handleQuickTierUpdate = async (sub, newTier) => {
    if (!sub?.sub_ID) return;
    setBusyId(sub.sub_ID);
    setError("");

    try {
      const updated = await updateSubscription(sub.sub_ID, {
        tier: newTier,
        isActive: Boolean(sub.isActive),
        endDate: sub.endDate || null,
      });

      setItems((prev) => prev.map((item) => (item.sub_ID === sub.sub_ID ? updated : item)));
      toastSuccess("Subscription updated");
    } catch (err) {
      setError(err?.message || "Failed to update subscription.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget?.sub_ID) return;

    setBusyId(confirmTarget.sub_ID);
    setError("");

    try {
      await deleteSubscription(confirmTarget.sub_ID);
      setItems((prev) => prev.filter((item) => item.sub_ID !== confirmTarget.sub_ID));
      setConfirmTarget(null);
      toastSuccess("Subscription deleted");
    } catch (err) {
      setError(err?.message || "Failed to delete subscription.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="as-page">
      <div className="as-card">
        <header className="as-header">
          <button className="as-back" onClick={onBack} type="button">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>Subscriptions</h1>
            <p>Manage subscriptions with full visibility and admin controls.</p>
          </div>
          <ThemeToggle />
        </header>

        <div className="as-tabs">
          <button
            type="button"
            className={`as-tab ${activeTab === "subscriptions" ? "as-tab--active" : ""}`}
            onClick={() => setActiveTab("subscriptions")}
          >
            Subscriptions
          </button>
          <button
            type="button"
            className={`as-tab ${activeTab === "requests" ? "as-tab--active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Requests {requests.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="as-tab-badge">{requests.filter((r) => r.status === "PENDING").length}</span>
            )}
          </button>
        </div>

        {activeTab === "requests" ? (
          <>
            {reqLoading ? (
              <div className="as-loading">
                <Loader2 size={18} className="as-spin" />
                <span>Loading requests...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="as-empty">No subscription requests found.</div>
            ) : (
              <div className="as-list">
                {requests.map((req) => {
                  const userName = req.user?.individual?.full_Name || req.user?.business?.business_Name || "Unknown";
                  const isProcessing = processingReqId === req.request_ID;
                  return (
                    <article className="as-item" key={req.request_ID}>
                      <div className="as-main">
                        <div className="as-item-top">
                          <h3>Request #{req.request_ID}</h3>
                          <span className={`as-status ${req.status === "PENDING" ? "as-status-pending" : req.status === "ACCEPTED" ? "as-status-active" : "as-status-rejected"}`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="as-item-meta">
                          User #{req.user_ID} · <strong>{userName}</strong> · Tier <strong>{req.tier}</strong>
                        </p>
                        <div className="as-item-stats">
                          <span className="as-enddate">Requested: {formatDate(req.createdAt)}</span>
                          {req.reviewedAt && <span className="as-enddate">Reviewed: {formatDate(req.reviewedAt)}</span>}
                        </div>
                        {req.attachment && (
                          <div className="as-attachment-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                            <a
                              href={`${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`.replace(/\/api\/?$/, '') + req.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="as-attachment-link"
                            >
                              {getAttachmentNameFromPath(req.attachment)}
                            </a>
                          </div>
                        )}
                      </div>
                      {req.status === "PENDING" && (
                        <div className="as-actions">
                          <button
                            type="button"
                            className="as-btn as-btn-accept"
                            disabled={isProcessing}
                            onClick={async () => {
                              setProcessingReqId(req.request_ID);
                              try {
                                await acceptSubscriptionRequest(req.request_ID);
                                toastSuccess("Request accepted", { description: `Subscription created for user #${req.user_ID}.` });
                                loadRequests();
                                loadData();
                              } catch (err) {
                                toastError(err?.message || "Failed to accept request.");
                              } finally {
                                setProcessingReqId(null);
                              }
                            }}
                          >
                            <CheckCircle2 size={14} />
                            Accept
                          </button>
                          <button
                            type="button"
                            className="as-btn as-btn-delete"
                            disabled={isProcessing}
                            onClick={async () => {
                              setProcessingReqId(req.request_ID);
                              try {
                                await rejectSubscriptionRequest(req.request_ID);
                                toastSuccess("Request rejected");
                                loadRequests();
                              } catch (err) {
                                toastError(err?.message || "Failed to reject request.");
                              } finally {
                                setProcessingReqId(null);
                              }
                            }}
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
        <section className="as-summary">
          <article>
            <span>Total</span>
            <strong>{summary.total}</strong>
          </article>
          <article>
            <span>Active</span>
            <strong>{summary.active}</strong>
          </article>
          <article>
            <span>Expiring 7d</span>
            <strong>{summary.expiringSoon}</strong>
          </article>
        </section>

        <section className="as-toolbar">
          <label className="as-search-wrap">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user id, sub id, tier"
            />
          </label>

          <div className="as-selects">
            <label>
              <span>Sort</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div className="as-filters">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`as-filter ${filter === item ? "active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        {error ? <div className="as-error">{error}</div> : null}

        {loading ? (
          <div className="as-loading">
            <Loader2 size={18} className="as-spin" />
            <span>Loading subscriptions...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="as-empty">No subscriptions found.</div>
        ) : (
          <div className="as-list">
            {filteredItems.map((sub) => {
              const isBusy = busyId === sub.sub_ID;
              return (
                <article className="as-item" key={sub.sub_ID}>
                  <div className="as-main">
                    <div className="as-item-top">
                      <h3>Subscription #{sub.sub_ID}</h3>
                      <span className={`as-status ${sub.isActive ? "as-status-active" : "as-status-inactive"}`}>
                        {sub.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="as-item-meta">
                      User #{sub.user_ID} · Tier <strong>{sub.tier}</strong>
                    </p>

                    <div className="as-item-stats">
                      <span className="as-price">{sub.price} DA / MO</span>
                      <span className="as-rest">
                        <Clock3 size={13} /> {formatRemaining(sub.remainingDays)}
                      </span>
                      <span className="as-enddate">Ends: {formatDate(sub.endDate)}</span>
                    </div>
                  </div>

                  <div className="as-actions">
                    <button
                      type="button"
                      className="as-btn"
                      onClick={() => onNavigate?.("subscriptionDetails", { subscriptionId: sub.sub_ID, from: "adminSubscriptions" })}
                    >
                      View
                    </button>

                    <select
                      value={sub.tier}
                      onChange={(e) => handleQuickTierUpdate(sub, e.target.value)}
                      disabled={isBusy}
                    >
                      <option value="Free">Free</option>
                      <option value="Individual">Individual</option>
                      <option value="Business">Business</option>
                    </select>

                    <button
                      type="button"
                      className="as-btn as-btn-edit"
                      onClick={() => onNavigate?.("subscriptionDetails", { subscriptionId: sub.sub_ID, from: "adminSubscriptions" })}
                    >
                      <Pencil size={14} />
                      Update
                    </button>

                    <button
                      type="button"
                      className="as-btn"
                      disabled={refreshingId === sub.sub_ID}
                      onClick={async () => {
                        setRefreshingId(sub.sub_ID);
                        try {
                          await refreshSubscription(sub.sub_ID);
                          toastSuccess("Subscription refreshed", { description: `Subscription #${sub.sub_ID} dates and counters reset.` });
                          loadData();
                        } catch (err) {
                          toastError(err?.message || "Failed to refresh subscription.");
                        } finally {
                          setRefreshingId(null);
                        }
                      }}
                    >
                      <RefreshCw size={14} className={refreshingId === sub.sub_ID ? "as-spin" : ""} />
                      Refresh
                    </button>

                    <button
                      type="button"
                      className="as-btn as-btn-delete"
                      onClick={() => setConfirmTarget(sub)}
                      disabled={isBusy}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete Subscription"
        message={confirmTarget ? `Do you want to delete subscription #${confirmTarget.sub_ID}?` : ""}
        confirmLabel="Yes"
        cancelLabel="No"
        loading={busyId === confirmTarget?.sub_ID}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
