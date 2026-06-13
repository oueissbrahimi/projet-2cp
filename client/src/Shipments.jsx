import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, Navigation, Plus, SlidersHorizontal, Truck, User, ArrowUpDown, DollarSign, Package, Weight, Layers, ChevronUp, ChevronDown, ChevronRight, Tag } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Pagination from "./components/Pagination";
import { UserProvider, useUser } from "./contexts/UserContext";
import "./Shipments.css";
import { getShipments } from "./services/shipmentService";
import { toastError } from "./services/toastService";
import { resolveMediaUrl } from "./utils/media";
import { ALGERIAN_CITIES as algerianCities } from "./constants/algerianCities";

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Created" },
  { value: "price", label: "Price" },
  { value: "shippingDate", label: "Ship Date" },
];

const CARGO_TYPES = [
  { product: "Small Parcels",           vehicle: "Small Van",          vehicleFr: "Camionnette",       icon: "📦" },
  { product: "Furniture",               vehicle: "Fourgon",            vehicleFr: "Fourgon",           icon: "🛋️" },
  { product: "Electronics / Fragile",  vehicle: "Closed Box Van",     vehicleFr: "Fourgon Fermé",     icon: "📺" },
  { product: "Perishables / Food",     vehicle: "Refrigerated Truck",  vehicleFr: "Frigo",             icon: "🧊" },
  { product: "Agricultural Products",  vehicle: "Open-Slat Truck",    vehicleFr: "Maraîcher",         icon: "🌾" },
  { product: "Construction Materials", vehicle: "Dropside Truck",     vehicleFr: "Camion à ridelles", icon: "🏗️" },
  { product: "Industrial / Bulk",      vehicle: "Semi-trailer",       vehicleFr: "Semi-remorque",     icon: "🏭" },
  { product: "Liquids & Chemicals",    vehicle: "Tanker",             vehicleFr: "Citerne",           icon: "🛢️" },
  { product: "Livestock",              vehicle: "Livestock Carrier",  vehicleFr: "Camion à Bétail",   icon: "🐄" },
  { product: "Towing & Recovery",      vehicle: "Tow Truck",          vehicleFr: "Dépanneuse",        icon: "🔧" },
];

const VEHICLE_TYPES = [
  { vehicle: "Small Van",          vehicleFr: "Camionnette",       icon: "🚐" },
  { vehicle: "Fourgon",            vehicleFr: "Fourgon",           icon: "🚚" },
  { vehicle: "Closed Box Van",     vehicleFr: "Fourgon Fermé",     icon: "🚛" },
  { vehicle: "Refrigerated Truck", vehicleFr: "Frigo",             icon: "❄️" },
  { vehicle: "Open-Slat Truck",    vehicleFr: "Maraîcher",         icon: "🌿" },
  { vehicle: "Dropside Truck",     vehicleFr: "Camion à ridelles", icon: "🏗️" },
  { vehicle: "Semi-trailer",       vehicleFr: "Semi-remorque",     icon: "🚜" },
  { vehicle: "Tanker",             vehicleFr: "Citerne",           icon: "🛢️" },
  { vehicle: "Livestock Carrier",  vehicleFr: "Camion à Bétail",   icon: "🐄" },
  { vehicle: "Tow Truck",          vehicleFr: "Dépanneuse",        icon: "🔧" },
  { vehicle: "Flatbed Truck",      vehicleFr: "Plateau",           icon: "🛻" },
  { vehicle: "Tipper Truck",       vehicleFr: "Benne",             icon: "⛏️" },
  { vehicle: "Crane Truck",        vehicleFr: "Camion Grue",       icon: "🏗️" },
  { vehicle: "Concrete Mixer",     vehicleFr: "Toupie / Malaxeur", icon: "🔄" },
  { vehicle: "Car Transporter",    vehicleFr: "Porte-voiture",     icon: "🚗" },
  { vehicle: "Motorcycle Courier", vehicleFr: "Coursier Moto",     icon: "🏍️" },
  { vehicle: "Pickup Truck",       vehicleFr: "Pick-up",           icon: "🛻" },
  { vehicle: "Container Truck",    vehicleFr: "Porte-conteneur",   icon: "📦" },
  { vehicle: "Bulk Carrier",       vehicleFr: "Vrac",              icon: "⚙️" },
  { vehicle: "Medical Transport",  vehicleFr: "Transport Médical", icon: "🏥" },
];

