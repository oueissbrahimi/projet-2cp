import API_URL, { getAuthHeaders, requestJson } from "./http";

const toDateObject = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toFilterDateIso = (value, { endOfDay = false } = {}) => {
  if (!value) return "";
  const input = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const dateObj = new Date(`${input}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`);
    return Number.isNaN(dateObj.getTime()) ? "" : dateObj.toISOString();
  }

  const dateObj = toDateObject(value);
  return dateObj ? dateObj.toISOString() : "";
};

const withShipmentDateObject = (payload = {}) => {
  const next = { ...payload };

  if (Object.prototype.hasOwnProperty.call(next, "date")) {
    const value = toDateObject(next.date);
    next.date = value ?? null;
  }

  return next;
};

const STATUS_MAP = {
  Pending: "PENDING",
  "In Transit": "IN_TRANSIT",
  Delivered: "DELIVERED",
};

// ─── Query Builder ────────────────────────────────────────────────────────────
// Turns a filters object into a URL query string.
// Arrays become repeated params: ?cities=Algiers&cities=Oran
// Undefined / null / empty arrays are skipped (→ "no filter" = get all)
const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Only append if the array actually has values
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== "") params.append(key, v);
      });
    } else if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  return params.toString();
};

// ─── Map frontend filter state → backend param names ─────────────────────────
// Keys MUST match exactly what filtersController.js destructures from req.query:
// { status, productTypes, possibleVehicles, origins, destinations, waypoints,
//   minPrice, maxPrice, beforeDate, afterDate, sortBy, sortOrder }
const mapFiltersToParams = (filters = {}) => {
  const mapped = {};

  // Locations — backend uses "origins" and "destinations" (plural, Prisma { in: [...] })
  // Road mode uses ordered stops, which the backend reads as "waypoints".
  if (filters.origins?.length)      mapped.origins      = filters.origins;
  if (filters.destinations?.length) mapped.destinations = filters.destinations;
  if (filters.locationMode === "road" && filters.stops?.length) mapped.waypoints = filters.stops;

  // Categories — backend uses "productTypes" and "possibleVehicles" (not vehicleTypes!)
  if (filters.productTypes?.length) mapped.productTypes     = filters.productTypes;
  if (filters.vehicleTypes?.length) mapped.possibleVehicles = filters.vehicleTypes;

  // Status
  if (filters.status) mapped.status = STATUS_MAP[filters.status] ?? String(filters.status).toUpperCase().replace(/\s+/g, "_");

  // Price — backend uses minPrice / maxPrice
  if (filters.priceMin > 0)       mapped.minPrice = filters.priceMin;
  if (filters.priceMax < 500_000) mapped.maxPrice = filters.priceMax;

  // Date range — backend uses afterDate / beforeDate
  if (filters.afterDate)  mapped.afterDate  = toFilterDateIso(filters.afterDate, { endOfDay: false });
  if (filters.beforeDate) mapped.beforeDate = toFilterDateIso(filters.beforeDate, { endOfDay: true });

  // Numeric ranges are mapped to backend shipment fields.
  if (filters.minQuantity > 0)      mapped.minQuantity = filters.minQuantity;
  if (filters.maxQuantity < 500)    mapped.maxQuantity = filters.maxQuantity;
  if (filters.minWeight > 0)        mapped.minWeight = filters.minWeight;
  if (filters.maxWeight < 30)       mapped.maxWeight = filters.maxWeight;
  if (filters.minSize > 0)          mapped.minVolume = filters.minSize;
  if (filters.maxSize < 120)        mapped.maxVolume = filters.maxSize;

  return mapped;
};

// ─── Decide which endpoint to use ────────────────────────────────────────────
// /api/shipments          → returns all, ignores any query params
// /api/filter/shipments   → applies filters from filtersController.js
const hasActiveFilters = (mapped = {}) => Object.keys(mapped).length > 0;

// ─── Core fetch (used by both "load all" and "apply filters") ─────────────────
// Pass no arguments (or default INITIAL_FILTERS) → fetches everything via /api/shipments.
// Pass active filters → hits /api/filter/shipments with the correct query params.
export const getShipments = async (filters = {}, sortBy = null, fetchAll = false) => {
  const params = mapFiltersToParams(filters);

  let url;
  if (hasActiveFilters(params)) {
    const query = buildQuery(params);
    url = `${API_URL}/filter/shipments?${query}`;
  } else {
    url = `${API_URL}/shipments`;
  }

  if (fetchAll) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}all=true`;
  }

  if (sortBy) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}sortBy=${encodeURIComponent(sortBy)}`;
  }

  const data = await requestJson(
    url,
    { method: "GET", headers: getAuthHeaders() },
    { fallbackMessage: "Failed to fetch shipments", authAware: true }
  );

  // /api/shipments          → { success, total, shipments: [...] }
  // /api/filter/shipments   → raw array
  return Array.isArray(data) ? data : (data?.shipments ?? []);
};

// ─── My shipments (unchanged) ─────────────────────────────────────────────────
export const getMyShipments = async (filters = {}) => {
  const params = mapFiltersToParams(filters);
  const query  = buildQuery(params);
  const url    = query ? `${API_URL}/shipments/me?${query}` : `${API_URL}/shipments/me`;

  const data = await requestJson(
    url,
    { method: "GET", headers: getAuthHeaders() },
    { fallbackMessage: "Failed to fetch shipments", authAware: true }
  );

  return Array.isArray(data?.shipments) ? data.shipments : [];
};

// ─── Create ───────────────────────────────────────────────────────────────────
export const createShipment = async (payload) => {
  const bodyPayload = withShipmentDateObject(payload);
  return requestJson(
    `${API_URL}/shipments`,
    { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(bodyPayload) },
    { fallbackMessage: "Failed to create shipment", authAware: true }
  );
};

// ─── Update ───────────────────────────────────────────────────────────────────
export const updateShipment = async (payload) => {
  const bodyPayload = withShipmentDateObject(payload);
  const data = await requestJson(
    `${API_URL}/shipments`,
    { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify(bodyPayload) },
    { fallbackMessage: "Failed to update shipment", authAware: true }
  );
  return data?.data || data;
};

// ─── Delete ───────────────────────────────────────────────────────────────────
export const deleteShipment = async (shipmentId) => {
  return requestJson(
    `${API_URL}/shipments/${encodeURIComponent(String(shipmentId))}`,
    { method: "DELETE", headers: getAuthHeaders() },
    { fallbackMessage: "Failed to delete shipment", authAware: true }
  );
};