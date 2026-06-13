import { useEffect, useState } from "react";
import { ArrowLeft, Save, Package, MapPin, Calendar, Tag, AlertTriangle, CheckCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { getShipments, updateShipment } from "./services/shipmentService";
import { toastError, toastSuccess } from "./services/toastService";
import { formatTonsValue } from "./utils/weight";
import "./Createshipment.css";
import "./EditActiveShipment.css";

const categories = ["Electronics", "Furniture", "Apparel", "Food & Beverages", "Machinery", "Documents", "Other"];

const STATUS_META = {
  PENDING:    { color: "#f59e0b", bg: "#fff7ed", border: "#fde68a", label: "Pending" },
  MATCHED:    { color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc", label: "Matched" },
  PICKED_UP:  { color: "#92400e", bg: "#fef9c3", border: "#fde68a", label: "Picked Up" },
  IN_TRANSIT: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", label: "In Transit" },
  DELIVERED:  { color: "#00c46a", bg: "#e8faf2", border: "#b2f0d4", label: "Delivered" },
  CANCELLED:  { color: "#ef4444", bg: "#fff0f0", border: "#fecaca", label: "Cancelled" },
};

const PRIORITY_META = {
  Normal: { color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" },
  High:   { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Urgent: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export default function EditActiveShipmentPage({ shipmentId, onBack, onSaved }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    origin: "",
    destination: "",
    volume: "",
    weight: "",
    date: "",
    time: "",
    priority: "Normal",
    special_Information: "",
    status: "PENDING",
  });

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

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await getShipments();
        const found = list.find((it) => String(it?.shipment_ID || it?.id) === String(shipmentId));
        if (!found) { toastError("Shipment not found."); return; }
        setForm({
          title: found.title || "",
          category: found.category || "",
          origin: found.origin || "",
          destination: found.destination || "",
          volume: String(found.volume ?? ""),
          weight: formatTonsValue(found.weight) || "",
          date: found.date || "",
          time: found.time || "",
          priority: found.priority || "Normal",
          special_Information: found.special_Information || "",
          status: normalizeStatus(found.status),
        });
      } catch (err) {
        toastError(err?.message || "Failed to load shipment.");
      } finally {
        setLoading(false);
      }
    };
    if (shipmentId != null) load();
  }, [shipmentId]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const parsedVolume = Number(form.volume);
      const parsedWeightTons = Number(form.weight);
      if (!Number.isFinite(parsedVolume) || parsedVolume <= 0 || !Number.isFinite(parsedWeightTons) || parsedWeightTons <= 0) {
        toastError("Weight and volume must be positive numbers.");
        setSaving(false);
        return;
      }
      await updateShipment({ shipment_ID: Number(shipmentId), ...form, volume: parsedVolume, weight: parsedWeightTons });
      setSuccess(true);
      toastSuccess("Shipment updated", { description: "Shipment changes were saved successfully." });
      onSaved?.();
    } catch (err) {
      toastError(err?.message || "Failed to update shipment.");
    } finally {
      setSaving(false);
    }
  };

  const currentStatus = STATUS_META[form.status] || STATUS_META.PENDING;
  const currentPriority = PRIORITY_META[form.priority] || PRIORITY_META.Normal;

  return (
    <div className="cs-screen eas-screen">
      <div className={`cs-container eas-container ${mounted ? "cs-container--visible" : ""}`}>

        {/* ── Header ── */}
        <div className="cs-header eas-header">
          <button className="cs-back-btn" onClick={onBack} type="button" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="eas-header-center">
            <h2 className="cs-title">Update Shipment</h2>
            {!loading && form.title && (
              <span className="eas-header-subtitle">#{shipmentId} · {form.title}</span>
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="eas-loading">
            <div className="eas-loading-spinner" />
            <span>Loading shipment…</span>
          </div>
        )}

        {/* ── Form body (two-column on desktop) ── */}
        {!loading && (
          <div className="eas-body">

            {/* LEFT COLUMN */}
            <div className="eas-col eas-col--left">

              {/* Status + Priority pills row */}
              <div className="eas-pills-row">
                <span
                  className="eas-status-pill"
                  style={{ color: currentStatus.color, background: currentStatus.bg, border: `1px solid ${currentStatus.border}` }}
                >
                  {currentStatus.label}
                </span>
                <span
                  className="eas-priority-pill"
                  style={{ color: currentPriority.color, background: currentPriority.bg, border: `1px solid ${currentPriority.border}` }}
                >
                  {form.priority} Priority
                </span>
              </div>

              {/* SHIPMENT INFORMATION */}
              <div className="eas-section">
                <div className="cs-section-header">
                  <span className="cs-section-dot" />
                  <span className="cs-section-label">SHIPMENT INFORMATION</span>
                </div>

                <div className="cs-field">
                  <label className="cs-label">Shipment Title</label>
                  <input
                    className="cs-input"
                    placeholder="e.g. Computer Equipment"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>

                <div className="cs-field-row">
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">Category</label>
                    <div className="cs-select-wrap">
                      <select
                        className="cs-select"
                        value={form.category}
                        onChange={(e) => updateField("category", e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg className="cs-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">Priority</label>
                    <div className="cs-select-wrap">
                      <select
                        className="cs-select"
                        value={form.priority}
                        onChange={(e) => updateField("priority", e.target.value)}
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                      <svg className="cs-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="cs-field-row">
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">
                      Weight
                      <span className="cs-label-hint">TONS</span>
                    </label>
                    <div className="cs-input-suffix-wrap">
                      <input
                        className="cs-input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.weight}
                        onChange={(e) => updateField("weight", e.target.value)}
                      />
                      <span className="cs-suffix">t</span>
                    </div>
                  </div>
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">
                      Volume
                      <span className="cs-label-hint">M³</span>
                    </label>
                    <div className="cs-input-suffix-wrap">
                      <input
                        className="cs-input"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                        value={form.volume}
                        onChange={(e) => updateField("volume", e.target.value)}
                      />
                      <span className="cs-suffix">m³</span>
                    </div>
                  </div>
                </div>

                <div className="cs-field">
                  <label className="cs-label">Description / Special Information</label>
                  <textarea
                    className="cs-input cs-textarea"
                    placeholder="Fragile, temperature-sensitive, hazardous…"
                    value={form.special_Information}
                    onChange={(e) => updateField("special_Information", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="eas-col eas-col--right">

              {/* LOGISTICS & SCHEDULE */}
              <div className="eas-section">
                <div className="cs-section-header">
                  <span className="cs-section-dot" />
                  <span className="cs-section-label">LOGISTICS & SCHEDULE</span>
                </div>

                {/* Route visualizer */}
                <div className="eas-route-card">
                  <div className="eas-route-stop eas-route-stop--origin">
                    <MapPin size={13} />
                    <span>{form.origin || "Pickup Location"}</span>
                  </div>
                  <div className="eas-route-connector">
                    <div className="eas-route-line" />
                    <span className="eas-route-arrow">›</span>
                    <div className="eas-route-line" />
                  </div>
                  <div className="eas-route-stop eas-route-stop--dest">
                    <MapPin size={13} />
                    <span>{form.destination || "Delivery Location"}</span>
                  </div>
                </div>

                <div className="cs-field">
                  <label className="cs-label">Pickup Location</label>
                  <input
                    className="cs-input"
                    placeholder="City, region or address"
                    value={form.origin}
                    onChange={(e) => updateField("origin", e.target.value)}
                  />
                </div>

                <div className="cs-field">
                  <label className="cs-label">Delivery Location</label>
                  <input
                    className="cs-input"
                    placeholder="City, region or address"
                    value={form.destination}
                    onChange={(e) => updateField("destination", e.target.value)}
                  />
                </div>

                <div className="cs-field-row">
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">Date</label>
                    <input
                      className="cs-input"
                      type="date"
                      value={form.date?.slice(0, 10) || ""}
                      onChange={(e) => updateField("date", e.target.value)}
                    />
                  </div>
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">Time</label>
                    <input
                      className="cs-input"
                      type="time"
                      value={form.time || ""}
                      onChange={(e) => updateField("time", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* STATUS */}
              <div className="eas-section">
                <div className="cs-section-header">
                  <span className="cs-section-dot" />
                  <span className="cs-section-label">STATUS</span>
                </div>

                <div className="eas-status-grid">
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      className={`eas-status-chip ${form.status === key ? "eas-status-chip--active" : ""}`}
                      style={form.status === key
                        ? { color: meta.color, background: meta.bg, borderColor: meta.border }
                        : undefined}
                      onClick={() => updateField("status", key)}
                    >
                      {form.status === key && <CheckCircle size={12} />}
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Success message (desktop only) */}
              {success && (
                <div className="cs-feedback cs-feedback--success eas-success-inline">
                  <CheckCircle size={14} /> Shipment updated successfully!
                </div>
              )}

              {/* ── Desktop Save Button ── */}
              <button
                className="eas-save-btn"
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><div className="eas-btn-spinner" /> Saving…</>
                  : <><Save size={16} /> Save Changes</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Mobile Footer ── */}
        {!loading && (
          <div className="cs-footer eas-footer">
            {success && (
              <div className="cs-feedback cs-feedback--success">
                <CheckCircle size={14} /> Shipment updated successfully!
              </div>
            )}
            <button
              className="cs-submit-btn"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><div className="eas-btn-spinner eas-btn-spinner--white" /> Saving…</>
                : <><Save size={16} /> Save Changes</>
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}