const MAX_PRICE_LIMIT = 500000;
const MAX_QUANTITY_LIMIT = 500;
const MAX_WEIGHT_LIMIT = 30;
const MAX_SIZE_LIMIT = 120;

const clampNumber = (value, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
};

const normalizeRange = (minVal, maxVal, minLimit, maxLimit) => {
  const minClean = clampNumber(minVal, minLimit, maxLimit) ?? minLimit;
  const maxClean = clampNumber(maxVal, minLimit, maxLimit) ?? maxLimit;
  if (minClean <= maxClean) return [minClean, maxClean];
  return [maxClean, minClean];
};

const parsePrice = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const match = v.replace(/,/g, ".").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDateInput = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]), m = Number(isoMatch[2]), d = Number(isoMatch[3]);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
    return null;
  }
  const dmyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!dmyMatch) return null;
  const d = Number(dmyMatch[1]), m = Number(dmyMatch[2]), y = Number(dmyMatch[3]);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
};

const parseItemDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === "string") { const p = parseDateInput(value); if (p) return p.getTime(); }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const normalizeStatus = (v) => {
  const s = String(v || "").toLowerCase().trim();
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("deliver")) return "Delivered";
  if (s.includes("transit")) return "In Transit";
  if (s.includes("picked") || s.includes("pick_up") || s.includes("pickup")) return "Picked Up";
  if (s.includes("match") || s.includes("accept")) return "Matched";
  return "Pending";
};

const normalizeShipment = (item, i, fallbackName = "User") => ({
  id: item?.shipment_ID || item?.id || `${i}`,
  ownerId: item?.user?.id || null,
  ownerPhoto: item?.user?.profile_Photo || "",
  name: item?.user?.individual?.full_Name || item?.user?.business?.business_Name || fallbackName,
  createdAtText: item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently",
  createdAtValue: parseItemDateValue(item?.createdAt),
  origin: item?.origin || "Origin",
  destination: item?.destination || "Destination",
  description: item?.special_Information || "No description provided.",
  productType: item?.product_Type || item?.productType || "Product type not specified",
  vehicleType: item?.possible_Veh || item?.vehicleType || item?.vehicle || "Vehicle type not specified",
  priceValue: parsePrice(item?.price),
  shippingDateValue: parseItemDateValue(item?.date || item?.pickupDate),
  status: normalizeStatus(item?.status),
});

