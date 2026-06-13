import React, { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import "./AddVehicle.css";
import { addVehicle, updateVehicle } from "./services/vehicleService";
import { uploadPhoto } from "./services/uploadService";
import { toastError, toastSuccess } from "./services/toastService";

const VEHICLE_TYPES = [
  { vehicle: "Small Van", vehicleFr: "Camionnette", icon: "🚐" },
  { vehicle: "Fourgon", vehicleFr: "Fourgon", icon: "🚚" },
  { vehicle: "Closed Box Van", vehicleFr: "Fourgon Fermé", icon: "🚛" },
  { vehicle: "Refrigerated Truck", vehicleFr: "Frigo", icon: "❄️" },
  { vehicle: "Open-Slat Truck", vehicleFr: "Maraîcher", icon: "🌿" },
  { vehicle: "Dropside Truck", vehicleFr: "Camion à ridelles", icon: "🏗️" },
  { vehicle: "Semi-trailer", vehicleFr: "Semi-remorque", icon: "🚜" },
  { vehicle: "Tanker", vehicleFr: "Citerne", icon: "🛢️" },
  { vehicle: "Livestock Carrier", vehicleFr: "Camion à Bétail", icon: "🐄" },
  { vehicle: "Tow Truck", vehicleFr: "Dépanneuse", icon: "🔧" },
  { vehicle: "Flatbed Truck", vehicleFr: "Plateau", icon: "🛻" },
  { vehicle: "Tipper Truck", vehicleFr: "Benne", icon: "⛏️" },
  { vehicle: "Crane Truck", vehicleFr: "Camion Grue", icon: "🏗️" },
  { vehicle: "Concrete Mixer", vehicleFr: "Toupie / Malaxeur", icon: "🔄" },
  { vehicle: "Car Transporter", vehicleFr: "Porte-voiture", icon: "🚗" },
  { vehicle: "Motorcycle Courier", vehicleFr: "Coursier Moto", icon: "🏍️" },
  { vehicle: "Pickup Truck", vehicleFr: "Pick-up", icon: "🛻" },
  { vehicle: "Container Truck", vehicleFr: "Porte-conteneur", icon: "📦" },
  { vehicle: "Bulk Carrier", vehicleFr: "Vrac", icon: "⚙️" },
  { vehicle: "Medical Transport", vehicleFr: "Transport Médical", icon: "🏥" },
];

const ChipGrid = ({ options, selected, onSelect }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleOptions = showAll ? options : options.slice(0, 6);

  return (
    <div className="av-chip-grid">
      {visibleOptions.map((opt) => {
        const active = selected === opt.vehicle;
        return (
          <button
            key={opt.vehicle}
            type="button"
            className={`av-chip${active ? " av-chip--active" : ""}`}
            onClick={() => onSelect(active ? "" : opt.vehicle)}
          >
            <span className="av-chip-icon">{opt.icon}</span>
            <span className="av-chip-label">{opt.vehicle}</span>
            <span className="av-chip-sub">{opt.vehicleFr}</span>
            {active && (
              <span className="av-chip-check">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="var(--app-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
      {!showAll && options.length > 6 && (
        <button type="button" className="av-chip av-chip--see-all" onClick={() => setShowAll(true)}>
          <span className="av-chip-icon">➕</span>
          <span className="av-chip-label">See All</span>
          <span className="av-chip-sub">{options.length - 6} more</span>
        </button>
      )}
    </div>
  );
};

export default function AddVehicle({ onBack, onAdded, editVehicle }) {
  const isEdit = Boolean(editVehicle);

  const [form, setForm] = useState({
    type: editVehicle?.type || "",
    name: editVehicle?.vehicle_Name || editVehicle?.name || "",
    color: editVehicle?.color || "",
    year: editVehicle?.year ? String(editVehicle.year) : "",
    plateNumber: editVehicle?.plate_Number || editVehicle?.plate || "",
    capacity: editVehicle?.capacity ? String(editVehicle.capacity) : "",
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handlePhotosChange = (e) => {
    setPhotos(Array.from(e.target.files || []).slice(0, 5));
  };

  const handleSubmit = async () => {
    const isValid = form.type && form.name && form.color && form.year && form.plateNumber && form.capacity;
    if (!isValid) {
      toastError("Please fill in all required fields and select a vehicle type.");
      return;
    }

    const capacity = Number(form.capacity);
    const year = Number(form.year);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      toastError("Capacity must be a positive number.");
      return;
    }

    if (!Number.isFinite(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      toastError("Please enter a valid year.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toastError("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const photoData = photos[0] ? await uploadPhoto(photos[0]) : null;

      if (isEdit) {
        const payload = {
          plate_Number: form.plateNumber.trim(),
          type: form.type,
          vehicle_Name: form.name.trim(),
          color: form.color.trim(),
          year,
          capacity,
          photo: photoData,
        };
        const updatedVehicle = await updateVehicle(payload);
        setSuccess(true);
        toastSuccess("Vehicle updated", { description: "Your vehicle has been updated." });
        onAdded?.(updatedVehicle);
      } else {
        const payload = {
          type: form.type,
          vehicle_Name: form.name.trim(),
          color: form.color.trim(),
          year,
          plate_Number: form.plateNumber.trim(),
          capacity,
          photo: photoData,
        };
        const addedVehicle = await addVehicle(payload);
        setSuccess(true);
        toastSuccess("Vehicle added", { description: "Your vehicle is now available." });
        setForm({ type: "", name: "", color: "", year: "", plateNumber: "", capacity: "" });
        setPhotos([]);
        onAdded?.(addedVehicle);
      }
    } catch (err) {
      toastError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="av-screen">
      <div className={`av-container ${mounted ? "av-container--visible" : ""}`}>
        <div className="av-header">
          <button className="av-back-btn" onClick={onBack} type="button" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="av-title">{isEdit ? "Update Vehicle" : "Add Vehicle"}</h2>
          <ThemeToggle />
        </div>

        <div className="av-body">
          <div className="av-layout">
            <div className="av-left-col">
              <div className="av-section-header">
                <span className="av-section-dot" />
                <span className="av-section-label">VEHICLE INFORMATION</span>
              </div>

              <div className="av-field">
                <label className="av-label">
                  Vehicle Type
                  <span className="av-label-hint">Select one</span>
                </label>
                <ChipGrid
                  options={VEHICLE_TYPES}
                  selected={form.type}
                  onSelect={(val) => handleChange("type", val)}
                />
              </div>

              <div className="av-field">
                <label className="av-label">Vehicle Name</label>
                <input
                  className="av-input"
                  type="text"
                  placeholder="e.g. Mercedes Actros"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>

              <div className="av-field">
                <label className="av-label">Color</label>
                <input
                  className="av-input"
                  type="text"
                  placeholder="e.g. White"
                  value={form.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                />
              </div>

              <div className="av-field-row">
                <div className="av-field av-field--half">
                  <label className="av-label">Year</label>
                  <input
                    className="av-input"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="e.g. 2022"
                    value={form.year}
                    onChange={(e) => handleChange("year", e.target.value)}
                  />
                </div>
                <div className="av-field av-field--half">
                  <label className="av-label">Plate Number</label>
                  <input
                    className="av-input"
                    type="text"
                    placeholder="e.g. 12345-123-12"
                    value={form.plateNumber}
                    onChange={(e) => handleChange("plateNumber", e.target.value)}
                  />
                </div>
              </div>

              <div className="av-field">
                <label className="av-label">Capacity (tons)</label>
                <div className="av-input-suffix-wrap">
                  <input
                    className="av-input"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 12"
                    value={form.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                  />
                  <span className="av-suffix">T</span>
                </div>
              </div>

              <div className="av-field">
                <label className="av-label" htmlFor="av-photos">Upload Photos</label>
                <label className="av-upload-box" htmlFor="av-photos">
                  <span className="av-upload-main">Upload photos</span>
                </label>
                <input
                  id="av-photos"
                  className="av-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosChange}
                />
                {photos.length > 0 && (
                  <p className="av-upload-selected">{photos.length} photo(s) selected</p>
                )}
              </div>
            </div>

            <div className="av-right-col">
              <div className="av-summary-card">
                <h3 className="av-summary-title">Preview</h3>
                <div className="av-summary-row"><span>Type</span><strong>{form.type || "—"}</strong></div>
                <div className="av-summary-row"><span>Name</span><strong>{form.name || "—"}</strong></div>
                <div className="av-summary-row"><span>Plate</span><strong>{form.plateNumber || "—"}</strong></div>
                <div className="av-summary-row"><span>Capacity</span><strong>{form.capacity ? `${form.capacity}T` : "—"}</strong></div>
              </div>

              {success && (
                <div className="av-feedback av-feedback--success">
                  {isEdit ? "Vehicle updated successfully!" : "Vehicle added successfully!"}
                </div>
              )}

              <button className="av-submit-btn av-submit-btn--desktop" onClick={handleSubmit} disabled={loading}>
                {loading ? (isEdit ? "Updating…" : "Adding…") : (isEdit ? "Update Vehicle" : "Add Vehicle")}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="av-footer">
          {success && (
            <div className="av-feedback av-feedback--success">
              {isEdit ? "Vehicle updated successfully!" : "Vehicle added successfully!"}
            </div>
          )}
          <button className="av-submit-btn av-submit-btn--mobile" onClick={handleSubmit} disabled={loading}>
            {loading ? (isEdit ? "Updating…" : "Adding…") : (isEdit ? "Update Vehicle" : "Add Vehicle")}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
