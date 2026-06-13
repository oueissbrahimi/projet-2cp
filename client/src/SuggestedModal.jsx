import { useState, useEffect, useRef } from "react";
import { X, Users, Package, MapPin, Search, MessageCircle } from "lucide-react";
import "./SuggestedModal.css";
import API_URL from "./services/http";
import { addContact } from "./services/chatService";
import { toastError, toastSuccess } from "./services/toastService";
import { formatTons } from "./utils/weight";
const statusColors = {
  PENDING:     { bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
  MATCHED:     { bg: "#ecfeff", color: "#0e7490", dot: "#06b6d4" },
  PICKED_UP:   { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  IN_TRANSIT:  { bg: "#eff6ff", color: "#1d4ed8", dot: "var(--app-green)" },
  DELIVERED:   { bg: "#f0fdf4", color: "#166534", dot: "var(--app-green)" },
  CANCELLED:   { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
};

export default function SuggestedModal({ open, onClose, origin, destination, waypoints, postType, onNavigate }) {
  const [query, setQuery]         = useState("");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef(null);

  const normalizeStatus = (value) => {
    const raw = String(value || "").toLowerCase().trim();
    if (!raw) return "PENDING";
    if (raw.includes("pending")) return "PENDING";
    if (raw.includes("matched") || raw.includes("accept")) return "MATCHED";
    if (raw.includes("picked")) return "PICKED_UP";
    if (raw.includes("transit") || raw.includes("delivery")) return "IN_TRANSIT";
    if (raw.includes("deliver") || raw.includes("complete") || raw.includes("done")) return "DELIVERED";
    if (raw.includes("cancel")) return "CANCELLED";
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
  };

  const normalizeShipments = (payload) => {
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.suggestions)
      ? payload.suggestions
      : [];

    return list.map((item, index) => {
      const originValue = item.origin ?? item.Origin ?? "";
      const destinationValue = item.destination ?? item.Destination ?? "";
      const labelValue = item.label ?? item.title ?? item.name ?? "Shipment";
      const codeValue = item.code ?? item.shipment_ID ?? item.shipmentId ?? item.id ?? index + 1;
      return {
        id: item.id ?? item.shipment_ID ?? item.shipmentId ?? index,
        label: String(labelValue),
        code: String(codeValue),
        origin: String(originValue),
        destination: String(destinationValue),
        weight: item.weight ?? item.volume ?? null,
        date: item.date ?? item.createdAt ?? item.created_at ?? null,
        status: normalizeStatus(item.status),
        ownerId: item.user_ID ?? item.user?.id ?? item.userId ?? null,
      };
    });
  };

  const bothFilled =
    postType === "originDestination" &&
    origin?.trim() &&
    destination?.trim();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setError("");

    if (!bothFilled) {
      setShipments([]);
      return;
    }

    const fetchShipments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
          origin: origin.trim(),
          destination: destination.trim(),
          waypoints: JSON.stringify(waypoints || []),
        });
        const res = await fetch(`${API_URL}/match/shipments?${params.toString()}`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to load suggestions");
        const data = await res.json();
        setShipments(normalizeShipments(data));
      } catch (err) {
        setError(err.message || "Something went wrong");
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, origin, destination]);

  if (!open) return null;

  const filtered = shipments.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.label?.toLowerCase().includes(q) ||
      s.code?.toLowerCase().includes(q) ||
      s.origin?.toLowerCase().includes(q) ||
      s.destination?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="sm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sm-sheet">
        <div className="sm-handle" />

        <div className="sm-header">
          <div className="sm-header-left">
            <Users size={18} className="sm-header-icon" />
            <span className="sm-header-title">Suggested Shipments</span>
          </div>
          <button className="sm-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {bothFilled && (
          <div className="sm-route-pill">
            <MapPin size={12} />
            <span>{origin}</span>
            <span className="sm-tag-arrow">→</span>
            <MapPin size={12} />
            <span>{destination}</span>
          </div>
        )}

        {!bothFilled && (
          <div className="sm-warning">
            Please select both an origin and a destination first to see suggested shipments.
          </div>
        )}

        {bothFilled && (
          <>
            <div className="sm-search-row">
              <Search size={15} className="sm-search-icon" />
              <input
                ref={inputRef}
                className="sm-search"
                placeholder="Search shipments, codes, cities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button className="sm-search-clear" onClick={() => setQuery("")}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="sm-list">
              {loading && <div className="sm-empty">Loading...</div>}

              {!loading && error && (
                <div className="sm-empty sm-empty--error">{error}</div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="sm-empty">No shipments found</div>
              )}

              {!loading && !error && filtered.map((s) => {
                const sc = statusColors[s.status] ?? statusColors.PENDING;
                const handleContact = async () => {
                  if (!s.ownerId) {
                    toastError("Cannot contact this user");
                    return;
                  }
                  try {
                    await addContact(s.ownerId);
                    toastSuccess("Contact added");
                    onClose();
                    onNavigate?.("chat", { userId: s.ownerId });
                  } catch (err) {
                    toastError(err?.message || "Failed to add contact");
                  }
                };
                const weightNumber = Number(s.weight);
                const weightLabel = Number.isFinite(weightNumber) ? formatTons(weightNumber) : s.weight;
                return (
                  <div key={s.id} className="sm-item">
                    <div className="sm-shipment-icon">
                      <Package size={18} />
                    </div>
                    <div className="sm-item-body">
                      <div className="sm-shipment-top">
                        <span className="sm-item-name">{s.label}</span>
                        <span className="sm-shipment-code">{s.code}</span>
                      </div>
                      <div className="sm-item-tags">
                        <span className="sm-tag"><MapPin size={11} />{s.origin}</span>
                        <span className="sm-tag-arrow">→</span>
                        <span className="sm-tag"><MapPin size={11} />{s.destination}</span>
                      </div>
                      <div className="sm-item-tags" style={{ marginTop: 2 }}>
                        {weightLabel ? <span className="sm-tag"><Package size={11} />{weightLabel}</span> : null}
                        {s.date   && <span className="sm-tag">{s.date}</span>}
                        <span className="sm-badge" style={{ background: sc.bg, color: sc.color }}>
                          <span className="sm-badge-dot" style={{ background: sc.dot }} />
                          {s.status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase())}
                        </span>
                      </div>
                      <div className="sm-item-actions">
                        <button className="sm-action-link" type="button" onClick={() => onNavigate?.("shipmentDetails", { shipmentId: s.id })}>
                          <Package size={13} /> View Details
                        </button>
                        {s.ownerId && (
                          <button className="sm-action-link" type="button" onClick={() => onNavigate?.("publicProfile", { userId: s.ownerId, from: "createRoute" })}>
                            <Users size={13} /> View Profile
                          </button>
                        )}
                        <button className="sm-contact-btn" type="button" onClick={handleContact}>
                          <MessageCircle size={13} /> Contact
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}