const CityAutocomplete = ({ onSelect, placeholder, excludes = [] }) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    if (newValue.length > 0) {
      const filtered = algerianCities
        .filter((city) => city.toLowerCase().includes(newValue.toLowerCase()) && !excludes.includes(city));
      setSuggestions(filtered.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city) => {
    onSelect(city);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
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
    <div className="routes-filter-autocomplete" ref={wrapperRef}>
      <div className="routes-city-search-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="routes-city-search-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
          autoComplete="off"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="routes-filter-suggestions">
          {suggestions.map((city, index) => (
            <li
              key={city}
              className={`routes-filter-suggestion-item ${index === selectedIndex ? "selected" : ""}`}
              onClick={() => handleSelectCity(city)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DualRangeSlider = ({
  min, max, step = 1, minGap = step,
  valueMin, valueMax, onChange,
  formatThumb = (v) => String(v),
  formatBubble = (v) => String(v),
  minLabel, maxLabel, BubbleIcon,
  showInputs = false, inputStep = step, bubbleSuffix = "",
}) => {
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const leftPct = pct(valueMin);
  const rightPct = pct(valueMax);

  const handleMin = (e) => {
    const val = Math.min(Number(e.target.value), valueMax - minGap);
    onChange(Math.max(min, val), valueMax);
  };
  const handleMax = (e) => {
    const val = Math.max(Number(e.target.value), valueMin + minGap);
    onChange(valueMin, Math.min(max, val));
  };

  const handleMinInput = (e) => {
    const next = clampNumber(e.target.value, min, max);
    if (next == null) return;
    const clamped = Math.min(next, valueMax - minGap);
    onChange(clamped, valueMax);
  };

  const handleMaxInput = (e) => {
    const next = clampNumber(e.target.value, min, max);
    if (next == null) return;
    const clamped = Math.max(next, valueMin + minGap);
    onChange(valueMin, clamped);
  };

  const leftLabel = minLabel ?? String(min);
  const rightLabel = maxLabel ?? String(max);

  return (
    <div className="sh-price-slider">
      <div className="sh-price-bubbles">
        <div className="sh-price-bubble">
          {BubbleIcon ? <BubbleIcon size={10} /> : null}
          {showInputs ? (
            <>
              <input
                type="number"
                min={min}
                max={max}
                step={inputStep}
                className="sh-price-bubble-input"
                value={valueMin}
                onChange={handleMinInput}
              />
              {bubbleSuffix && <span className="sh-price-bubble-suffix">{bubbleSuffix}</span>}
            </>
          ) : (
            <span>{formatBubble(valueMin)}</span>
          )}
        </div>
        <ArrowUpDown size={14} className="sh-price-arrow-icon" />
        <div className="sh-price-bubble sh-price-bubble--max">
          {BubbleIcon ? <BubbleIcon size={10} /> : null}
          {showInputs ? (
            <>
              <input
                type="number"
                min={min}
                max={max}
                step={inputStep}
                className="sh-price-bubble-input"
                value={valueMax}
                onChange={handleMaxInput}
              />
              {bubbleSuffix && <span className="sh-price-bubble-suffix">{bubbleSuffix}</span>}
            </>
          ) : (
            <span>{formatBubble(valueMax)}</span>
          )}
        </div>
      </div>
      <div className="sh-slider-track-wrap">
        <div className="sh-slider-rail" />
        <div
          className="sh-slider-fill"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        <div className="sh-thumb-label sh-thumb-label--left" style={{ left: `${leftPct}%` }}>
          {formatThumb(valueMin)}
        </div>
        <div className="sh-thumb-label sh-thumb-label--right" style={{ left: `${rightPct}%` }}>
          {formatThumb(valueMax)}
        </div>
        <input
          type="range" min={min} max={max} step={step} value={valueMin}
          onChange={handleMin}
          className="sh-slider-input sh-slider-input--left"
        />
        <input
          type="range" min={min} max={max} step={step} value={valueMax}
          onChange={handleMax}
          className="sh-slider-input sh-slider-input--right"
        />
      </div>
      <div className="sh-slider-rail-labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
};

const INITIAL_FILTERS = {
  locationMode: "standard",
  origins: [], destinations: [],
  stops: [], // for road mode
  productTypes: [], vehicleTypes: [],
  status: "",
  priceMin: 0, priceMax: MAX_PRICE_LIMIT,
  minQuantity: 0, maxQuantity: MAX_QUANTITY_LIMIT,
  minWeight: 0, maxWeight: MAX_WEIGHT_LIMIT,
  minSize: 0, maxSize: MAX_SIZE_LIMIT,
  afterDate: "", beforeDate: "",
};
const FILTERS_STORAGE_KEY = "shipments.filters.v1";

const loadStoredFilters = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || "null");
    if (!raw || typeof raw !== "object") return INITIAL_FILTERS;
    const merged = { ...INITIAL_FILTERS, ...raw };
    const [minQuantity, maxQuantity] = normalizeRange(merged.minQuantity, merged.maxQuantity, 0, MAX_QUANTITY_LIMIT);
    const [minWeight, maxWeight] = normalizeRange(merged.minWeight, merged.maxWeight, 0, MAX_WEIGHT_LIMIT);
    const [minSize, maxSize] = normalizeRange(merged.minSize, merged.maxSize, 0, MAX_SIZE_LIMIT);
    const [priceMin, priceMax] = normalizeRange(merged.priceMin, merged.priceMax, 0, MAX_PRICE_LIMIT);
    return { ...merged, minQuantity, maxQuantity, minWeight, maxWeight, minSize, maxSize, priceMin, priceMax };
  } catch {
    return INITIAL_FILTERS;
  }
};

const ITEMS_PER_PAGE = 9;

const ShipmentsContent = ({ onNavigate, hasUnreadNotifications = false }) => {
  const { userData } = useUser();
  const userName = userData.name || "User";
  const userRole = userData.role || "USER";
  const userPhoto = userData.photo || "";

  const [activeTab] = useState("all");
  const [activeNav, setActiveNav] = useState("shipments");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState(() => loadStoredFilters());
  const [draftFilters, setDraftFilters] = useState(() => loadStoredFilters());
  const [showFilter, setShowFilter] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAllVehiclesSh, setShowAllVehiclesSh] = useState(false);
  const [showAllCategoriesSh, setShowAllCategoriesSh] = useState(false);

  const displayName = userName;
  const isAdmin = String(userRole || "").trim().toUpperCase() === "ADMIN";

  const hasActiveFilters =
    filters.origins.length > 0 || filters.destinations.length > 0 ||
    filters.stops.length > 0 ||
    filters.productTypes.length > 0 || filters.vehicleTypes.length > 0 || filters.status ||
    filters.priceMin > 0 || filters.priceMax < MAX_PRICE_LIMIT ||
    filters.minQuantity > 0 || filters.maxQuantity < MAX_QUANTITY_LIMIT ||
    filters.minWeight > 0 || filters.maxWeight < MAX_WEIGHT_LIMIT ||
    filters.minSize > 0 || filters.maxSize < MAX_SIZE_LIMIT ||
    filters.afterDate || filters.beforeDate;

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const list = await getShipments(filters);
      setShipments((Array.isArray(list) ? list : []).map((s, i) => normalizeShipment(s, i, displayName)));
    } catch {
      setError("Could not load shipments right now.");
      toastError("Could not load shipments right now.");
      setShipments([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, displayName]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const visibleShipments = useMemo(() => {
    const tabFiltered = activeTab === "all" ? shipments : shipments.filter((s) => s.status === activeTab);

    const sorted = [...tabFiltered].sort((a, b) => {
      const av = sortBy === "price" ? a.priceValue ?? -Infinity : sortBy === "shippingDate" ? a.shippingDateValue ?? -Infinity : a.createdAtValue ?? -Infinity;
      const bv = sortBy === "price" ? b.priceValue ?? -Infinity : sortBy === "shippingDate" ? b.shippingDateValue ?? -Infinity : b.createdAtValue ?? -Infinity;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [shipments, activeTab, sortBy, sortDir]);

  const openFilter = () => {
    setDraftFilters(filters);
    setShowAllVehiclesSh(false);
    setShowAllCategoriesSh(false);
    setShowFilter(true);
  };

  const addCity = (field, city) => {
    setDraftFilters((prev) => {
      if (prev[field].includes(city)) return prev;
      return { ...prev, [field]: [...prev[field], city] };
    });
  };

  const removeCity = (field, city) => {
    setDraftFilters((prev) => ({ ...prev, [field]: prev[field].filter((c) => c !== city) }));
  };

  const toggleArray = useCallback((key, val) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter((v) => v !== val) : [...prev[key], val],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setDraftFilters(INITIAL_FILTERS);
    setShowAllVehiclesSh(false);
    setShowAllCategoriesSh(false);
  }, []);

  const applyFilters = () => {
    setFilters(sanitizeFilters(draftFilters));
    setCurrentPage(1);
    setShowFilter(false);
  };

  const handleNav = (tab) => {
    setActiveNav(tab);
    if (tab === "home") onNavigate?.("dashboard");
    if (tab === "routes") onNavigate?.("routes");
    if (tab === "profile") onNavigate?.("profile");
  };

  const handleSidebarNav = (tab) => {
    if (tab === "home") onNavigate?.("dashboard");
    else if (tab === "shipments") { setActiveNav("shipments"); }
    else if (tab === "routes") onNavigate?.("routes");
    else if (tab === "profile") onNavigate?.("profile");
    else onNavigate?.(tab);
  };

  const sanitizeFilters = useCallback((raw) => {
    const [minQuantity, maxQuantity] = normalizeRange(raw.minQuantity, raw.maxQuantity, 0, MAX_QUANTITY_LIMIT);
    const [minWeight, maxWeight] = normalizeRange(raw.minWeight, raw.maxWeight, 0, MAX_WEIGHT_LIMIT);
    const [minSize, maxSize] = normalizeRange(raw.minSize, raw.maxSize, 0, MAX_SIZE_LIMIT);
    const [priceMin, priceMax] = normalizeRange(raw.priceMin, raw.priceMax, 0, MAX_PRICE_LIMIT);
    return { ...raw, minQuantity, maxQuantity, minWeight, maxWeight, minSize, maxSize, priceMin, priceMax };
  }, []);

  return (
    <div className="sh-screen">
      <div className="sh-desktop-shell">
        <Sidebar
          activeNav={activeNav}
          onNavigate={handleSidebarNav}
          userRole={userRole}
        />

        <div className="sh-desktop-main">
          <div className="sh-container">
            <Header
              userName={userName}
              userRole={userRole}
              userPhoto={userPhoto}
              hasUnreadNotifications={hasUnreadNotifications}
              onNavigate={onNavigate}
            />

            <div className="sh-body">
              <div className="sh-section-row">
                <h2 className="sh-section-title">Explore Shipments</h2>
                <div className="sh-inline-controls">
                  <button
                    className="sh-body-create-btn"
                    onClick={() => onNavigate?.("createShipment")}
                    type="button"
                  >
                    <Plus size={16} /> New Shipment
                  </button>
                  <select className="sh-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                    {isAdmin && <option value="status">Status</option>}
                  </select>
                  <button className="sh-sort-dir-btn" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} type="button">
                    {sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button className="sh-filter-btn" onClick={openFilter} type="button">
                    <SlidersHorizontal size={14} /> Filter
                    {hasActiveFilters && <span className="routes-filter-active-dot" />}
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="sh-empty-state">Loading shipments...</div>
              ) : error ? (
                <div className="sh-empty-state">{error}</div>
              ) : visibleShipments.length === 0 ? (
                <div className="sh-empty-state">Nothing to explore right now.</div>
              ) : (
                <>
                  <div className="sh-cards-grid">
                    {visibleShipments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((s) => (
                      <div key={s.id} className="sh-card" onClick={() => onNavigate?.("shipmentDetails", { shipmentId: s.id })}>
                        <div className="sh-card-top">
                          <button
                            className="sh-avatar"
                            type="button"
                            aria-label="Open user profile"
                            onClick={(e) => { e.stopPropagation(); if (s.ownerId) onNavigate?.("publicProfile", { userId: s.ownerId, from: "shipments" }); }}
                          >
                            {s.ownerPhoto ? (
                              <img src={resolveMediaUrl(s.ownerPhoto)} alt={s.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="2" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            )}
                          </button>
                          <div className="sh-card-info">
                            <button
                              type="button"
                              className="sh-card-name"
                              onClick={(e) => { e.stopPropagation(); if (s.ownerId) onNavigate?.("publicProfile", { userId: s.ownerId, from: "shipments" }); }}
                            >
                              {s.name}
                            </button>
                            <span className="sh-card-time">{s.createdAtText}</span>
                          </div>
                          {s.priceValue != null && (
                            <span className="sh-card-price">{s.priceValue.toLocaleString("fr-DZ")} DA</span>
                          )}
                        </div>

                        <p className="sh-card-description">
                          {s.description || "No description provided."}
                        </p>

                        <div className="sh-card-route">
                          <div className="sh-route-row">
                            <span className="sh-route-dot sh-route-dot--green" />
                            <div>
                              <span className="sh-route-label">ORIGIN</span>
                              <span className="sh-route-val">{s.origin}</span>
                            </div>
                          </div>
                          <div className="sh-route-row">
                            <span className="sh-route-dot sh-route-dot--gray" />
                            <div>
                              <span className="sh-route-label">DESTINATION</span>
                              <span className="sh-route-val">{s.destination}</span>
                            </div>
                          </div>
                        </div>

                        <div className="sh-card-footer">
                          <div className="sh-card-tags">
                            {s.vehicleType && (
                              <span className="sh-tag">
                                <Truck size={12} />
                                Vehicle type: {s.vehicleType}
                              </span>
                            )}
                            {s.productType && (
                              <span className="sh-tag">
                                <Package size={12} />
                                Product type: {s.productType}
                              </span>
                            )}
                            <span className={`sh-shipment-status-tag sh-shipment-status-tag--${s.status.toLowerCase().replace(/\s+/g, "-")}`}>
                              {s.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="sh-card-actions">
                            {s.ownerId && (
                              <button
                                className="sh-details-btn"
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onNavigate?.("publicProfile", { userId: s.ownerId, from: "shipments" }); }}
                              >
                                <User size={14} />
                                Profile
                              </button>
                            )}
                            <button
                              className="sh-details-btn"
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onNavigate?.("shipmentDetails", { shipmentId: s.id }); }}
                            >
                              <ChevronRight size={14} />
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(visibleShipments.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>

            <button className="sh-fab" onClick={() => onNavigate?.("createShipment")} type="button">
              <Plus size={24} color="white" />
            </button>

            <div className="sh-bottom-nav">
              <button className={`sh-nav-item ${activeNav === "home" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("home")} type="button">
                <Home size={20} /><span>HOME</span>
              </button>
              <button className={`sh-nav-item ${activeNav === "shipments" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("shipments")} type="button">
                <Truck size={20} /><span>SHIPMENTS</span>
              </button>
              <button className={`sh-nav-item ${activeNav === "routes" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("routes")} type="button">
                <Navigation size={20} /><span>ROUTES</span>
              </button>
              <button className={`sh-nav-item ${activeNav === "profile" ? "sh-nav-item--active" : ""}`} onClick={() => handleNav("profile")} type="button">
                <User size={20} /><span>PROFILE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Modal ──────────────────────────────────────────────────────── */}
      {showFilter && (
        <div className="routes-filter-overlay" onClick={() => setShowFilter(false)}>
          <div className="routes-filter-modal" onClick={(e) => e.stopPropagation()}>

            <div className="routes-filter-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "var(--app-green)", flexShrink: 0 }}>
                <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h3 className="routes-filter-title">Filter Shipments</h3>
              <button className="routes-filter-close" onClick={() => setShowFilter(false)} type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="routes-filter-body">

              {/* Status */}
              <div className="routes-filter-group">
                <label className="routes-filter-label">Status</label>
                <div className="routes-status-options">
                  {[{ value: "", label: "All" }, { value: "Pending", label: "Pending" }, { value: "Matched", label: "Matched" }, { value: "Picked Up", label: "Picked Up" }, { value: "In Transit", label: "In Transit" }, { value: "Delivered", label: "Delivered" }, { value: "Cancelled", label: "Cancelled" }].map((option) => (
                    <button
                      key={option.value}
                      className={`routes-status-btn ${draftFilters.status === option.value ? "active" : ""}`}
                      onClick={() => setDraftFilters((prev) => ({ ...prev, status: option.value }))}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="routes-filter-group">
                <label className="routes-filter-label"><Truck size={13} style={{display:"inline",marginRight:4,verticalAlign:"middle"}} />Available Vehicles</label>
                <div className="sh-category-grid">
                  {(showAllVehiclesSh ? VEHICLE_TYPES : VEHICLE_TYPES.slice(0, 5)).map((opt) => (
                    <button key={opt.vehicle} type="button" className={`sh-cat-chip${draftFilters.vehicleTypes.includes(opt.vehicle) ? " active" : ""}`} onClick={() => toggleArray("vehicleTypes", opt.vehicle)}>
                      <span className="sh-cat-icon">{opt.icon}</span><span className="sh-cat-label">{opt.vehicleFr}</span><span className="sh-cat-sub">{opt.vehicle}</span>
                    </button>
                  ))}
                  {!showAllVehiclesSh && VEHICLE_TYPES.length > 5 && (
                    <button type="button" className="sh-cat-chip sh-cat-chip--see-all" onClick={() => setShowAllVehiclesSh(true)}>
                      <span className="sh-cat-icon">➕</span>
                      <span className="sh-cat-label">See all</span>
                      <span className="sh-cat-sub">{VEHICLE_TYPES.length - 5} more</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="routes-filter-group">
                <label className="routes-filter-label"><Tag size={13} style={{display:"inline",marginRight:4,verticalAlign:"middle"}} />Category</label>
                <div className="sh-category-grid">
                  {(showAllCategoriesSh ? CARGO_TYPES : CARGO_TYPES.slice(0, 5)).map((opt) => (
                    <button key={opt.product} type="button" className={`sh-cat-chip${draftFilters.productTypes.includes(opt.product) ? " active" : ""}`} onClick={() => toggleArray("productTypes", opt.product)}>
                      <span className="sh-cat-icon">{opt.icon}</span><span className="sh-cat-label">{opt.product}</span><span className="sh-cat-sub">{opt.vehicleFr}</span>
                    </button>
                  ))}
                  {!showAllCategoriesSh && CARGO_TYPES.length > 5 && (
                    <button type="button" className="sh-cat-chip sh-cat-chip--see-all" onClick={() => setShowAllCategoriesSh(true)}>
                      <span className="sh-cat-icon">➕</span>
                      <span className="sh-cat-label">See all</span>
                      <span className="sh-cat-sub">{CARGO_TYPES.length - 5} more</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Price Slider */}
              <div className="routes-filter-group">
                <label className="routes-filter-label">
                  <DollarSign size={13} style={{ marginRight: "6px" }} />
                  Price Range
                </label>
                <DualRangeSlider
                  min={0} max={MAX_PRICE_LIMIT}
                  step={500}
                  minGap={500}
                  valueMin={draftFilters.priceMin} valueMax={draftFilters.priceMax}
                  BubbleIcon={DollarSign}
                  formatThumb={(v) => v >= MAX_PRICE_LIMIT ? "∞" : v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K` : String(v)}
                  formatBubble={(v) => v >= MAX_PRICE_LIMIT ? "No limit" : `${v.toLocaleString("fr-DZ")} DA`}
                  minLabel="0 DA"
                  maxLabel="500 000+ DA"
                  showInputs={true}
                  inputStep={500}
                  bubbleSuffix="DA"
                  onChange={(mn, mx) => setDraftFilters((p) => ({ ...p, priceMin: mn, priceMax: mx }))}
                />
              </div>

              {/* Location Mode Toggle */}
              <div className="routes-filter-group">
                <label className="routes-filter-label">Location Filter Mode</label>
                <div className="routes-status-options">
                  <button
                    className={`routes-status-btn ${draftFilters.locationMode === "standard" ? "active" : ""}`}
                    onClick={() => setDraftFilters((prev) => ({ ...prev, locationMode: "standard", stops: [] }))}
                    type="button"
                  >
                    By Origin / Dest
                  </button>
                  <button
                    className={`routes-status-btn ${draftFilters.locationMode === "road" ? "active" : ""}`}
                    onClick={() => setDraftFilters((prev) => ({ ...prev, locationMode: "road", origins: [], destinations: [] }))}
                    type="button"
                  >
                    By Road
                  </button>
                </div>
              </div>

              {draftFilters.locationMode === "road" ? (
                /* ── Road Mode: ordered stops ─────────────────────── */
                <div className="routes-filter-group">
                  <label className="routes-filter-label">Road Stops (in order)</label>
                  <CityAutocomplete
                    onSelect={(city) => setDraftFilters((prev) => ({ ...prev, stops: [...prev.stops, city] }))}
                    placeholder="Add a stop along the road..."
                    excludes={[]}
                  />
                  {draftFilters.stops.length > 0 && (
                    <div className="routes-chips-row" style={{ flexDirection: "column", gap: 4 }}>
                      {draftFilters.stops.map((city, idx) => (
                        <span key={`${city}-${idx}`} className="routes-chip routes-chip--origin" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 10, color: "var(--app-green)", minWidth: 16 }}>{idx + 1}</span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" /></svg>
                          {city}
                          <button className="routes-chip-remove" onClick={() => setDraftFilters((prev) => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }))} type="button">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {draftFilters.stops.length > 0 && draftFilters.stops.length < 2 && (
                    <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>Add at least 2 stops for road filtering</div>
                  )}
                </div>
              ) : (
                /* ── Standard Mode: origin + destination cities ──── */
                <>
                  {/* Origin Cities */}
                  <div className="routes-filter-group">
                    <label className="routes-filter-label">Origin Cities</label>
                    <CityAutocomplete onSelect={(city) => addCity("origins", city)} placeholder="Search and add a city..." excludes={draftFilters.origins} />
                    {draftFilters.origins.length > 0 && (
                      <div className="routes-chips-row">
                        {draftFilters.origins.map((city) => (
                          <span key={city} className="routes-chip routes-chip--origin">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" /></svg>
                            {city}
                            <button className="routes-chip-remove" onClick={() => removeCity("origins", city)} type="button">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Destination Cities */}
                  <div className="routes-filter-group">
                    <label className="routes-filter-label">Destination Cities</label>
                    <CityAutocomplete onSelect={(city) => addCity("destinations", city)} placeholder="Search and add a city..." excludes={draftFilters.destinations} />
                    {draftFilters.destinations.length > 0 && (
                      <div className="routes-chips-row">
                        {draftFilters.destinations.map((city) => (
                          <span key={city} className="routes-chip routes-chip--dest">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" /></svg>
                            {city}
                            <button className="routes-chip-remove" onClick={() => removeCity("destinations", city)} type="button">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Quantity */}
              <div className="routes-filter-group">
                <label className="routes-filter-label">
                  <Layers size={13} style={{ marginRight: "6px" }} />
                  Quantity (units)
                </label>
                <DualRangeSlider
                  min={0} max={MAX_QUANTITY_LIMIT}
                  step={1}
                  valueMin={draftFilters.minQuantity} valueMax={draftFilters.maxQuantity}
                  BubbleIcon={Layers}
                  formatThumb={(v) => `${v}`}
                  formatBubble={(v) => `${v} unit${v === 1 ? "" : "s"}`}
                  minLabel="0"
                  maxLabel={`${MAX_QUANTITY_LIMIT}+`}
                  showInputs={true}
                  inputStep={1}
                  bubbleSuffix="units"
                  onChange={(mn, mx) => setDraftFilters((p) => ({ ...p, minQuantity: mn, maxQuantity: mx }))}
                />
              </div>

              {/* Weight */}
              <div className="routes-filter-group">
                <label className="routes-filter-label">
                  <Weight size={13} style={{ marginRight: "6px" }} />
                  Weight (t)
                </label>
                <DualRangeSlider
                  min={0} max={MAX_WEIGHT_LIMIT}
                  step={0.1}
                  minGap={0.1}
                  valueMin={draftFilters.minWeight} valueMax={draftFilters.maxWeight}
                  BubbleIcon={Weight}
                  formatThumb={(v) => `${v}`}
                  formatBubble={(v) => `${v} t`}
                  minLabel="0 t"
                  maxLabel="30+ t"
                  showInputs={true}
                  inputStep={0.1}
                  bubbleSuffix="t"
                  onChange={(mn, mx) => setDraftFilters((p) => ({ ...p, minWeight: mn, maxWeight: mx }))}
                />
              </div>

              {/* Size */}
              <div className="routes-filter-group">
                <label className="routes-filter-label">
                  <Package size={13} style={{ marginRight: "6px" }} />
                  Size (m³)
                </label>
                <DualRangeSlider
                  min={0} max={MAX_SIZE_LIMIT}
                  step={0.5}
                  minGap={0.5}
                  valueMin={draftFilters.minSize} valueMax={draftFilters.maxSize}
                  BubbleIcon={Package}
                  formatThumb={(v) => `${v}`}
                  formatBubble={(v) => `${v} m³`}
                  minLabel="0 m³"
                  maxLabel="120+ m³"
                  showInputs={true}
                  inputStep={0.5}
                  bubbleSuffix="m³"
                  onChange={(mn, mx) => setDraftFilters((p) => ({ ...p, minSize: mn, maxSize: mx }))}
                />
              </div>

              {/* Date Range */}
              <div className="routes-filter-group">
                <label className="routes-filter-label">Date Range</label>
                <div className="routes-date-range">
                  <div className="routes-date-field">
                    <span className="routes-date-field-label">After</span>
                    <input type="date" className="routes-filter-input" value={draftFilters.afterDate}
                      onChange={(e) => setDraftFilters((prev) => ({ ...prev, afterDate: e.target.value }))} />
                  </div>
                  <div className="routes-date-field">
                    <span className="routes-date-field-label">Before</span>
                    <input type="date" className="routes-filter-input" value={draftFilters.beforeDate}
                      onChange={(e) => setDraftFilters((prev) => ({ ...prev, beforeDate: e.target.value }))} />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="routes-filter-footer">
              <button className="routes-filter-clear" onClick={clearFilters} type="button">Clear All</button>
              <button
                className="routes-filter-apply"
                onClick={applyFilters}
                type="button"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Shipments = ({ onNavigate, hasUnreadNotifications = false, userRole }) => {
  return (
    <UserProvider>
      <ShipmentsContent
        onNavigate={onNavigate}
        hasUnreadNotifications={hasUnreadNotifications}
      />
    </UserProvider>
  );
};

export default Shipments;