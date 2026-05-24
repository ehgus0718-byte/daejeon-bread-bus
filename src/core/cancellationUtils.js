import { RESERVATION_STATUS } from "./statusConstants.js";

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

function toDateTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function isReservationCancelable(reservation = {}) {
  if (reservation.status === RESERVATION_STATUS.CANCELED) {
    return false;
  }

  if (!reservation.date) {
    return true;
  }

  const reservationTime = toDateTime(`${reservation.date}T00:00:00`);
  const todayTime = new Date().setHours(0, 0, 0, 0);

  return reservationTime >= todayTime;
}

export function calculateRefundAmount({
  reservation = {},
  refundRate = 1
} = {}) {
  if (!isReservationCancelable(reservation)) {
    return 0;
  }

  const amount = Math.max(0, toSafeNumber(reservation.amount, 0));
  const safeRefundRate = Math.min(1, Math.max(0, toSafeNumber(refundRate, 1)));

  return Math.floor(amount * safeRefundRate);
}

export function createCanceledReservation(reservation = {}) {
  return {
    ...reservation,
    status: RESERVATION_STATUS.CANCELED,
    canceledAt: new Date().toISOString()
  };
}

export function cancelReservationById({ reservations = [], reservationId } = {}) {
  return reservations.map((reservation) => {
    if (reservation.id !== reservationId) {
      return reservation;
    }

    return createCanceledReservation(reservation);
  });
}
