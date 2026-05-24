import { SCHEDULE_STATUS } from "./statusConstants.js";
import { calculateRemainingSeats } from "./seatCapacityUtils.js";

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function isScheduleOpen(status = "") {
  return status === SCHEDULE_STATUS.OPEN;
}

export function getBookingAvailability({
  reservations = [],
  date = "",
  capacity = 0,
  scheduleStatus = SCHEDULE_STATUS.CLOSED,
  people = 1
} = {}) {
  const requestedPeople = Math.max(1, toSafeNumber(people, 1));
  const remainingSeats = calculateRemainingSeats({ reservations, date, capacity });

  if (!date) {
    return {
      available: false,
      reason: "예약 날짜를 선택해주세요.",
      remainingSeats
    };
  }

  if (!isScheduleOpen(scheduleStatus)) {
    return {
      available: false,
      reason: "선택한 날짜는 예약마감 상태입니다.",
      remainingSeats
    };
  }

  if (requestedPeople > remainingSeats) {
    return {
      available: false,
      reason: "잔여 좌석이 부족합니다.",
      remainingSeats
    };
  }

  return {
    available: true,
    reason: "",
    remainingSeats
  };
}

export function getAvailabilityLabel(availability = {}) {
  if (availability.available) {
    return "예약가능";
  }

  return availability.reason || "예약불가";
}
