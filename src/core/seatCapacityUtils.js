import { RESERVATION_STATUS } from "./statusConstants.js";

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function isActiveReservation(reservation = {}) {
  return reservation.status !== RESERVATION_STATUS.CANCELED;
}

export function calculateReservedSeats(reservations = [], date = "") {
  return reservations.reduce((total, reservation) => {
    if (date && reservation.date !== date) {
      return total;
    }

    if (!isActiveReservation(reservation)) {
      return total;
    }

    return total + Math.max(0, toSafeNumber(reservation.people, 0));
  }, 0);
}

export function calculateRemainingSeats({
  reservations = [],
  date = "",
  capacity = 0
} = {}) {
  const safeCapacity = Math.max(0, toSafeNumber(capacity, 0));
  const reservedSeats = calculateReservedSeats(reservations, date);

  return Math.max(0, safeCapacity - reservedSeats);
}

export function canReserveSeats({
  reservations = [],
  date = "",
  capacity = 0,
  people = 1
} = {}) {
  const remainingSeats = calculateRemainingSeats({ reservations, date, capacity });
  const requestedPeople = Math.max(1, toSafeNumber(people, 1));

  return requestedPeople <= remainingSeats;
}

export function calculateSeatUsage({
  reservations = [],
  date = "",
  capacity = 0
} = {}) {
  const safeCapacity = Math.max(0, toSafeNumber(capacity, 0));
  const reservedSeats = calculateReservedSeats(reservations, date);
  const remainingSeats = Math.max(0, safeCapacity - reservedSeats);
  const usageRate = safeCapacity > 0 ? reservedSeats / safeCapacity : 0;

  return {
    capacity: safeCapacity,
    reservedSeats,
    remainingSeats,
    usageRate: Math.min(1, usageRate)
  };
}
