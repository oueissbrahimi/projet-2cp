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

const withRouteDateObjects = (payload = {}) => {
  const next = { ...payload };

  if (Object.prototype.hasOwnProperty.call(next, "date")) {
    const value = toDateObject(next.date);
    next.date = value ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(next, "interval_start")) {
    const value = toDateObject(next.interval_start);
    next.interval_start = value ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(next, "interval_end")) {
    const value = toDateObject(next.interval_end);
    next.interval_end = value ?? null;
  }

  return next;
};

const STATUS_MAP = {
  Pending: "SCHEDULED",
  "In Transit": "IN_PROGRESS",
  Delivered: "COMPLETED",
};

// ─── Query Builder ────────────────────────────────────────────────────────────
const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
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
// { status, vehicleType, origins, destinations, waypoints, region,
//   beforeDate, afterDate, sortBy, sortOrder }
const mapFiltersToParams = (filters = {}) => {
  const mapped = {};

  if (filters.locationMode === "shipment") {
    if (filters.shipmentOrigin && filters.shipmentDestination) {
      mapped.origins = [filters.shipmentOrigin];
      mapped.destinations = [filters.shipmentDestination];
    }
  } else {
    if (filters.origins?.length)      mapped.origins      = filters.origins;
    if (filters.destinations?.length) mapped.destinations = filters.destinations;
  }
  if (filters.waypoints?.length)    mapped.waypoints    = filters.waypoints;
  if (filters.region)               mapped.region       = filters.region;
  if (filters.status)               mapped.status       = filters.status;
  if (filters.afterDate)            mapped.afterDate    = toFilterDateIso(filters.afterDate, { endOfDay: false });
  if (filters.beforeDate)           mapped.beforeDate   = toFilterDateIso(filters.beforeDate, { endOfDay: true });
  if (filters.capacityMin !== "")   mapped.minCapacity = filters.capacityMin;
  if (filters.capacityMax !== "")   mapped.maxCapacity = filters.capacityMax;

  // Backend accepts vehicleType as a repeated param; arrays map to { in: [...] }.
  if (filters.vehicleTypes?.length) mapped.vehicleType = filters.vehicleTypes;

  // sortBy / sortOrder — backend field names differ from UI names
  const SORT_MAP = { created: "createdAt", shipment: "shipment_date", shipping: "shipping_date", price: "price" };
  if (filters.status) mapped.status = STATUS_MAP[filters.status] ?? String(filters.status).toUpperCase().replace(/\s+/g, "_");
  if (filters.sortBy)  mapped.sortBy    = SORT_MAP[filters.sortBy] ?? filters.sortBy;
  if (filters.sortDir) mapped.sortOrder = filters.sortDir;

  return mapped;
};

// ─── Decide which endpoint to use ────────────────────────────────────────────
// /api/routes          → returns all, ignores any query params
// /api/filter/routes   → applies filters from filtersController.js
const hasActiveFilters = (mapped = {}) => {
  // sortBy/sortOrder alone don't count as "active" — they're always sent on filtered requests
  const { sortBy, sortOrder, ...rest } = mapped;
  return Object.keys(rest).length > 0;
};

// ─── Core fetch — no filters = get all, with filters = backend filters ────────
export const getRoutes = async (filters = {}, sortBy = null, fetchAll = false) => {
  const params = mapFiltersToParams(filters);

  let url;
  if (hasActiveFilters(params)) {
    const query = buildQuery(params);
    url = `${API_URL}/filter/routes?${query}`;
  } else {
    url = `${API_URL}/routes`;
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
    { fallbackMessage: "Failed to fetch routes", authAware: true }
  );

  // /api/routes          → { success, total, routes: [...] }
  // /api/filter/routes   → raw array
  return Array.isArray(data) ? data : (data?.routes ?? []);
};

// ─── My routes ────────────────────────────────────────────────────────────────
export const getMyRoutes = async (filters = {}) => {
  const params = mapFiltersToParams(filters);
  const query  = buildQuery(params);
  const url    = query ? `${API_URL}/routes/me?${query}` : `${API_URL}/routes/me`;

  const data = await requestJson(
    url,
    { method: "GET", headers: getAuthHeaders() },
    { fallbackMessage: "Failed to fetch routes", authAware: true }
  );

  return Array.isArray(data?.routes) ? data.routes : [];
};

// ─── Get single route by ID ──────────────────────────────────────────────────
export const getRouteById = async (routeId) => {
  const data = await requestJson(
    `${API_URL}/routes/${encodeURIComponent(String(routeId))}`,
    { method: "GET", headers: getAuthHeaders() },
    { fallbackMessage: "Failed to fetch route", authAware: true }
  );
  return data?.route ?? data ?? null;
};

// ─── Create ───────────────────────────────────────────────────────────────────
export const createRoute = async (payload) => {
  const bodyPayload = withRouteDateObjects(payload);
  return requestJson(
    `${API_URL}/routes`,
    { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(bodyPayload) },
    { fallbackMessage: "Failed to create route", authAware: true }
  );
};

// ─── Update ───────────────────────────────────────────────────────────────────
export const updateRoute = async (payload) => {
  const bodyPayload = withRouteDateObjects(payload);
  const data = await requestJson(
    `${API_URL}/routes`,
    { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify(bodyPayload) },
    { fallbackMessage: "Failed to update route", authAware: true }
  );
  return data?.data || data;
};

// ─── Delete ───────────────────────────────────────────────────────────────────
export const deleteRoute = async (routeId) => {
  return requestJson(
    `${API_URL}/routes/${encodeURIComponent(String(routeId))}`,
    { method: "DELETE", headers: getAuthHeaders() },
    { fallbackMessage: "Failed to delete route", authAware: true }
  );
};