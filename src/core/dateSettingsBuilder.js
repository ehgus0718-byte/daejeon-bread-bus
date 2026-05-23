import { DEFAULT_DATE_SETTINGS } from "./reservationSchema.js";

export function buildDateSettings({
  baseDateSettings = DEFAULT_DATE_SETTINGS,
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  fallbackCapacity = 15,
  fallbackPrice = 30000
} = {}) {
  return Object.keys(baseDateSettings).reduce((result, date) => {
    const base = baseDateSettings[date] || {};

    return {
      ...result,
      [date]: {
        ...base,
        capacity: Number(
          capacityOverrides[date] || base.capacity || fallbackCapacity
        ),
        price: Number(priceOverrides[date] || base.price || fallbackPrice),
        status: scheduleStatus[date] || base.status || "closed"
      }
    };
  }, {});
}
