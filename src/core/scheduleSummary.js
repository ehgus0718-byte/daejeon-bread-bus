import { getAvailabilityLabel, getBookingAvailability } from "./bookingAvailability.js";
import { calculateSeatUsage } from "./seatCapacityUtils.js";
import { SCHEDULE_STATUS } from "./statusConstants.js";

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function createScheduleSummary({
  date = "",
  dateSetting = {},
  reservations = [],
  requestedPeople = 1
} = {}) {
  const capacity = Math.max(0, toSafeNumber(dateSetting.capacity, 0));
  const price = Math.max(0, toSafeNumber(dateSetting.price, 0));
  const status = dateSetting.status || SCHEDULE_STATUS.CLOSED;
  const seatUsage = calculateSeatUsage({ reservations, date, capacity });
  const availability = getBookingAvailability({
    reservations,
    date,
    capacity,
    scheduleStatus: status,
    people: requestedPeople
  });

  return {
    date,
    capacity,
    price,
    status,
    reservedSeats: seatUsage.reservedSeats,
    remainingSeats: seatUsage.remainingSeats,
    usageRate: seatUsage.usageRate,
    available: availability.available,
    availabilityReason: availability.reason,
    availabilityLabel: getAvailabilityLabel(availability)
  };
}

export function createScheduleSummaries({
  dateSettings = {},
  reservations = [],
  requestedPeople = 1
} = {}) {
  return Object.entries(dateSettings).map(([date, dateSetting]) =>
    createScheduleSummary({
      date,
      dateSetting,
      reservations,
      requestedPeople
    })
  );
}

export function filterOpenScheduleSummaries(summaries = []) {
  return summaries.filter((summary) => summary.status === SCHEDULE_STATUS.OPEN);
}

export function filterAvailableScheduleSummaries(summaries = []) {
  return summaries.filter((summary) => summary.available);
}
