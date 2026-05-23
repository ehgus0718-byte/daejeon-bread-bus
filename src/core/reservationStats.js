import { RESERVATION_STATUS } from "./statusConstants.js";

function toNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function calculateReservationStats(reservations = []) {
  return reservations.reduce(
    (stats, reservation) => {
      const people = toNumber(reservation.people);
      const amount = toNumber(reservation.amount);
      const status = reservation.status || RESERVATION_STATUS.PAYMENT_PENDING;

      return {
        totalReservations: stats.totalReservations + 1,
        totalPeople: stats.totalPeople + people,
        totalAmount: stats.totalAmount + amount,
        pendingReservations:
          status === RESERVATION_STATUS.PAYMENT_PENDING
            ? stats.pendingReservations + 1
            : stats.pendingReservations,
        confirmedReservations:
          status === RESERVATION_STATUS.CONFIRMED ||
          status === RESERVATION_STATUS.PAYMENT_COMPLETED
            ? stats.confirmedReservations + 1
            : stats.confirmedReservations,
        canceledReservations:
          status === RESERVATION_STATUS.CANCELED
            ? stats.canceledReservations + 1
            : stats.canceledReservations
      };
    },
    {
      totalReservations: 0,
      totalPeople: 0,
      totalAmount: 0,
      pendingReservations: 0,
      confirmedReservations: 0,
      canceledReservations: 0
    }
  );
}

export function calculateDateReservationStats(reservations = [], date) {
  const dateReservations = reservations.filter(
    (reservation) => reservation.date === date
  );

  return calculateReservationStats(dateReservations);
}
