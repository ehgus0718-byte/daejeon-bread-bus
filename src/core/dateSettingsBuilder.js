import { DEFAULT_DATE_SETTINGS } from "./reservationSchema.js";

function normalizeScheduleStatus(value) {
  if (value === "모집중") return "open";
  if (value === "예약마감") return "closed";
  if (value === "open" || value === "closed") return value;
  return value || "closed";
}

function normalizeScheduleDetail(value) {
  return String(value || "").trim();
}

function getTodayKey() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function isPastDateKey(dateKey = "") {
  return String(dateKey || "") < getTodayKey();
}

function getDateKeys({
  baseDateSettings = {},
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  scheduleDetails = {}
}) {
  return Array.from(
    new Set([
      ...Object.keys(baseDateSettings),
      ...Object.keys(capacityOverrides),
      ...Object.keys(priceOverrides),
      ...Object.keys(scheduleStatus),
      ...Object.keys(scheduleDetails)
    ])
  ).sort();
}

export function buildDateSettings({
  baseDateSettings = DEFAULT_DATE_SETTINGS,
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  scheduleDetails = {},
  fallbackCapacity = 15,
  fallbackPrice = 30000
} = {}) {
  return getDateKeys({
    baseDateSettings,
    capacityOverrides,
    priceOverrides,
    scheduleStatus,
    scheduleDetails
  }).reduce((result, date) => {
    const base = baseDateSettings[date] || {};

    const capacity = Number(
      capacityOverrides[date] || base.capacity || fallbackCapacity
    );

    const price = Number(priceOverrides[date] || base.price || fallbackPrice);

    const configuredStatus = normalizeScheduleStatus(
      scheduleStatus[date] || base.status || "closed"
    );

    const status = isPastDateKey(date) ? "closed" : configuredStatus;

    const detail = normalizeScheduleDetail(
      scheduleDetails[date] || base.detail || ""
    );

    return {
      ...result,
      [date]: {
        ...base,
        capacity,
        price,
        status,
        detail
      }
    };
  }, {});
}
