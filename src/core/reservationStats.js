import {
  RESERVATION_STATUS,
  isPaidReservationStatus,
  isPendingPaymentStatus,
  normalizeReservationStatusValue
} from "./statusConstants.js";

function toNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function calculateReservationStats(reservations = []) {
  return reservations.reduce(
    (stats, reservation) => {
      const people = toNumber(reservation.people);
      const amount = toNumber(reservation.amount);
      const status = normalizeReservationStatusValue(
        reservation.status || RESERVATION_STATUS.PAYMENT_PENDING
      );

      // 실결제 여부에 따라 나눠 담는다.
      // totalPeople / totalAmount 는 상태를 가리지 않는 단순 합계라
      // 매출 표시에는 쓰지 않는다. (paidAmount 를 쓸 것)
      const isPaid = isPaidReservationStatus(status);
      const isPending = isPendingPaymentStatus(status);

      return {
        totalReservations: stats.totalReservations + 1,
        totalPeople: stats.totalPeople + people,
        totalAmount: stats.totalAmount + amount,
        paidPeople: stats.paidPeople + (isPaid ? people : 0),
        paidAmount: stats.paidAmount + (isPaid ? amount : 0),
        pendingAmount: stats.pendingAmount + (isPending ? amount : 0),
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
            : stats.canceledReservations,
        failedReservations:
          status === RESERVATION_STATUS.PAYMENT_FAILED
            ? stats.failedReservations + 1
            : stats.failedReservations
      };
    },
    {
      totalReservations: 0,
      totalPeople: 0,
      totalAmount: 0,
      paidPeople: 0,
      paidAmount: 0,
      pendingAmount: 0,
      pendingReservations: 0,
      confirmedReservations: 0,
      canceledReservations: 0,
      failedReservations: 0
    }
  );
}

export function calculateDateReservationStats(reservations = [], date) {
  const dateReservations = reservations.filter(
    (reservation) => reservation.date === date
  );

  return calculateReservationStats(dateReservations);
}
