import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import {
  ArrowLeft,
  ChevronDown,
  MapPin,
  Navigation,
  Send,
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Search,
  X,
  Users,
} from "lucide-react";
import { createRoute } from "./services/routeService";
import { getVehicles } from "./services/profileService";
import { toastError, toastSuccess } from "./services/toastService";
import { useUser, UserProvider } from "./contexts/UserContext";
import SuggestedModal from "./SuggestedModal";
import "./Createroute.css";
import "./components/Sidebar.css";
import { ALGERIAN_CITIES as algerianCities } from "./constants/algerianCities";

const CityAutocomplete = ({ value, onChange, placeholder, icon: Icon, iconColor = "gray" }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    if (newValue.length > 0) {
      const filtered = algerianCities.filter((city) =>
        city.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    onChange({ target: { value: newValue } });
  };

  const handleSelectCity = (city) => {
    setInputValue(city);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ target: { value: city } });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectCity(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="city-autocomplete" ref={wrapperRef}>
      <div className="city-input-box">
        {Icon && <Icon size={15} className={`city-loc-icon ${iconColor}`} />}
        <input
          ref={inputRef}
          type="text"
          className="city-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            className="city-clear-btn"
            onClick={() => {
              setInputValue("");
              setSuggestions([]);
              setShowSuggestions(false);
              onChange({ target: { value: "" } });
              inputRef.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="city-suggestions">
          {suggestions.map((city, index) => (
            <li
              key={city}
              className={`city-suggestion-item ${index === selectedIndex ? "selected" : ""}`}
              onClick={() => handleSelectCity(city)}
            >
              <Search size={12} className="city-suggestion-icon" />
              <span>{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CreateRouteContent = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [suggestedOpen, setSuggestedOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("routes");
  const [form, setForm] = useState({
    routeName: "",
    vehicle: "",
    postType: "originDestination",
    region: "",
    startLocation: "",
    endLocation: "",
    waypoints: [],
    dateMode: "day",
    dayDate: "",
    intervalStart: "",
    intervalEnd: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      setVehiclesLoading(true);
      try {
        const data = await getVehicles();
        const list = Array.isArray(data?.vehicles) ? data.vehicles : [];
        if (!isMounted) return;
        setVehicles(
          list.map((vehicle, index) => ({
            value: vehicle?.plate_Number || vehicle?.plate || vehicle?.id || String(index + 1),
            label: vehicle?.vehicle_Name || vehicle?.model || vehicle?.name || `Vehicle ${index + 1}`,
          }))
        );
      } catch {
        if (!isMounted) return;
        setVehicles([]);
      } finally {
        if (isMounted) setVehiclesLoading(false);
      }
    };
    fetchVehicles();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addWaypoint = () => {
    setForm((prev) => ({ ...prev, waypoints: [...prev.waypoints, ""] }));
  };

  const updateWaypoint = (index, value) => {
    setForm((prev) => ({
      ...prev,
      waypoints: prev.waypoints.map((stop, i) => (i === index ? value : stop)),
    }));
  };

  const removeWaypoint = (index) => {
    setForm((prev) => ({
      ...prev,
      waypoints: prev.waypoints.filter((_, i) => i !== index),
    }));
  };

  const clearWaypoints = () => {
    setForm((prev) => ({ ...prev, waypoints: [] }));
  };

  const handleSidebarNav = (tab) => {
    if (tab === "home") onNavigate?.("dashboard");
    else if (tab === "shipments") onNavigate?.("shipments");
    else if (tab === "routes") { setActiveNav("routes"); }
    else if (tab === "profile") onNavigate?.("profile");
    else if (tab === "subscription") onNavigate?.("subscription");
    else if (tab === "profileSettings") onNavigate?.("profileSettings");
    else if (tab === "contact") onNavigate?.("contact");
    else if (tab === "chat") onNavigate?.("chat");
    else if (tab === "adminPanel") onNavigate?.("adminPanel");
    else onNavigate?.(tab);
  };

  const isValidCity = (city) => {
    if (!city || city.trim() === "") return false;
    return algerianCities.some(
      (validCity) => validCity.toLowerCase() === city.toLowerCase().trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.routeName || !form.vehicle) {
      toastError("Please fill in all required fields.");
      return;
    }
    if (form.postType === "originDestination" && (!form.startLocation || !form.endLocation)) {
      toastError("Please provide both origin and destination.");
      return;
    }
    if (form.postType === "region" && !form.region) {
      toastError("Please provide the region.");
      return;
    }
    if (form.postType === "originDestination") {
      if (!isValidCity(form.startLocation)) {
        toastError(`"${form.startLocation}" is not a valid Algerian city. Please choose from the list.`);
        return;
      }
      if (!isValidCity(form.endLocation)) {
        toastError(`"${form.endLocation}" is not a valid Algerian city. Please choose from the list.`);
        return;
      }
      for (let i = 0; i < form.waypoints.length; i++) {
        if (form.waypoints[i] && !isValidCity(form.waypoints[i])) {
          toastError(`"${form.waypoints[i]}" is not a valid Algerian city. Please choose from the list.`);
          return;
        }
      }
    }
    if (form.postType === "region" && !isValidCity(form.region)) {
      toastError(`"${form.region}" is not a valid Algerian region. Please choose from the list.`);
      return;
    }
    if (form.dateMode === "day" && !form.dayDate) {
      toastError("Please select a date.");
      return;
    }
    if (form.dateMode === "interval" && (!form.intervalStart || !form.intervalEnd)) {
      toastError("Please provide start and end dates.");
      return;
    }
    if (
      form.dateMode === "interval" &&
      form.intervalStart &&
      form.intervalEnd &&
      form.intervalStart > form.intervalEnd
    ) {
      toastError("Interval start date must be before end date.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toastError("Please login first.");
      return;
    }

    const vehiclePlate = String(form.vehicle || "").trim();
    if (!/^\d{5}-\d{3}-\d{2}$/.test(vehiclePlate)) {
      toastError("Please select a valid vehicle.");
      return;
    }

    const isRegion = form.postType === "region";
    const isInterval = form.dateMode === "interval";
    const normalizedWaypoints = (form.waypoints || []).map((stop) => stop.trim()).filter(Boolean);
    const origin = isRegion ? null : form.startLocation.trim();
    const destination = isRegion ? null : form.endLocation.trim();
    const region = isRegion ? form.region.trim() : null;
    const date = isInterval ? null : form.dayDate;

    try {
      setLoading(true);
      const payload = {
        name: form.routeName.trim(),
        origin,
        destination,
        waypoints: isRegion ? [] : normalizedWaypoints,
        region,
        date,
        post_type: form.postType === "region" ? "REGION" : "ORIGIN_DESTINATION",
        date_type: form.dateMode === "interval" ? "INTERVAL" : "DAY",
        interval_start: form.dateMode === "interval" ? form.intervalStart : null,
        interval_end: form.dateMode === "interval" ? form.intervalEnd : null,
        vehicle_plate: vehiclePlate,
        more_Information: form.description.trim() || null,
      };

      const data = await createRoute(payload);
      console.log("Success:", data);
      setSuccess(true);
      toastSuccess("Route created", { description: "Your route has been published successfully." });
      setForm({
        routeName: "", vehicle: "", postType: "originDestination", region: "",
        startLocation: "", endLocation: "", waypoints: [], dateMode: "day",
        dayDate: "", intervalStart: "", intervalEnd: "", description: "",
      });
      setTimeout(() => navigate("/routes"), 2000);
    } catch (err) {
      console.error(err);
      toastError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderWaypoints = (idSuffix = "") => (
    <div className="cr-field">
      <div className="cr-stops-header">
        <label className="cr-label cr-stops-title">WAYPOINTS &amp; STOPS</label>
        <button
          type="button"
          className="cr-stops-clear"
          onClick={clearWaypoints}
          disabled={form.waypoints.length === 0}
        >
          Clear All
        </button>
      </div>

      <div className="cr-stop-card cr-stop-card--start">
        <div className="cr-stop-drag" aria-hidden="true"><GripVertical size={16} /></div>
        <div className="cr-stop-main">
          <span className="cr-stop-tag cr-stop-tag--start">Start</span>
          <CityAutocomplete
            value={form.startLocation}
            onChange={handleChange("startLocation")}
            placeholder="Enter departure city"
            icon={Navigation}
            iconColor="green"
          />
        </div>
        <Navigation size={18} className="cr-stop-end-icon" />
      </div>

      {form.waypoints.map((stop, index) => (
        <div className="cr-stop-card" key={`waypoint-${idSuffix}-${index}`}>
          <div className="cr-stop-drag" aria-hidden="true"><GripVertical size={16} /></div>
          <div className="cr-stop-main">
            <span className="cr-stop-tag cr-stop-tag--waypoint">Stop {index + 1}</span>
            <CityAutocomplete
              value={stop}
              onChange={(e) => updateWaypoint(index, e.target.value)}
              placeholder="Enter a stop"
              icon={MapPin}
              iconColor="gray"
            />
          </div>
          <button
            type="button"
            className="cr-stop-remove"
            aria-label={`Remove stop ${index + 1}`}
            onClick={() => removeWaypoint(index)}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <div className="cr-stop-card cr-stop-card--destination">
        <div className="cr-stop-drag" aria-hidden="true"><GripVertical size={16} /></div>
        <div className="cr-stop-main">
          <span className="cr-stop-tag cr-stop-tag--destination">Destination</span>
          <CityAutocomplete
            value={form.endLocation}
            onChange={handleChange("endLocation")}
            placeholder="Enter destination city"
            icon={MapPin}
            iconColor="gray"
          />
        </div>
        <MapPin size={18} className="cr-stop-end-icon" />
      </div>

      <button type="button" className="cr-add-stop-btn" onClick={addWaypoint}>
        <Plus size={18} />
        Add Stop
      </button>
    </div>
  );

  const fastAccessEnabled = Boolean(form.startLocation && form.endLocation);

  return (
    <div className="cr-page">
      {/* ── Shared Sidebar ── */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={handleSidebarNav}
        userRole={userData.role || ""}
      />

      {/* ── Main Content ── */}
      <div className="cr-desktop-main">
        <div className="cr-card">
        <div className="cr-header">
          <button className="cr-back" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={20} />
          </button>
          <h2 className="cr-title">Create Route</h2>
          <div className="cr-header-right">
            <button
              type="button"
              className="cr-suggested-btn cr-suggested-btn--mobile-only"
              onClick={() => setSuggestedOpen(true)}
              aria-label="Suggested"
            >
              <Users size={15} />
              <span>Suggested</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="cr-form-wrapper">
          {/* ── Left Column ── */}
          <div className="cr-form-left">
            <div className="cr-section-label">
              <span className="cr-dot" />
              Route Information
            </div>

            <div className="cr-field">
              <label className="cr-label" htmlFor="routeName">Route Name</label>
              <input
                id="routeName"
                type="text"
                placeholder="e.g. Daily North Supply"
                value={form.routeName}
                onChange={handleChange("routeName")}
              />
            </div>

            <div className="cr-field">
              <label className="cr-label" htmlFor="vehicle">Vehicle</label>
              <div className="cr-select-wrapper">
                <select
                  id="vehicle"
                  value={form.vehicle}
                  onChange={handleChange("vehicle")}
                  disabled={vehiclesLoading || vehicles.length === 0}
                >
                  {vehiclesLoading ? (
                    <option value="">Loading vehicles...</option>
                  ) : vehicles.length === 0 ? (
                    <option value="">You don't have any vehicles, add one please</option>
                  ) : (
                    <>
                      <option value="" disabled>Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.value} value={vehicle.value}>
                          {vehicle.label}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <ChevronDown size={16} className="cr-select-arrow" />
              </div>
            </div>

            <div className="cr-field">
              <label className="cr-label" htmlFor="description">
                <FileText size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Description
              </label>
              <textarea
                id="description"
                className="cr-textarea"
                placeholder="Describe this route, special instructions, notes..."
                value={form.description}
                onChange={handleChange("description")}
                rows={3}
              />
            </div>

            <div className="cr-section-label">
              <span className="cr-dot" />
              Locations
            </div>

            <div className="cr-field">
              <label className="cr-label">Post Type</label>
              <div className="cr-segmented">
                <button
                  type="button"
                  className={`cr-segment-btn ${form.postType === "originDestination" ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, postType: "originDestination" }))}
                >
                  Origin / Destination
                </button>
                <button
                  type="button"
                  className={`cr-segment-btn ${form.postType === "region" ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, postType: "region" }))}
                >
                  Region
                </button>
              </div>
            </div>

            <div className="cr-field">
              <label className="cr-label">Date Type</label>
              <div className="cr-segmented">
                <button
                  type="button"
                  className={`cr-segment-btn ${form.dateMode === "day" ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, dateMode: "day" }))}
                >
                  Day
                </button>
                <button
                  type="button"
                  className={`cr-segment-btn ${form.dateMode === "interval" ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, dateMode: "interval" }))}
                >
                  Interval
                </button>
              </div>
            </div>

            {form.dateMode === "day" ? (
              <div className="cr-field">
                <label className="cr-label" htmlFor="dayDate">Date</label>
                <input
                  id="dayDate"
                  type="date"
                  value={form.dayDate}
                  onChange={handleChange("dayDate")}
                />
              </div>
            ) : (
              <div className="cr-field cr-date-grid">
                <div>
                  <label className="cr-label" htmlFor="intervalStart">Start Date</label>
                  <input
                    id="intervalStart"
                    type="date"
                    value={form.intervalStart}
                    onChange={handleChange("intervalStart")}
                  />
                </div>
                <div>
                  <label className="cr-label" htmlFor="intervalEnd">End Date</label>
                  <input
                    id="intervalEnd"
                    type="date"
                    value={form.intervalEnd}
                    onChange={handleChange("intervalEnd")}
                  />
                </div>
              </div>
            )}

            {form.postType === "region" && (
              <div className="cr-field cr-region-mobile-only">
                <label className="cr-label">REGION</label>
                <div className="cr-location-input-box">
                  <CityAutocomplete
                    value={form.region}
                    onChange={handleChange("region")}
                    placeholder="Enter region"
                    icon={MapPin}
                    iconColor="gray"
                  />
                </div>
              </div>
            )}

            {form.postType === "originDestination" && (
              <div className="cr-field cr-field--full-width-mobile cr-waypoints-mobile-only">
                {renderWaypoints("mobile")}
              </div>
            )}

            {success && <div className="cr-msg-success">Route posted! Redirecting...</div>}

            <button className="cr-submit-btn cr-submit-btn--mobile" type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post Route"}
              {!loading && <Send size={16} />}
            </button>
          </div>

          {/* ── Right Column (desktop only) ── */}
          {form.postType === "originDestination" && (
            <div className="cr-form-right">
              {renderWaypoints("desktop")}
              {success && <div className="cr-msg-success">Route posted! Redirecting...</div>}
              <button
                type="button"
                className={`cr-submit-btn cr-fast-access-btn ${fastAccessEnabled ? "" : "cr-fast-access-btn--disabled"}`}
                onClick={() => fastAccessEnabled && setSuggestedOpen(true)}
                disabled={!fastAccessEnabled}
              >
                <Users size={16} />
                Fast Access, View Suggestions Here
              </button>
              <button
                className="cr-submit-btn cr-submit-btn--desktop"
                type="submit"
                disabled={loading}
              >
                {loading ? "Posting..." : "Post Route"}
                {!loading && <Send size={16} />}
              </button>
            </div>
          )}

          {form.postType === "region" && (
            <div className="cr-form-right">
              <div className="cr-field cr-region-desktop-only">
                <label className="cr-label">REGION</label>
                <div className="cr-location-input-box">
                  <CityAutocomplete
                    value={form.region}
                    onChange={handleChange("region")}
                    placeholder="Enter region"
                    icon={MapPin}
                    iconColor="gray"
                  />
                </div>
              </div>
              <div className="cr-right-summary">
                <p className="cr-right-summary-title">Route Summary</p>
                <div className="cr-right-summary-row">
                  <span className="cr-right-summary-key">Name</span>
                  <span className="cr-right-summary-val">{form.routeName || "—"}</span>
                </div>
                <div className="cr-right-summary-row">
                  <span className="cr-right-summary-key">Region</span>
                  <span className="cr-right-summary-val">{form.region || "—"}</span>
                </div>
                <div className="cr-right-summary-row">
                  <span className="cr-right-summary-key">Date</span>
                  <span className="cr-right-summary-val">
                    {form.dateMode === "day"
                      ? (form.dayDate || "—")
                      : (form.intervalStart && form.intervalEnd ? `${form.intervalStart} → ${form.intervalEnd}` : "—")}
                  </span>
                </div>
              </div>
              {success && <div className="cr-msg-success">Route posted! Redirecting...</div>}
              <button
                type="button"
                className={`cr-submit-btn cr-fast-access-btn ${fastAccessEnabled ? "" : "cr-fast-access-btn--disabled"}`}
                onClick={() => fastAccessEnabled && setSuggestedOpen(true)}
                disabled={!fastAccessEnabled}
              >
                <Users size={16} />
                Fast Access, View Suggestions Here
              </button>
              <button
                className="cr-submit-btn cr-submit-btn--desktop"
                type="submit"
                disabled={loading}
              >
                {loading ? "Posting..." : "Post Route"}
                {!loading && <Send size={16} />}
              </button>
            </div>
          )}
        </form>
      </div>
      </div>

      <SuggestedModal
        open={suggestedOpen}
        onClose={() => setSuggestedOpen(false)}
        origin={form.startLocation}
        destination={form.endLocation}
        waypoints={form.waypoints}
        postType={form.postType}
        onNavigate={onNavigate}
      />
    </div>
  );
};

const CreateRoute = ({ onNavigate }) => {
  return (
    <UserProvider>
      <CreateRouteContent onNavigate={onNavigate} />
    </UserProvider>
  );
};

export default CreateRoute;