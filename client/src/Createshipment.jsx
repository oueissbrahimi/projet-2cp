import React, { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider, useUser } from "./contexts/UserContext";
import "./Createshipment.css";
import { createShipment } from "./services/shipmentService";
import { uploadPhoto } from "./services/uploadService";
import { toastError, toastSuccess } from "./services/toastService";
import { addContact } from "./services/chatService";
import { ALGERIAN_CITIES as algerianCities } from "./constants/algerianCities";

const CARGO_TYPES = [
  { product: "Small Parcels", vehicle: "Small Van", vehicleFr: "Camionnette", icon: "📦" },
  { product: "Furniture", vehicle: "Fourgon", vehicleFr: "Fourgon", icon: "🛋️" },
  { product: "Electronics / Fragile", vehicle: "Closed Box Van", vehicleFr: "Fourgon Fermé", icon: "📺" },
  { product: "Perishables / Food", vehicle: "Refrigerated Truck", vehicleFr: "Frigo", icon: "🧊" },
  { product: "Agricultural Products", vehicle: "Open-Slat Truck", vehicleFr: "Maraîcher", icon: "🌾" },
  { product: "Construction Materials", vehicle: "Dropside Truck", vehicleFr: "Camion à ridelles", icon: "🏗️" },
  { product: "Industrial / Bulk", vehicle: "Semi-trailer", vehicleFr: "Semi-remorque", icon: "🏭" },
  { product: "Liquids & Chemicals", vehicle: "Tanker", vehicleFr: "Citerne", icon: "🛢️" },
  { product: "Livestock", vehicle: "Livestock Carrier", vehicleFr: "Camion à Bétail", icon: "🐄" },
  { product: "Towing & Recovery", vehicle: "Tow Truck", vehicleFr: "Dépanneuse", icon: "🔧" },
];

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

const priorities = ["Normal", "High", "Urgent"];

