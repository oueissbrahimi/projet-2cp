const KG_PER_TON = 1000;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const kgToTons = (kg) => {
  const parsed = toNumber(kg);
  return parsed == null ? null : parsed / KG_PER_TON;
};

export const tonsToKg = (tons) => {
  const parsed = toNumber(tons);
  return parsed == null ? null : parsed * KG_PER_TON;
};

export const normalizeWeightToTons = (value, unit) => {
  const parsed = toNumber(value);
  if (parsed == null) return null;
  const unitText = String(unit || "").toLowerCase();
  if (unitText.includes("kg") || unitText.includes("kilogram")) return parsed / KG_PER_TON;
  return parsed;
};

export const formatTons = (value, { precision = 2, unit = "t", sourceUnit } = {}) => {
  const tonsValue = normalizeWeightToTons(value, sourceUnit);
  if (tonsValue == null) return "";
  const rounded = Number(tonsValue.toFixed(precision));
  return `${rounded} ${unit}`;
};

export const formatTonsValue = (value, { precision = 2, sourceUnit } = {}) => {
  const tonsValue = normalizeWeightToTons(value, sourceUnit);
  if (tonsValue == null) return "";
  return String(Number(tonsValue.toFixed(precision)));
};
