import { DEFAULT_DATE_SETTINGS } from "./reservationSchema.js";

function normalizeScheduleStatus(value) {
  if (value === "모집중") return "open";
  if (value === "예약마감") return "closed";
  if (value === "open" || value === "closed") return value;
  return value || "closed";
}

function getDateKeys({ baseDateSettings = {}, capacityOverrides = {}, priceOverrides = {}, scheduleStatus = {} }) {
  return Array.from(
    new Set([
      ...Object.keys(baseDateSettings),
      ...Object.keys(capacityOverrides),
      ...Object.keys(priceOverrides),
      ...Object.keys(scheduleStatus)
    ])
  ).sort();
}

export function buildDateSettings({
  baseDateSettings = DEFAULT_DATE_SETTINGS,
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  fallbackCapacity = 15,
  fallbackPrice = 30000
} = {}) {
  return getDateKeys({
    baseDateSettings,
    capacityOverrides,
    priceOverrides,
    scheduleStatus
  }).reduce((result, date) => {
    const base = baseDateSettings[date] || {};
    const capacity = Number(
      capacityOverrides[date] || base.capacity || fallbackCapacity
    );
    const price = Number(priceOverrides[date] || base.price || fallbackPrice);
    const status = normalizeScheduleStatus(scheduleStatus[date] || base.status || "closed");

    return {
      ...result,
      [date]: {
        ...base,
        capacity,
        price,
        status
      }
    };
  }, {});
}