const fetchSuggestions = async (origin, destination) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({ origin, destination });
  const res = await fetch(`http://localhost:4000/api/match/routes?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch suggestions (${res.status})`);
  const data = await res.json();
  if (data && !Array.isArray(data) && (data.availableTrucks || data.suggestedRoutes)) {
    return { availableTrucks: data.availableTrucks ?? [], suggestedRoutes: data.suggestedRoutes ?? [] };
  }
  return { availableTrucks: [], suggestedRoutes: [] };
};
const UserCard = ({ user, selected, onSelect, onViewProfile }) => {
  const isIndividual = !!user.individual;
  const displayName  = isIndividual
    ? (user.individual?.full_Name || "Unknown")
    : (user.business?.business_Name || "Unknown");
  const initials     = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const vehicleLabel = user.vehicles?.[0]?.type || "N/A";
  const cityLabel    = isIndividual
    ? (user.individual?.location || "—")
    : ((user.business?.locations && user.business.locations[0]) || "—");
  const isVerified   = user.isVerified ?? false;

  return (
    <div
      className={`sg-user-card${selected ? " sg-user-card--active" : ""}`}
      onClick={() => onSelect(user.id)}
    >
      <div className="sg-avatar">
        {initials}
        {isVerified && (
          <span className="sg-verified-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--app-green)">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        )}
      </div>
      <div className="sg-user-info">
        <div className="sg-user-name">{displayName}</div>
        <div className="sg-user-meta">
          <span className="sg-meta-chip">🚛 {vehicleLabel}</span>
          <span className="sg-meta-chip">📍 {cityLabel}</span>
        </div>
        <button
          type="button" className="sg-action-link"
          onClick={(e) => { e.stopPropagation(); onViewProfile?.(user.id); }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
          View Profile
        </button>
      </div>
      <div className={`sg-select-dot${selected ? " sg-select-dot--active" : ""}`}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

const RouteCard = ({ route, selected, onSelect, onViewDetails, onViewProfile }) => {
  const fromCity  = route.origin      || route.from || "—";
  const toCity    = route.destination || route.to   || "—";
  const stopCount = route.waypoints?.length ?? 0;
  const isPopular = route.popular ?? false;
  const ownerId   = route.user_ID ?? route.userId ?? route.ownerId ?? null;

  return (
    <div
      className={`sg-route-card${selected ? " sg-route-card--active" : ""}`}
      onClick={() => onSelect(route.id)}
    >
      {isPopular && <span className="sg-popular-badge">🔥 Popular</span>}
      <div className="sg-route-path">
        <div className="sg-route-city">
          <span className="sg-route-dot sg-route-dot--green" />
          <span>{fromCity}</span>
        </div>
        <div className="sg-route-line">
          <svg width="100%" height="2" viewBox="0 0 100 2" preserveAspectRatio="none">
            <line x1="0" y1="1" x2="100" y2="1" stroke="var(--app-green)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          {route.distance && <span className="sg-route-distance">{route.distance}</span>}
        </div>
        <div className="sg-route-city sg-route-city--right">
          <span className="sg-route-dot sg-route-dot--gray" />
          <span>{toCity}</span>
        </div>
      </div>
      <div className="sg-route-meta">
        {route.duration && <span className="sg-route-stat">⏱ {route.duration}</span>}
        {stopCount > 0  && <span className="sg-route-stat">📍 {stopCount} stops</span>}
        {route.price    && <span className="sg-route-price">{route.price}</span>}
      </div>
      <div className="sg-route-actions">
        <button type="button" className="sg-action-link" onClick={(e) => { e.stopPropagation(); onViewDetails?.(route.id); }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          View Details
        </button>
        {ownerId && (
          <button type="button" className="sg-action-link" onClick={(e) => { e.stopPropagation(); onViewProfile?.(ownerId); }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            View Profile
          </button>
        )}
      </div>
      <div className={`sg-select-dot${selected ? " sg-select-dot--active" : ""}`}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

const SuggestedSheet = ({ visible, onClose, onApply, trucks = [], routes = [], loading = false, onNavigate }) => {
  const [tab, setTab]                       = useState("users");
  const [selectedUsers, setSelectedUsers]   = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [userSearch, setUserSearch]         = useState("");
  const [routeSearch, setRouteSearch]       = useState("");
  const [animIn, setAnimIn]                 = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => setAnimIn(true), 10);
      setSelectedUsers([]);
      setSelectedRoutes([]);
      setUserSearch("");
      setRouteSearch("");
    } else {
      setAnimIn(false);
    }
  }, [visible]);

  if (!visible) return null;

  const toggleUser  = (id) => setSelectedUsers(p  => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleRoute = (id) => setSelectedRoutes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filteredUsers = trucks.filter(u => {
    const isInd   = !!u.individual;
    const name    = (isInd ? u.individual?.full_Name : u.business?.business_Name || "").toLowerCase();
    const vehicle = (u.vehicles?.[0]?.type || "").toLowerCase();
    const city    = (isInd ? u.individual?.location : (u.business?.locations?.[0] || "")).toLowerCase();
    const q       = userSearch.toLowerCase();
    return name.includes(q) || vehicle.includes(q) || city.includes(q);
  });

  const filteredRoutes = routes.filter(r => {
    const from = (r.origin || r.from || "").toLowerCase();
    const to   = (r.destination || r.to || "").toLowerCase();
    const q    = routeSearch.toLowerCase();
    return from.includes(q) || to.includes(q);
  });

  const totalSelected = selectedUsers.length + selectedRoutes.length;
  const handleClear   = () => { setSelectedUsers([]); setSelectedRoutes([]); };

  const handleViewProfile = (userId) => {
    onClose();
    onNavigate?.("publicProfile", { userId, from: "createShipment" });
  };

  const handleViewRouteDetails = (routeId) => {
    onClose();
    onNavigate?.("routeDetails", { routeId, from: "createShipment" });
  };

  const handleContact = async () => {
    if (selectedUsers.length === 0) {
      onApply?.({ users: selectedUsers, routes: selectedRoutes });
      onClose();
      return;
    }
    try {
      for (const userId of selectedUsers) {
        await addContact(userId);
      }
      toastSuccess(`${selectedUsers.length} contact(s) added`);
      onApply?.({ users: selectedUsers, routes: selectedRoutes });
      onClose();
      onNavigate?.("chat");
    } catch (err) {
      toastError(err?.message || "Failed to add contacts");
    }
  };

  return (
    <>
      <div className={`sg-backdrop${animIn ? " sg-backdrop--visible" : ""}`} onClick={onClose} />
      <div className={`sg-sheet${animIn ? " sg-sheet--visible" : ""}`}>

        {/* Handle */}
        <div className="sg-handle-wrap"><div className="sg-handle" /></div>

        {/* Header */}
        <div className="sg-sheet-header">
          <div className="sg-sheet-title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="var(--app-green)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" stroke="var(--app-green)" strokeWidth="2" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="var(--app-green)" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="var(--app-green)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="sg-sheet-title">Suggested</span>
            {totalSelected > 0 && <span className="sg-badge">{totalSelected}</span>}
          </div>
          <button className="sg-close-btn" onClick={onClose} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="sg-tabs">
          <button type="button" className={`sg-tab${tab === "users" ? " sg-tab--active" : ""}`} onClick={() => setTab("users")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Users
            {selectedUsers.length > 0 && <span className="sg-tab-count">{selectedUsers.length}</span>}
          </button>
          <button type="button" className={`sg-tab${tab === "routes" ? " sg-tab--active" : ""}`} onClick={() => setTab("routes")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
            Routes
            {selectedRoutes.length > 0 && <span className="sg-tab-count">{selectedRoutes.length}</span>}
          </button>
        </div>

        {/* Search */}
        <div className="sg-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="sg-search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className="sg-search" type="text"
            placeholder={tab === "users" ? "Search drivers, vehicles, cities…" : "Search cities…"}
            value={tab === "users" ? userSearch : routeSearch}
            onChange={e => tab === "users" ? setUserSearch(e.target.value) : setRouteSearch(e.target.value)}
          />
          {(tab === "users" ? userSearch : routeSearch) && (
            <button type="button" className="sg-search-clear"
              onClick={() => tab === "users" ? setUserSearch("") : setRouteSearch("")}>×</button>
          )}
        </div>

        {/* Content */}
        <div className="sg-content">
          {loading ? (
            <div className="sg-empty">Loading suggestions…</div>
          ) : tab === "users" ? (
            filteredUsers.length > 0
              ? filteredUsers.map(u => (
                  <UserCard key={u.id} user={u} selected={selectedUsers.includes(u.id)} onSelect={toggleUser} onViewProfile={handleViewProfile} />
                ))
              : <div className="sg-empty">
                  {trucks.length === 0 ? "No available drivers for this route" : "No drivers match your search"}
                </div>
          ) : (
            filteredRoutes.length > 0
              ? filteredRoutes.map(r => (
                  <RouteCard key={r.id} route={r} selected={selectedRoutes.includes(r.id)} onSelect={toggleRoute} onViewDetails={handleViewRouteDetails} onViewProfile={handleViewProfile} />
                ))
              : <div className="sg-empty">
                  {routes.length === 0 ? "No matching routes found" : "No routes match your search"}
                </div>
          )}
        </div>

        {/* Footer */}
        <div className="sg-sheet-footer">
          <button type="button" className="sg-clear-btn" onClick={handleClear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Clear All
          </button>
          <button type="button" className="sg-apply-btn" onClick={handleContact}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Contact{totalSelected > 0 ? ` (${totalSelected})` : ""}
          </button>
        </div>

      </div>
    </>
  );
};

const CityAutocomplete = ({ value, onChange, placeholder, className = "" }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => setInputValue(value || ""), [value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handle = (v) => {
    setInputValue(v);
    onChange(v);
    if (!v) return setSuggestions([]);
    setSuggestions(algerianCities.filter((c) => c.toLowerCase().includes(v.toLowerCase())).slice(0, 10));
    setShowSuggestions(true);
  };

  return (
    <div className={`city-autocomplete-cs ${className}`} ref={wrapperRef}>
      <input
        type="text"
        className={`cs-input ${className}`}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handle(e.target.value)}
        onFocus={() => inputValue && setShowSuggestions(true)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="city-suggestions-cs">
          {suggestions.map((city) => (
            <li
              key={city}
              className="city-suggestion-item-cs"
              onClick={() => {
                setInputValue(city);
                onChange(city);
                setShowSuggestions(false);
              }}
            >
              <span>{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ChipGrid = ({ options, selected, onToggle, labelKey, subKey, iconKey, single = false }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, 5);
  return (
    <div className="cs-chip-grid">
      {visible.map((opt) => {
        const val = opt[labelKey];
        const active = single ? selected === val : selected.includes(val);
        return (
          <button key={val} type="button" className={`cs-chip${active ? " cs-chip--active" : ""}`} onClick={() => onToggle(val)}>
            <span className="cs-chip-icon">{opt[iconKey]}</span>
            <span className="cs-chip-label">{val}</span>
            {opt[subKey] && <span className="cs-chip-sub">{opt[subKey]}</span>}
          </button>
        );
      })}
      {!showAll && options.length > 5 && (
        <button type="button" className="cs-chip" onClick={() => setShowAll(true)}>
          <span className="cs-chip-icon">➕</span>
          <span className="cs-chip-label">See All</span>
          <span className="cs-chip-sub">{options.length - 5} more</span>
        </button>
      )}
    </div>
  );
};

function CreateShipmentContent({ onBack, onCreated, onNavigate, hasUnreadNotifications = false }) {
  const { userData } = useUser();
  const userName = userData?.name || "User";
  const userRole = userData?.role || "USER";
  const userPhoto = userData?.photo || "";

  const handleSidebarNav = (tab) => {
    if (!onNavigate) return;
    if (tab === "home") onNavigate("dashboard");
    else if (tab === "shipments") onNavigate("shipments");
    else if (tab === "routes") onNavigate("routes");
    else if (tab === "chat") onNavigate("chat");
    else if (tab === "profile") onNavigate("profile");
    else onNavigate(tab);
  };

  const [form, setForm] = useState({
    title: "", productType: "", vehicleTypes: [], quantity: "", weight: "", volume: "",
    price: "", pickup: "", delivery: "", date: "", time: "", priority: "Normal", description: "",
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuggested, setShowSuggested] = useState(false);
  const [suggestData, setSuggestData] = useState({ trucks: [], routes: [] });
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const handleProductType = (val) => setForm((p) => ({ ...p, productType: p.productType === val ? "" : val }));
  const handleVehicleToggle = (val) =>
    setForm((p) => ({ ...p, vehicleTypes: p.vehicleTypes.includes(val) ? p.vehicleTypes.filter((v) => v !== val) : [...p.vehicleTypes, val] }));
  const handlePhotosChange = (e) => setPhotos(Array.from(e.target.files || []).slice(0, 5));

  const isValidCity = (city) => city && algerianCities.some((c) => c.toLowerCase() === city.toLowerCase().trim());
  const canSuggest = isValidCity(form.pickup) && isValidCity(form.delivery);

  const handleSuggestClick = async () => {
    if (!canSuggest) return;
    try {
      setSuggestLoading(true);
      const data = await fetchSuggestions(form.pickup.trim(), form.delivery.trim());
      setSuggestData({ trucks: data.availableTrucks, routes: data.suggestedRoutes });
      setShowSuggested(true);
    } catch {
      toastError("Could not load suggestions. Please try again.");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSubmit = async () => {
    const isValid =
      form.title && form.productType && form.vehicleTypes.length > 0 && form.quantity &&
      form.weight && form.volume && form.price && form.pickup && form.delivery &&
      form.date && form.time && form.priority;

    if (!isValid) return toastError("Please fill in all required fields.");
    if (!isValidCity(form.pickup) || !isValidCity(form.delivery)) return toastError("Please use valid Algerian cities.");

    try {
      setLoading(true);
      setSuccess(false);

      const photoData = photos[0] ? await uploadPhoto(photos[0]) : null;
      const payload = {
        title: form.title.trim(),
        product_Type: form.productType,
        photo: photoData,
        origin: form.pickup.trim(),
        destination: form.delivery.trim(),
        possible_Veh: form.vehicleTypes[0] || "",
        quantity: Number(form.quantity),
        volume: Number(form.volume),
        weight: Number(form.weight),
        price: Number(form.price),
        date: form.date,
        time: form.time,
        priority: form.priority,
        special_Information: form.description.trim() || null,
      };

      const created = await createShipment(payload);
      setSuccess(true);
      toastSuccess("Shipment created");
      if (onCreated) onCreated(created?.shipment_ID ?? created?.id ?? created?._id);
    } catch (err) {
      toastError(err.message || "Failed to create shipment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cs-screen">
      <div className="cs-desktop-layout">
        <Sidebar
          activeNav="shipments"
          onNavigate={handleSidebarNav}
          userRole={userRole}
        />

        <div className={`cs-container ${mounted ? "cs-container--visible" : ""}`}>
          <div className="cs-desktop-header">
            <button className="cs-back-btn" onClick={onBack} type="button" title="Back to Shipments">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <Header
              userName={userName}
              userRole={userRole}
              userPhoto={userPhoto}
              hasUnreadNotifications={hasUnreadNotifications}
              onNavigate={onNavigate}
            />
          </div>

          <div className="cs-header cs-mobile-header">
            <button className="cs-back-btn" onClick={onBack} type="button" title="Back to Shipments">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <h2 className="cs-title">Create Shipment</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button className="cs-suggest-btn cs-suggest-btn--mobile-only" onClick={handleSuggestClick} disabled={!canSuggest || suggestLoading}>
                {suggestLoading ? "Loading…" : "Suggest"}
              </button>
              <ThemeToggle />
            </div>
          </div>

        <div className="cs-body">
          <div className="cs-body-left">
            <div className="cs-section-header"><span className="cs-section-dot" /><span className="cs-section-label">SHIPMENT INFORMATION</span></div>

            <div className="cs-field"><label className="cs-label">Title</label><input className="cs-input" placeholder="Enter shipment title" value={form.title} onChange={(e) => handleChange("title", e.target.value)} /></div>
            <div className="cs-field"><label className="cs-label">Product Type</label><ChipGrid options={CARGO_TYPES} selected={form.productType} onToggle={handleProductType} labelKey="product" subKey="vehicleFr" iconKey="icon" single /></div>
            <div className="cs-field"><label className="cs-label">Possible Vehicles</label><ChipGrid options={VEHICLE_TYPES} selected={form.vehicleTypes} onToggle={handleVehicleToggle} labelKey="vehicle" subKey="vehicleFr" iconKey="icon" /></div>

            <div className="cs-field-row">
              <div className="cs-field cs-field--half"><label className="cs-label">Quantity</label><input type="number" min="1" placeholder="e.g., 10" className="cs-input" value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} /></div>
              <div className="cs-field cs-field--half"><label className="cs-label">Weight (t)</label><input type="number" min="0" step="0.01" placeholder="e.g., 5.5" className="cs-input" value={form.weight} onChange={(e) => handleChange("weight", e.target.value)} /></div>
            </div>

            <div className="cs-field-row">
              <div className="cs-field cs-field--half"><label className="cs-label">Volume (m³)</label><input type="number" min="0" step="0.01" placeholder="e.g., 15.0" className="cs-input" value={form.volume} onChange={(e) => handleChange("volume", e.target.value)} /></div>
              <div className="cs-field cs-field--half"><label className="cs-label">Price (DZD)</label><input type="number" min="0" step="1" placeholder="e.g., 5000" className="cs-input" value={form.price} onChange={(e) => handleChange("price", e.target.value)} /></div>
            </div>

            <div className="cs-field-row">
              <div className="cs-field cs-field--half">
                <label className="cs-label">Pickup Date</label>
                <input type="date" className="cs-input" value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
              </div>
              <div className="cs-field cs-field--half">
                <label className="cs-label">Pickup Time</label>
                <input type="time" className="cs-input" value={form.time} onChange={(e) => handleChange("time", e.target.value)} />
              </div>
            </div>

            <div className="cs-field">
              <label className="cs-label">Priority</label>
              <select className="cs-select" value={form.priority} onChange={(e) => handleChange("priority", e.target.value)}>
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="cs-field">
              <label className="cs-label">Description</label>
              <textarea className="cs-input cs-textarea" rows={3} placeholder="Enter special instructions or notes..." value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>

            <div className="cs-field">
              <label className="cs-label" htmlFor="cs-photos">Photos</label>
              <input id="cs-photos" type="file" className="cs-file-input" accept="image/*" multiple onChange={handlePhotosChange} />
              <label htmlFor="cs-photos" className="cs-upload-box"><span className="cs-upload-main">Upload photos</span></label>
              {photos.length > 0 && <p className="cs-upload-selected">{photos.length} photo(s) selected</p>}
            </div>
          </div>

          <div className="cs-body-right">
            <div className="cs-waypoints-box">
              <div className="cs-waypoints-head">
                <span>WAYPOINTS & STOPS</span>
                <button type="button" className="cs-clear-all-btn">Clear All</button>
              </div>

              <div className="cs-stop-card cs-stop-card--start">
                <span className="cs-stop-drag">⋮⋮</span>
                <div className="cs-stop-main">
                  <span className="cs-stop-tag cs-stop-tag--start">START</span>
                  <div className="cs-stop-input-row">
                    <svg className="cs-stop-icon cs-stop-icon--start" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <CityAutocomplete className="cs-stop-input" value={form.pickup} onChange={(v) => handleChange("pickup", v)} placeholder="Enter departure city" />
                  </div>
                </div>
                <svg className="cs-stop-end-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="cs-stop-card cs-stop-card--destination">
                <span className="cs-stop-drag">⋮⋮</span>
                <div className="cs-stop-main">
                  <span className="cs-stop-tag cs-stop-tag--destination">DESTINATION</span>
                  <div className="cs-stop-input-row">
                    <svg className="cs-stop-icon cs-stop-icon--destination" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <CityAutocomplete className="cs-stop-input" value={form.delivery} onChange={(v) => handleChange("delivery", v)} placeholder="Enter destination city" />
                  </div>
                </div>
                <svg className="cs-stop-end-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>


              <button
                type="button"
                className={`cs-fast-access-btn ${!canSuggest || suggestLoading ? "cs-fast-access-btn--disabled" : ""}`}
                onClick={handleSuggestClick}
                disabled={!canSuggest || suggestLoading}
              >
                {suggestLoading ? "Loading…" : "Fast Access, View Suggestions Here"}
              </button>

              {success && <div className="cs-feedback cs-feedback--success">Shipment posted successfully!</div>}
              <button className="cs-submit-btn cs-submit-btn--desktop" onClick={handleSubmit} disabled={loading}>
                {loading ? "Posting…" : "Post Shipment"}
              </button>
            </div>
          </div>
        </div>

        <div className="cs-footer">
          {success && <div className="cs-feedback cs-feedback--success">Shipment posted successfully!</div>}
          <button className="cs-submit-btn cs-submit-btn--mobile" onClick={handleSubmit} disabled={loading}>
            {loading ? "Posting…" : "Post Shipment"}
          </button>
        </div>
        </div>
      </div>

      <SuggestedSheet
        visible={showSuggested}
        onClose={() => setShowSuggested(false)}
        onApply={() => {}}
        trucks={suggestData.trucks}
        routes={suggestData.routes}
        loading={suggestLoading}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default function CreateShipment(props) {
  return (
    <UserProvider>
      <CreateShipmentContent {...props} />
    </UserProvider>
  );
}
