import { RESERVATION_STATUS } from "./statusConstants.js";

function toSafeString(value) {
  return String(value || "").trim();
}

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function normalizeReservation(reservation = {}) {
  const people = Math.max(1, toSafeNumber(reservation.people, 1));
  const amount = Math.max(0, toSafeNumber(reservation.amount, 0));

  return {
    id: toSafeString(reservation.id),
    date: toSafeString(reservation.date),
    name: toSafeString(reservation.name),
    phone: toSafeString(reservation.phone),
    people,
    amount,
    status: reservation.status || RESERVATION_STATUS.PAYMENT_PENDING,
    createdAt: reservation.createdAt || new Date().toISOString()
  };
}

export function normalizeReservations(reservations = []) {
  if (!Array.isArray(reservations)) {
    return [];
  }

  return reservations.map(normalizeReservation);
}
